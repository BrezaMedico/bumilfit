import type { Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp.service.js';

export const getWhatsAppStatus = async (_req: Request, res: Response) => {
  try {
    const statusData = whatsappService.getStatus();
    return res.status(200).json({
      success: true,
      data: statusData,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Terjadi kesalahan saat memeriksa status WhatsApp',
    });
  }
};

export const reconnectWhatsApp = async (_req: Request, res: Response) => {
  try {
    const result = await whatsappService.reconnect();
    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: whatsappService.getStatus(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Gagal memulai penyambungan ulang WhatsApp',
    });
  }
};

export const logoutWhatsApp = async (_req: Request, res: Response) => {
  try {
    const result = await whatsappService.logout();
    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: whatsappService.getStatus(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Gagal logout WhatsApp',
    });
  }
};

export const sendTestOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp tujuan wajib diisi',
      });
    }

    const testOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await whatsappService.sendOtpMessage(phoneNumber, testOtpCode);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Pesan OTP uji coba berhasil dikirim ke nomor ${phoneNumber}`,
      otpCode: testOtpCode,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Gagal mengirim pesan OTP uji coba',
    });
  }
};
