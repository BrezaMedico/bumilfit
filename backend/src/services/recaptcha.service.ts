export const verifyRecaptchaToken = async (token?: string): Promise<boolean> => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Jika token tidak disertakan sama sekali
  if (!token) {
    // Jika secret key belum diset di development, beri toleransi dengan peringatan
    if (!secretKey) {
      console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY belum diset dan tidak ada token dikirim (development bypass).');
      return true;
    }
    return false;
  }

  // Dukungan token pengujian otomatis pada mode non-produksi
  if (process.env.NODE_ENV !== 'production' && token === 'test_recaptcha_mock_token') {
    return true;
  }

  // Jika secret key belum diset di environment backend (misal masa development lokal awal)
  if (!secretKey) {
    console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY belum diset di backend .env. Token diterima tetapi dilewati untuk testing lokal.');
    return true;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (data.success) {
      return true;
    }

    // Jika di development lokal atau domain localhost tidak terdaftar di Google console, jangan blokir login
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[reCAPTCHA] Verifikasi Google gagal di dev, dilewati untuk kenyamanan testing lokal:', data['error-codes']);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[reCAPTCHA] Gagal memverifikasi token reCAPTCHA ke Google:', error);
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  }
};
