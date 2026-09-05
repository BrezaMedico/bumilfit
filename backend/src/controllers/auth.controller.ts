import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { generateAndSendOtp } from '../services/otp.service.js';
import { getUserSubscription } from '../services/subscription.service.js';
import { verifyRecaptchaToken } from '../services/recaptcha.service.js';

// Skema validasi Zod sesuai kebutuhan spesifikasi
const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  authMethod: z.enum(['manual', 'google']).optional().default('manual'),
  googleRegistrationToken: z.string().optional(),
  role: z.enum(['IBU_HAMIL', 'DOKTER']).default('IBU_HAMIL'),
  namaIbu: z.string().optional(),
  usiaKehamilanMinggu: z.number().optional(),
  usiaKehamilanHari: z.number().optional(),
  nomorWhatsapp: z.string().optional(),
  namaAnak: z.string().optional().nullable(),
  genderAnak: z.string().optional().nullable(),
  channel: z.enum(['email', 'whatsapp']).optional().default('email'),
  recaptchaToken: z.string().optional(),
});

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { email, credential, recaptchaToken } = req.body;

    // Verifikasi reCAPTCHA token jika disertakan
    if (recaptchaToken) {
      const isHuman = await verifyRecaptchaToken(recaptchaToken);
      if (!isHuman) {
        return res.status(400).json({ message: 'Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.' });
      }
    }

    let verifiedEmail = '';

    // Jika credential JWT dari Google Identity Services dikirimkan, decode payload
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email && payload.email_verified) {
            verifiedEmail = payload.email.toLowerCase().trim();
          }
        }
      } catch (e) {
        console.error("Gagal mendecode credential Google:", e);
      }
    }

    if (!verifiedEmail && email) {
      verifiedEmail = String(email).toLowerCase().trim();
    }

    if (!verifiedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifiedEmail)) {
      return res.status(400).json({ message: 'Format alamat email Google tidak valid' });
    }

    // Periksa apakah user dengan email ini sudah ada di database
    const existingUser = await prisma.user.findUnique({
      where: { email: verifiedEmail },
      include: { profilIbu: true }
    });

    if (existingUser) {
      // Jika user sudah ada namun belum berstatus aktif, aktifkan karena email terbukti valid via Google
      if (!existingUser.isVerified) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { 
            isVerified: true,
            authProvider: 'GOOGLE'
          }
        });
      }

      // Buat token JWT sesi aktif
      const token = jwt.sign(
        { id: existingUser.id, role: existingUser.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
      );

      res.cookie('jwt_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      // Update aktivitas terakhir & pastikan pengingat aktif (auto-resume jika sebelumnya di-pause)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          lastActiveAt: new Date(),
          reminderAutoPaused: false,
        },
      });

      return res.status(200).json({
        message: 'Login dengan Google berhasil',
        isNewUser: false,
        token,
        role: existingUser.role,
        email: existingUser.email
      });
    }

    // User belum pernah terdaftar: terbitkan googleRegistrationToken (berlaku 15 menit)
    const googleRegistrationToken = jwt.sign(
      { email: verifiedEmail, authProvider: 'GOOGLE', purpose: 'GOOGLE_REGISTER' },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      message: 'Akun Google terverifikasi. Silakan lengkapi pendaftaran.',
      isNewUser: true,
      email: verifiedEmail,
      googleRegistrationToken
    });
  } catch (error) {
    console.error("DEBUG GOOGLE AUTH ERROR:", error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server saat autentikasi Google' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Verifikasi reCAPTCHA token
    const isHuman = await verifyRecaptchaToken(data.recaptchaToken);
    if (!isHuman) {
      return res.status(400).json({ message: 'Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.' });
    }

    // ==========================================
    // ALUR REGISTRASI DENGAN GOOGLE
    // ==========================================
    if (data.authMethod === 'google') {
      if (!data.googleRegistrationToken) {
        return res.status(400).json({ message: 'Token registrasi Google tidak valid atau tidak ditemukan' });
      }

      let verifiedGoogleEmail = '';
      try {
        const decoded = jwt.verify(
          data.googleRegistrationToken,
          process.env.JWT_SECRET as string
        ) as { email: string; authProvider: string; purpose: string };

        if (decoded.purpose !== 'GOOGLE_REGISTER' || !decoded.email) {
          return res.status(400).json({ message: 'Token registrasi Google tidak valid' });
        }
        verifiedGoogleEmail = decoded.email.toLowerCase().trim();
      } catch {
        return res.status(400).json({ message: 'Sesi registrasi Google telah kedaluwarsa. Silakan ulangi autentikasi Google.' });
      }

      if (data.email.toLowerCase().trim() !== verifiedGoogleEmail) {
        return res.status(400).json({ message: 'Email tidak sesuai dengan akun Google yang diautentikasi' });
      }

      const cleanWa = (data.nomorWhatsapp || '').trim();
      if (!cleanWa || cleanWa.length < 8) {
        return res.status(400).json({ message: 'Nomor telepon/WhatsApp wajib diisi (minimal 8 digit)' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: verifiedGoogleEmail },
        include: { profilIbu: true }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email Google ini sudah terdaftar. Silakan langsung login dengan Google.' });
      }

      // Buat akun Google tanpa password (null) sesuai spesifikasi sistem
      const newUserData: any = {
        email: verifiedGoogleEmail,
        password: null, // Akun Google tidak memiliki password manual
        authProvider: 'GOOGLE',
        role: data.role || 'IBU_HAMIL',
        isVerified: true, // Email sudah tervalidasi oleh Google
      };

      if (data.role === 'IBU_HAMIL') {
        newUserData.profilIbu = {
          create: {
            namaIbu: data.namaIbu || '',
            usiaKehamilanMinggu: data.usiaKehamilanMinggu || 0,
            usiaKehamilanHari: data.usiaKehamilanHari || 0,
            nomorWhatsapp: cleanWa,
            namaAnak: data.namaAnak || null,
            genderAnak: data.genderAnak || null,
          }
        };
      }

      const newUser = await prisma.user.create({
        data: newUserData,
        include: { profilIbu: true }
      });

      // Generate JWT auth session
      const token = jwt.sign(
        { id: newUser.id, role: newUser.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
      );

      res.cookie('jwt_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.status(201).json({
        message: 'Pendaftaran dengan Google berhasil!',
        userId: newUser.id,
        role: newUser.role,
        token,
        authMethod: 'google'
      });
    }

    // ==========================================
    // ALUR REGISTRASI EMAIL MANUAL (Tetap Utuh)
    // ==========================================
    if (!data.password || data.password.length < 6) {
      return res.status(400).json({ message: 'Kata sandi minimal 6 karakter wajib diisi untuk pendaftaran email manual' });
    }

    const selectedChannel = data.channel || 'email';

    const existingUser = await prisma.user.findUnique({ 
      where: { email: data.email },
      include: { profilIbu: true }
    });

    if (existingUser) {
      if (!existingUser.isVerified) {
        // Jika akun sebelumnya belum diverifikasi, perbarui password & kontak, lalu kirim ulang OTP
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            authProvider: 'LOCAL',
            profilIbu: {
              upsert: {
                create: {
                  namaIbu: data.namaIbu || '',
                  usiaKehamilanMinggu: data.usiaKehamilanMinggu || 0,
                  usiaKehamilanHari: data.usiaKehamilanHari || 0,
                  nomorWhatsapp: data.nomorWhatsapp || '',
                  namaAnak: data.namaAnak || null,
                  genderAnak: data.genderAnak || null,
                },
                update: {
                  nomorWhatsapp: data.nomorWhatsapp || existingUser.profilIbu?.nomorWhatsapp || '',
                }
              }
            }
          }
        });

        await generateAndSendOtp(
          existingUser.id, 
          existingUser.email, 
          selectedChannel, 
          data.nomorWhatsapp || existingUser.profilIbu?.nomorWhatsapp || undefined
        );

        return res.status(200).json({ 
          message: selectedChannel === 'whatsapp' 
            ? 'Kode OTP telah dikirimkan ke WhatsApp Anda.' 
            : 'Kode OTP telah dikirimkan ke Email Anda.',
          userId: existingUser.id,
          channel: selectedChannel
        });
      }

      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData: any = {
      email: data.email,
      password: hashedPassword,
      authProvider: 'LOCAL',
      role: data.role,
      isVerified: false, // Menunggu verifikasi OTP
    };

    if (data.role === 'IBU_HAMIL') {
      userData.profilIbu = {
        create: {
          namaIbu: data.namaIbu || '',
          usiaKehamilanMinggu: data.usiaKehamilanMinggu || 0,
          usiaKehamilanHari: data.usiaKehamilanHari || 0,
          nomorWhatsapp: data.nomorWhatsapp || '',
          namaAnak: data.namaAnak || null,
          genderAnak: data.genderAnak || null,
        }
      };
    }

    const newUser = await prisma.user.create({
      data: userData
    });

    // Panggil layanan OTP (default email)
    await generateAndSendOtp(newUser.id, newUser.email, selectedChannel, data.nomorWhatsapp);

    res.status(201).json({ 
      message: selectedChannel === 'whatsapp'
        ? 'Registrasi berhasil. Silakan cek WhatsApp Anda untuk kode OTP.'
        : 'Registrasi berhasil. Silakan cek Email Anda untuk kode OTP.',
      userId: newUser.id,
      channel: selectedChannel
    });
  } catch (error) {
    console.error("DEBUG REGISTER ERROR:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    // Verifikasi reCAPTCHA token
    const isHuman = await verifyRecaptchaToken(recaptchaToken);
    if (!isHuman) {
      return res.status(400).json({ message: 'Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    if (user.authProvider === 'GOOGLE' || !user.password) {
      return res.status(400).json({ 
        message: 'Akun ini terdaftar menggunakan akun Google. Silakan masuk menggunakan tombol "Pakai Google".' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    // Email yang sedang digunakan dalam proses pendaftaran belum boleh dianggap sebagai akun aktif
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Akun Anda belum aktif. Silakan selesaikan proses verifikasi OTP terlebih dahulu.',
        isUnverified: true,
        userId: user.id
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '1d' }
    );

    // Set HTTP-Only Cookie
    res.cookie('jwt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 hari
    });

    // Update aktivitas terakhir & pastikan pengingat aktif (auto-resume jika sebelumnya di-pause)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date(),
        reminderAutoPaused: false,
      },
    });

    res.status(200).json({ message: 'Login berhasil', role: user.role, token });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// Fungsi untuk Verifikasi OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { userId, kode } = req.body;

    const otpRecord = await prisma.otpVerification.findUnique({ where: { userId } });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Sesi OTP tidak ditemukan atau telah kedaluwarsa' });
    }

    if (otpRecord.jumlahPercobaan >= 5) {
      return res.status(429).json({ message: 'Terlalu banyak percobaan gagal. Silakan minta OTP baru.' });
    }

    if (new Date() > otpRecord.expiredAt) {
      return res.status(400).json({ message: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.' });
    }

    if (otpRecord.kode !== kode) {
      await prisma.otpVerification.update({
        where: { userId },
        data: { jumlahPercobaan: { increment: 1 } }
      });
      return res.status(400).json({ message: 'Kode OTP salah. Silakan periksa kembali.' });
    }

    // Jika sukses, ubah status user dan hapus record OTP
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });

    await prisma.otpVerification.delete({ where: { userId } });

    // Generate JWT dan set cookie agar sesi login aktif untuk langkah berikutnya
    const token = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '1d' }
    );

    res.cookie('jwt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 hari
    });

    res.status(200).json({ 
      message: 'Verifikasi berhasil! Akun Anda telah aktif.', 
      role: updatedUser.role,
      userId: updatedUser.id,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { userId, channel } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID wajib disertakan' });
    }

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { profilIbu: true }
    });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Akun sudah terverifikasi. Silakan langsung login.' });
    }

    const targetChannel: 'email' | 'whatsapp' = channel === 'whatsapp' ? 'whatsapp' : 'email';

    await generateAndSendOtp(
      user.id, 
      user.email, 
      targetChannel, 
      user.profilIbu?.nomorWhatsapp || undefined
    );

    const successMessage = targetChannel === 'whatsapp'
      ? 'Kode OTP baru berhasil dikirimkan ke WhatsApp Anda.'
      : 'Kode OTP baru berhasil dikirimkan ke Email Anda.';

    res.status(200).json({ 
      message: successMessage,
      channel: targetChannel
    });
  } catch (error) {
    console.error('DEBUG RESEND OTP ERROR:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengirim ulang OTP' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profilIbu: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Update aktivitas pengguna & auto-resume pengingat jika user aktif kembali
    if (user.reminderAutoPaused || !user.lastActiveAt || (Date.now() - new Date(user.lastActiveAt).getTime() > 30 * 60 * 1000)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActiveAt: new Date(),
          reminderAutoPaused: false,
        },
      });
    }

    const subscription = await getUserSubscription(userId);

    res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      profilIbu: user.profilIbu,
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { namaIbu, nomorWhatsapp, namaAnak, genderAnak, usiaKehamilanMinggu, usiaKehamilanHari, golonganDarah, fotoProfil, alamat, kategoriSkrining, sudahSkrining, skorSkrining } = req.body;

    const existingProfile = await prisma.profilIbuHamil.findUnique({
      where: { userId }
    });

    let usiaKehamilanUpdatedAt = existingProfile?.usiaKehamilanUpdatedAt || new Date();
    
    let isPregnancyAgeChanged = false;
    if (existingProfile) {
      if (usiaKehamilanMinggu !== undefined && existingProfile.usiaKehamilanMinggu !== Number(usiaKehamilanMinggu)) {
        isPregnancyAgeChanged = true;
      }
      if (usiaKehamilanHari !== undefined && existingProfile.usiaKehamilanHari !== Number(usiaKehamilanHari)) {
        isPregnancyAgeChanged = true;
      }
    }
    
    if (isPregnancyAgeChanged) {
      usiaKehamilanUpdatedAt = new Date();
    }

    const updateData: any = {
      usiaKehamilanUpdatedAt,
    };

    if (namaIbu !== undefined) updateData.namaIbu = namaIbu;
    if (nomorWhatsapp !== undefined) updateData.nomorWhatsapp = nomorWhatsapp;
    if (namaAnak !== undefined) updateData.namaAnak = namaAnak;
    if (genderAnak !== undefined) updateData.genderAnak = genderAnak;
    if (golonganDarah !== undefined) updateData.golonganDarah = golonganDarah;
    if (fotoProfil !== undefined) updateData.fotoProfil = fotoProfil;
    if (alamat !== undefined) updateData.alamat = alamat;
    if (usiaKehamilanMinggu !== undefined) {
      updateData.usiaKehamilanMinggu = Number(usiaKehamilanMinggu);
    }
    if (usiaKehamilanHari !== undefined) {
      updateData.usiaKehamilanHari = Number(usiaKehamilanHari);
    }
    if (kategoriSkrining !== undefined) {
      updateData.kategoriSkrining = kategoriSkrining;
    }
    if (sudahSkrining !== undefined) {
      updateData.sudahSkrining = sudahSkrining === true || sudahSkrining === 'true';
    }
    if (skorSkrining !== undefined) {
      updateData.skorSkrining = Number(skorSkrining);
    }

    const updatedProfile = await prisma.profilIbuHamil.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        namaIbu: namaIbu || '',
        nomorWhatsapp: nomorWhatsapp || '',
        namaAnak: namaAnak || null,
        genderAnak: genderAnak || null,
        usiaKehamilanMinggu: usiaKehamilanMinggu !== undefined ? Number(usiaKehamilanMinggu) : 0,
        usiaKehamilanHari: usiaKehamilanHari !== undefined ? Number(usiaKehamilanHari) : 0,
        golonganDarah: golonganDarah || null,
        fotoProfil: fotoProfil || null,
        alamat: alamat || null,
        kategoriSkrining: kategoriSkrining || 'Risiko Rendah',
        sudahSkrining: sudahSkrining !== undefined ? (sudahSkrining === true || sudahSkrining === 'true') : false,
        skorSkrining: skorSkrining !== undefined ? Number(skorSkrining) : null,
        usiaKehamilanUpdatedAt: new Date(),
      }
    });

    res.status(200).json({ message: 'Profil berhasil diperbarui', profilIbu: updatedProfile });
  } catch (error) {
    console.error("DEBUG UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat memperbarui profil' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
      return res.status(400).json({ message: 'Kata sandi saat ini wajib diisi' });
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'Kata sandi baru wajib diisi' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.authProvider === 'GOOGLE' || !user.password) {
      return res.status(400).json({ 
        message: 'Akun Anda menggunakan metode autentikasi Google dan tidak memiliki kata sandi manual.' 
      });
    }

    // Verifikasi kecocokan hash kata sandi lama
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Kata sandi saat ini yang Anda masukkan salah' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Kata sandi baru minimal 8 karakter' });
    }

    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);
    if (!hasLetters || !hasNumbers) {
      return res.status(400).json({ message: 'Kata sandi baru harus mengandung kombinasi huruf dan angka' });
    }

    // Hashing satu arah aman dengan bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Kata sandi berhasil diperbarui' });
  } catch (error) {
    console.error('DEBUG CHANGE PASSWORD ERROR:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengganti kata sandi' });
  }
};

