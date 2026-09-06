interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  provider?: string;
  messageId?: string;
  error?: any;
}

/**
 * Mengirim email menggunakan Brevo REST API (HTTPS Port 443)
 * dengan fallback ke Nodemailer SMTP jika BREVO_API_KEY tidak diset.
 */
export const sendAppEmail = async ({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> => {
  const rawBrevo = process.env.BREVO_API_KEY || '';
  const brevoApiKey = rawBrevo.replace(/['"\s]+/g, '').trim();
  const senderEmail = (process.env.GOOGLE_APP_EMAIL || 'bumilfit@gmail.com').replace(/['"\s]+/g, '').trim();

  // 1. PRIORITAS UTAMA: Brevo REST API (HTTPS Port 443 - 100% lolos firewall Render Free Tier)
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'BUMILFIT', email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || '',
        }),
      });

      if (response.ok) {
        const resData: any = await response.json().catch(() => ({}));
        console.log(`✅ [Brevo API] Email berhasil dikirim ke: ${to} (Subject: ${subject})`);
        return { success: true, provider: 'Brevo REST API (HTTPS Port 443)', messageId: resData.messageId };
      }

      const errData = await response.json().catch(() => ({}));
      console.error(`⚠️ [Brevo API] Gagal kirim email:`, errData);
      return { success: false, provider: 'Brevo REST API', error: errData };
    } catch (brevoErr: any) {
      console.error(`⚠️ [Brevo API] Error koneksi:`, brevoErr?.message || brevoErr);
      return { success: false, provider: 'Brevo REST API', error: brevoErr?.message || brevoErr };
    }
  }

  // Jika Brevo API Key belum diset di Environment Variables
  console.warn('⚠️ [Email Service] BREVO_API_KEY belum diset di Environment Variables Render!');

  // 2. FALLBACK: Nodemailer SMTP (untuk lingkungan lokal localhost)
  try {
    const rawPass = process.env.GOOGLE_APP_PASSKEY || '';
    const pass = rawPass.replace(/['"\s]+/g, '').trim();
    if (!pass) {
      return {
        success: false,
        provider: 'None',
        error: 'BREVO_API_KEY belum diset di Environment Variables Render.',
      };
    }

    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: senderEmail, pass },
    });

    const info = await transporter.sendMail({
      from: `"BUMILFIT" <${senderEmail}>`,
      to,
      subject,
      html,
      text: text || '',
    });

    console.log(`✅ [Nodemailer] Email berhasil dikirim ke: ${to} (Subject: ${subject})`);
    return { success: true, provider: 'Nodemailer SMTP', messageId: info.messageId };
  } catch (smtpErr: any) {
    console.error(`⚠️ [Nodemailer] Gagal kirim email ke ${to}:`, smtpErr?.message || smtpErr);
    return {
      success: false,
      provider: 'Nodemailer SMTP (Ditolak oleh Firewall Render Free Tier)',
      error: smtpErr?.message || smtpErr,
    };
  }
};
