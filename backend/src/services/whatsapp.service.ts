import fs from 'fs';
import path from 'path';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  type WASocket,
  type ConnectionState,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';

export type WhatsAppConnectionStatus = 
  | 'WAITING_FOR_QR' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'DISCONNECTED' 
  | 'LOGGED_OUT' 
  | 'ERROR';

class WhatsAppService {
  private sock: WASocket | null = null;
  private status: WhatsAppConnectionStatus = 'DISCONNECTED';
  private qrCodeDataUrl: string | null = null;
  private phoneNumber: string | null = null;
  private connectedAt: Date | null = null;
  private isInitializing: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private sessionPath: string;

  constructor() {
    this.sessionPath = path.resolve(
      process.cwd(), 
      process.env.WHATSAPP_SESSION_PATH || './whatsapp_session'
    );
  }

  public getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCodeDataUrl,
      phoneNumber: this.phoneNumber,
      isConnected: this.status === 'CONNECTED',
      connectedAt: this.connectedAt,
    };
  }

  private cleanupSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('messages.upsert');
        this.sock.end(undefined);
      } catch (e) {
        // abaikan jika sudah tertutup
      }
      this.sock = null;
    }
  }

  private scheduleReconnect(delayMs: number) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.init();
    }, delayMs);
  }

  public async init(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.cleanupSocket();

      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      this.status = 'CONNECTING';
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // Inisialisasi Baileys Socket dengan konfigurasi stabil
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        syncFullHistory: false, // Hindari sync riwayat chat lama yang memicu pemutusan socket
        markOnlineOnConnect: false,
        emitOwnEvents: false,
      });

      // Tangani event update koneksi
      this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 320,
              color: {
                dark: '#194668',
                light: '#FFFFFF',
              },
            });
            this.status = 'WAITING_FOR_QR';
            console.log('📱 [WhatsApp Gateway] QR Code baru siap di-scan.');
          } catch (qrErr) {
            console.error('⚠️ [WhatsApp Gateway] Gagal men-generate QR Code:', qrErr);
          }
        }

        if (connection === 'connecting') {
          if (this.status !== 'WAITING_FOR_QR') {
            this.status = 'CONNECTING';
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrCodeDataUrl = null;
          this.connectedAt = new Date();

          const rawJid = this.sock?.user?.id || '';
          this.phoneNumber = rawJid.split(':')[0] || rawJid.split('@')[0] || 'Terhubung';

          console.log(`✅ [WhatsApp Gateway] Berhasil terhubung stabil dengan nomor: +${this.phoneNumber}`);
        } else if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const isRestartRequired = statusCode === DisconnectReason.restartRequired; // 515
          const isReplaced = statusCode === DisconnectReason.connectionReplaced; // 440

          console.log(`🔌 [WhatsApp Gateway] Koneksi terputus. Kode: ${statusCode}. Logged out: ${isLoggedOut}`);

          if (isLoggedOut) {
            this.status = 'LOGGED_OUT';
            this.phoneNumber = null;
            this.connectedAt = null;
            this.qrCodeDataUrl = null;
            this.clearSessionFolder();

            // Generate sesi QR baru setelah logout resmi
            this.scheduleReconnect(2000);
          } else if (isRestartRequired) {
            // Kode 515 adalah sinkronisasi awal normal WhatsApp; sambung ulang langsung
            console.log('🔄 [WhatsApp Gateway] Sinkronisasi WhatsApp selesai (515), menyambungkan ulang sesi...');
            this.scheduleReconnect(1000);
          } else if (isReplaced) {
            // Sesi diambil alih oleh perangkat atau instance lain
            console.warn('⚠️ [WhatsApp Gateway] Sesi digantikan oleh koneksi lain (440). Menghentikan auto-reconnect agar tidak looping.');
            this.status = 'DISCONNECTED';
          } else {
            this.status = 'DISCONNECTED';
            // Auto reconnect dengan jeda stabil jika terputus jaringan biasa
            this.scheduleReconnect(5000);
          }
        }
      });

      // Tangani penyimpanan credential saat sesi diperbarui
      this.sock.ev.on('creds.update', saveCreds);

    } catch (error) {
      console.error('❌ [WhatsApp Gateway] Kesalahan saat inisialisasi socket:', error);
      this.status = 'ERROR';
    } finally {
      this.isInitializing = false;
    }
  }

  public async reconnect(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 [WhatsApp Gateway] Memulai penyambungan ulang...');
      this.cleanupSocket();
      this.clearSessionFolder();
      this.status = 'CONNECTING';
      this.qrCodeDataUrl = null;
      this.phoneNumber = null;
      this.connectedAt = null;

      await this.init();
      return { success: true, message: 'Penyambungan ulang WhatsApp berhasil dimulai' };
    } catch (error: any) {
      console.error('⚠️ [WhatsApp Gateway] Gagal reconnect:', error);
      this.status = 'ERROR';
      return { success: false, message: error?.message || 'Gagal menyambungkan ulang' };
    }
  }

  public async logout(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚪 [WhatsApp Gateway] Melakukan logout WhatsApp...');
      if (this.sock) {
        try {
          await this.sock.logout();
        } catch (e) {
          console.warn('Socket logout warning:', e);
        }
        try {
          this.sock.end(undefined);
        } catch (e) {}
        this.sock = null;
      }

      this.clearSessionFolder();
      this.status = 'LOGGED_OUT';
      this.phoneNumber = null;
      this.connectedAt = null;
      this.qrCodeDataUrl = null;

      // Segera generate QR baru agar admin bisa menyambungkan kembali kapan saja
      setTimeout(() => {
        this.init();
      }, 1500);

      return { success: true, message: 'Sesi WhatsApp berhasil diputuskan' };
    } catch (error: any) {
      console.error('⚠️ [WhatsApp Gateway] Gagal logout:', error);
      return { success: false, message: error?.message || 'Gagal logout WhatsApp' };
    }
  }

  public async sendOtpMessage(recipientPhone: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    if (this.status !== 'CONNECTED' || !this.sock) {
      const errMsg = 'WhatsApp Gateway belum terhubung. Silakan hubungkan WhatsApp melalui dashboard administrator.';
      console.warn(`⚠️ [WhatsApp Gateway] ${errMsg}`);
      return { success: false, message: errMsg };
    }

    try {
      // Standarisasi format nomor HP Indonesia
      let clean = recipientPhone.replace(/\D/g, '');
      if (clean.startsWith('08')) {
        clean = '62' + clean.slice(1);
      } else if (clean.startsWith('8')) {
        clean = '62' + clean;
      } else if (!clean.startsWith('62')) {
        clean = '62' + clean;
      }

      const jid = `${clean}@s.whatsapp.net`;

      const messageText = 
`🔐 *Kode Verifikasi BUMILFIT*

Halo, kode OTP Anda untuk verifikasi akun BUMILFIT adalah:

*${otpCode}*

Kode ini berlaku selama *5 menit*.

Demi keamanan akun Anda, jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengatasnamakan BUMILFIT.

Jika Anda tidak meminta kode ini, abaikan pesan ini.

Terima kasih,
*BUMILFIT*`;

      await this.sock.sendMessage(jid, { text: messageText });
      console.log(`✅ [WhatsApp Gateway] Pesan OTP (${otpCode}) berhasil terkirim ke WhatsApp: +${clean}`);
      return { success: true, message: `OTP berhasil dikirim ke +${clean}` };
    } catch (error: any) {
      console.error('❌ [WhatsApp Gateway] Gagal mengirim pesan OTP:', error);
      return { success: false, message: error?.message || 'Gagal mengirim pesan WhatsApp' };
    }
  }

  public async sendMessage(recipientPhone: string, messageText: string): Promise<{ success: boolean; message: string }> {
    if (this.status !== 'CONNECTED' || !this.sock) {
      const errMsg = 'WhatsApp Gateway belum terhubung. Silakan hubungkan WhatsApp melalui dashboard administrator.';
      console.warn(`⚠️ [WhatsApp Gateway] ${errMsg}`);
      return { success: false, message: errMsg };
    }

    try {
      // Standarisasi format nomor HP Indonesia
      let clean = recipientPhone.replace(/\D/g, '');
      if (clean.startsWith('08')) {
        clean = '62' + clean.slice(1);
      } else if (clean.startsWith('8')) {
        clean = '62' + clean;
      } else if (!clean.startsWith('62')) {
        clean = '62' + clean;
      }

      const jid = `${clean}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text: messageText });
      console.log(`✅ [WhatsApp Gateway] Pesan pengingat berhasil terkirim ke WhatsApp: +${clean}`);
      return { success: true, message: `Pesan berhasil dikirim ke +${clean}` };
    } catch (error: any) {
      console.error('❌ [WhatsApp Gateway] Gagal mengirim pesan WhatsApp:', error);
      return { success: false, message: error?.message || 'Gagal mengirim pesan WhatsApp' };
    }
  }

  private clearSessionFolder() {
    try {
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
        fs.mkdirSync(this.sessionPath, { recursive: true });
        console.log('🧹 [WhatsApp Gateway] Folder sesi lama berhasil dibersihkan.');
      }
    } catch (e) {
      console.error('Gagal membersihkan folder sesi WhatsApp:', e);
    }
  }
}

export const whatsappService = new WhatsAppService();
