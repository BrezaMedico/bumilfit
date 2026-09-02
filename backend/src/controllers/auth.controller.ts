import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { generateAndSendOtp } from '../services/otp.service.js';

// Skema validasi Zod sesuai kebutuhan spesifikasi
const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(['IBU_HAMIL', 'DOKTER']),
  namaIbu: z.string().optional(),
  usiaKehamilanMinggu: z.number().optional(),
  usiaKehamilanHari: z.number().optional(),
  nomorWhatsapp: z.string().optional(),
  namaAnak: z.string().optional().nullable(),
  genderAnak: z.string().optional().nullable(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData: any = {
      email: data.email,
      password: hashedPassword,
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

    // Panggil layanan OTP di sini!
    await generateAndSendOtp(newUser.id, newUser.email);

    res.status(201).json({ 
      message: 'Registrasi berhasil. Silakan cek email untuk OTP.',
      userId: newUser.id 
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
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
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

    res.status(200).json({ message: 'Login berhasil', role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// Fungsi baru untuk Verifikasi OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { userId, kode } = req.body;

    const otpRecord = await prisma.otpVerification.findUnique({ where: { userId } });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Sesi OTP tidak ditemukan' });
    }

    if (otpRecord.jumlahPercobaan >= 5) {
      return res.status(429).json({ message: 'Terlalu banyak percobaan gagal. Silakan minta OTP baru.' });
    }

    if (new Date() > otpRecord.expiredAt) {
      return res.status(400).json({ message: 'Kode OTP telah kedaluwarsa' });
    }

    if (otpRecord.kode !== kode) {
      await prisma.otpVerification.update({
        where: { userId },
        data: { jumlahPercobaan: { increment: 1 } }
      });
      return res.status(400).json({ message: 'Kode OTP salah' });
    }

    // Jika sukses, ubah status user dan hapus record OTP
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });

    await prisma.otpVerification.delete({ where: { userId } });

    res.status(200).json({ message: 'Verifikasi berhasil! Akun telah aktif.' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
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

    res.status(200).json({
      email: user.email,
      role: user.role,
      profilIbu: user.profilIbu,
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
      namaIbu,
      nomorWhatsapp,
      namaAnak,
      genderAnak,
      golonganDarah,
      fotoProfil,
      alamat,
      usiaKehamilanUpdatedAt,
    };

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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password lama salah' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengganti password' });
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

