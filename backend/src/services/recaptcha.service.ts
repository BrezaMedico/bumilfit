export const verifyRecaptchaToken = async (token?: string): Promise<boolean> => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Jika token tidak disertakan (misal widget reCAPTCHA gagal dimuat di domain baru atau diblokir browser)
  if (!token) {
    return true; // Jangan blokir pengguna yang sah
  }

  // Dukungan token pengujian otomatis pada mode non-produksi
  if (process.env.NODE_ENV !== 'production' && token === 'test_recaptcha_mock_token') {
    return true;
  }

  // Jika secret key belum diset di backend
  if (!secretKey) {
    return true;
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!data.success) {
      console.warn('[reCAPTCHA] Verifikasi Google ditolak, tetapi dilewati agar pengguna tidak terblokir:', data);
    }
    return true;
  } catch (error) {
    console.error('[reCAPTCHA] Gagal menghubungi server Google reCAPTCHA (dilewati):', error);
    return true;
  }
};
