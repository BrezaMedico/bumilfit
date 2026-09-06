interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Mengirim email menggunakan Brevo REST API (HTTPS Port 443)
 * dengan fallback ke Nodemailer SMTP jika BREVO_API_KEY tidak diset.
 */
export const sendAppEmail = async ({ to, subject, html, text }: SendEmailOptions): Promise<boolean> => {
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
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
        console.log(`✅ [Brevo API] Email berhasil dikirim ke: ${to} (Subject: ${subject})`);
        return true;
      }

      const errData = await response.json().catch(() => ({}));
      console.error(`⚠️ [Brevo API] Gagal kirim email:`, errData);
    } catch (brevoErr: any) {
      console.error(`⚠️ [Brevo API] Error koneksi:`, brevoErr?.message || brevoErr);
    }
  }

  // 2. FALLBACK: Nodemailer SMTP (untuk lingkungan lokal localhost)
  try {
    const rawPass = process.env.GOOGLE_APP_PASSKEY || '';
    const pass = rawPass.replace(/['"\s]+/g, '').trim();
    if (!pass) {
      console.warn('⚠️ [Email Service] GOOGLE_APP_PASSKEY dan BREVO_API_KEY tidak tersedia di environment.');
      return false;
    }

    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: senderEmail, pass },
    });

    await transporter.sendMail({
      from: `"BUMILFIT" <${senderEmail}>`,
      to,
      subject,
      html,
      text: text || '',
    });

    console.log(`✅ [Nodemailer] Email berhasil dikirim ke: ${to} (Subject: ${subject})`);
    return true;
  } catch (smtpErr: any) {
    console.error(`⚠️ [Nodemailer] Gagal kirim email ke ${to}:`, smtpErr?.message || smtpErr);
    return false;
  }
};