const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email || '';
  const parts = email.split('@');
  const user = parts[0] || '';
  const domain = parts[1] || '';
  if (user.length <= 2) {
    return `${user.charAt(0)}***@${domain}`;
  }
  return `${user.charAt(0)}***${user.charAt(user.length - 1)}@${domain}`;
};

const maskPhone = (phone: string): string => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 7) {
    return `${clean.slice(0, 2)}****`;
  }
  const prefix = clean.slice(0, 2);
  const suffix = clean.slice(-3);
  return `${prefix}******${suffix}`;
};

export const requestPasswordOtp = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { channel = 'email' } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profilIbu: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    if (user.authProvider === 'GOOGLE' || !user.password) {
      return res.status(400).json({ 
        message: 'Akun Anda menggunakan autentikasi Google dan tidak memiliki kata sandi manual.' 
      });
    }

    const email = user.email;
    const phone = user.profilIbu?.nomorWhatsapp || '';

    if (channel === 'whatsapp' && !phone) {
      return res.status(400).json({ 
        message: 'Nomor WhatsApp belum terdaftar di profil Anda. Silakan lengkapi nomor WhatsApp di Profil atau gunakan metode Email.' 
      });
    }

    const otpCode = await generateAndSendOtp(user.id, email, channel as 'email' | 'whatsapp', phone);

    const maskedEmail = maskEmail(email);
    const maskedPhone = maskPhone(phone);
    const destination = channel === 'whatsapp' ? maskedPhone : maskedEmail;

    res.status(200).json({
      message: `Kode verifikasi OTP berhasil dikirimkan ke ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}.`,
      channel,
      destination,
      maskedEmail,
      maskedPhone,
      otpDev: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  } catch (error) {
    console.error('DEBUG REQUEST PASSWORD OTP ERROR:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat meminta kode OTP' });
  }
};

export const verifyPasswordOtp = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { kode } = req.body;

    if (!kode) {
      return res.status(400).json({ message: 'Kode OTP wajib diisi' });
    }

    const otpRecord = await prisma.otpVerification.findUnique({ where: { userId } });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Sesi OTP tidak ditemukan atau telah kedaluwarsa. Silakan minta kode baru.' });
    }

    if (new Date() > otpRecord.expiredAt) {
      return res.status(400).json({ message: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.' });
    }

    if (otpRecord.kode !== String(kode).trim()) {
      await prisma.otpVerification.update({
        where: { userId },
        data: { jumlahPercobaan: { increment: 1 } }
      });
      return res.status(400).json({ message: 'Kode OTP tidak valid. Silakan periksa kembali kode yang Anda masukkan.' });
    }

    // OTP valid: terbitkan token reset password sementara (15 menit)
    const resetToken = jwt.sign(
      { userId, purpose: 'PASSWORD_RESET' },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );

    // Hapus sesi OTP
    await prisma.otpVerification.delete({ where: { userId } });

    res.status(200).json({
      message: 'Verifikasi berhasil. Silakan buat kata sandi baru.',
      resetToken
    });
  } catch (error) {
    console.error('DEBUG VERIFY PASSWORD OTP ERROR:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat memverifikasi OTP' });
  }
};

export const resetPasswordWithOtp = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { newPassword, resetToken } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Kata sandi baru minimal 8 karakter.' });
    }

    if (!resetToken) {
      return res.status(400).json({ message: 'Sesi verifikasi OTP tidak valid. Silakan lakukan verifikasi ulang.' });
    }

    try {
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string) as any;
      if (decoded.userId !== userId || decoded.purpose !== 'PASSWORD_RESET') {
        return res.status(400).json({ message: 'Sesi verifikasi OTP tidak valid atau kedaluwarsa.' });
      }
    } catch {
      return res.status(400).json({ message: 'Sesi verifikasi OTP kedaluwarsa. Silakan verifikasi ulang.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Kata sandi berhasil diubah.' });
  } catch (error) {
    console.error('DEBUG RESET PASSWORD ERROR:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengubah kata sandi' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('jwt_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.status(200).json({ message: 'Logout berhasil' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat logout' });
  }
};

export const requestDeleteAccountOtp = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { channel = 'email' } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profilIbu: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const targetChannel: 'email' | 'whatsapp' = channel === 'whatsapp' ? 'whatsapp' : 'email';

    if (targetChannel === 'whatsapp' && !user.profilIbu?.nomorWhatsapp) {
      return res.status(400).json({ 
        message: 'Nomor WhatsApp belum terdaftar di profil Anda. Silakan pilih metode Email atau lengkapi nomor WhatsApp terlebih dahulu.' 
      });
    }

    await generateAndSendOtp(
      user.id,
      user.email,
      targetChannel,
      user.profilIbu?.nomorWhatsapp || undefined
    );

    const destination = targetChannel === 'whatsapp' 
      ? `WhatsApp (+${user.profilIbu?.nomorWhatsapp})`
      : `Email (${user.email})`;

    res.status(200).json({
      message: `Kode OTP verifikasi hapus akun berhasil dikirim ke ${destination}.`,
      channel: targetChannel
    });
  } catch (error) {
    console.error('DEBUG REQUEST DELETE ACCOUNT OTP ERROR:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengirim OTP hapus akun' });
  }
};

export const confirmDeleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { kode } = req.body;

    if (!kode || String(kode).trim().length === 0) {
      return res.status(400).json({ message: 'Kode OTP wajib diisi' });
    }

    const otpRecord = await prisma.otpVerification.findUnique({
      where: { userId }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Tidak ada permintaan OTP aktif. Silakan minta kode OTP baru.' });
    }

    if (new Date() > otpRecord.expiredAt) {
      return res.status(400).json({ message: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.' });
    }

    if (otpRecord.kode !== String(kode).trim()) {
      await prisma.otpVerification.update({
        where: { userId },
        data: { jumlahPercobaan: { increment: 1 } }
      });
      return res.status(400).json({ message: 'Kode OTP salah. Silakan periksa kembali kode Anda.' });
    }

    // OTP Valid -> Hapus user secara permanen dari database
    await prisma.user.delete({
      where: { id: userId }
    });

    // Clear session cookies
    res.clearCookie('jwt_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      message: 'Akun Anda beserta seluruh data terkait telah berhasil dihapus secara permanen.'
    });
  } catch (error) {
    console.error('DEBUG CONFIRM DELETE ACCOUNT ERROR:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat menghapus akun' });
  }
};


