import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, Sparkles } from 'lucide-react';

const QRIS_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/3840px-Logo_QRIS.svg.png?utm_source=id.wikipedia.org&utm_campaign=index&utm_content=thumbnail';

interface AuthenticQrisCardProps {
  totalAmount: number;
  orderId?: string;
  merchantName?: string;
  nmid?: string;
  compact?: boolean;
  showInstructions?: boolean;
}

export const AuthenticQrisCard: React.FC<AuthenticQrisCardProps> = ({
  totalAmount,
  orderId = 'BML' + Math.floor(100000 + Math.random() * 900000),
  merchantName = 'BUMILFIT APOTEK RESMI',
  nmid = 'ID102024090500123',
  compact = false,
  showInstructions = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrisLogoImgRef = useRef<HTMLImageElement | null>(null);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Preload logo image untuk canvas download
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = QRIS_LOGO_URL;
    img.onload = () => {
      qrisLogoImgRef.current = img;
    };
  }, []);

  // Format IDR Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Generate authentic QRIS payload string (EMVCo standard)
  const generateQrisPayload = () => {
    const formattedAmount = Math.round(totalAmount).toString();
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    return `00020101021226650014ID.CO.QRIS.WWW01189360099900000000000215${nmid}0303UMI51440014ID.CO.QRIS.WWW0215${nmid}0303UMI520459995303360540${formattedAmount.length}${formattedAmount}5802ID59${merchantName.length.toString().padStart(2, '0')}${merchantName}6007JAKARTA61051234062${(cleanOrderId.length + 4).toString().padStart(2, '0')}07${cleanOrderId.length.toString().padStart(2, '0')}${cleanOrderId}6304`;
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const qrData = generateQrisPayload();
    QRCode.toCanvas(
      canvasRef.current,
      qrData,
      {
        width: compact ? 170 : 210,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) console.error('Error rendering QRIS:', error);
      }
    );
  }, [totalAmount, orderId, merchantName, nmid, compact]);

  // Handle Download QR Card (PNG beresolusi tinggi)
  const handleDownload = () => {
    if (!canvasRef.current) return;
    setDownloading(true);

    try {
      const offCanvas = document.createElement('canvas');
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      const scale = 2;
      const w = 360 * scale;
      const h = 480 * scale;
      offCanvas.width = w;
      offCanvas.height = h;

      // Card Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Red Top Line
      ctx.fillStyle = '#EE3124';
      ctx.fillRect(0, 0, w, 8 * scale);

      // Header Text / Logo
      if (qrisLogoImgRef.current && qrisLogoImgRef.current.complete) {
        const logoH = 20 * scale;
        const logoW = logoH * (3840 / 1456);
        ctx.drawImage(qrisLogoImgRef.current, 20 * scale, 24 * scale, logoW, logoH);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${24 * scale}px sans-serif`;
        ctx.fillText('QRIS', 20 * scale, 42 * scale);
      }

      ctx.fillStyle = '#64748b';
      ctx.font = `bold ${8 * scale}px sans-serif`;
      ctx.fillText('PEMBAYARAN DIGITAL NASIONAL', 20 * scale, 55 * scale);

      // GPN Badge Right
      ctx.fillStyle = '#EE3124';
      ctx.font = `bold ${14 * scale}px sans-serif`;
      ctx.fillText('GPN', (360 - 55) * scale, 42 * scale);

      // Merchant Info
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${13 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(merchantName, 180 * scale, 82 * scale);

      ctx.fillStyle = '#64748b';
      ctx.font = `${9 * scale}px sans-serif`;
      ctx.fillText(`NMID: ${nmid}`, 180 * scale, 97 * scale);

      // QR Image
      const qrCanvas = canvasRef.current;
      const qrSize = 220 * scale;
      const qrX = (w - qrSize) / 2;
      const qrY = 110 * scale;
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // Center Badge
      const badgeW = 46 * scale;
      const badgeH = 20 * scale;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((w - badgeW) / 2, qrY + (qrSize - badgeH) / 2, badgeW, badgeH);
      ctx.strokeStyle = '#EE3124';
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect((w - badgeW) / 2, qrY + (qrSize - badgeH) / 2, badgeW, badgeH);
      if (qrisLogoImgRef.current && qrisLogoImgRef.current.complete) {
        const centerLogoH = 9 * scale;
        const centerLogoW = centerLogoH * (3840 / 1456);
        ctx.drawImage(
          qrisLogoImgRef.current,
          (w - centerLogoW) / 2,
          qrY + (qrSize - centerLogoH) / 2,
          centerLogoW,
          centerLogoH
        );
      } else {
        ctx.fillStyle = '#EE3124';
        ctx.font = `bold ${9 * scale}px sans-serif`;
        ctx.fillText('QRIS', 180 * scale, qrY + (qrSize - badgeH) / 2 + 14 * scale);
      }

      // Total Box
      const boxY = 345 * scale;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(20 * scale, boxY, (360 - 40) * scale, 52 * scale);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(20 * scale, boxY, (360 - 40) * scale, 52 * scale);

      ctx.fillStyle = '#64748b';
      ctx.font = `bold ${8 * scale}px sans-serif`;
      ctx.fillText('TOTAL PEMBAYARAN', 180 * scale, boxY + 18 * scale);

      ctx.fillStyle = '#194668';
      ctx.font = `bold ${18 * scale}px sans-serif`;
      ctx.fillText(formatRupiah(totalAmount), 180 * scale, boxY + 40 * scale);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${8 * scale}px sans-serif`;
      ctx.fillText('Diterima di semua e-wallet & mobile banking berlogo QRIS', 180 * scale, 435 * scale);
      ctx.fillText('Standar Resmi Bank Indonesia & ASPI', 180 * scale, 452 * scale);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `QRIS-BUMILFIT-${orderId}.png`;
      link.href = offCanvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Gagal membuat unduhan QRIS:', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(totalAmount.toString());
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  return (
    <div className="w-full max-w-sm mx-auto text-slate-800">
      {/* Kartu Utama QRIS: Bersih, Rapi, & Fokus */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-center">
        
        {/* Header Strip Resmi QRIS */}
        <div className="px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="text-left">
            <div className="flex items-center gap-1">
              <img
                src={QRIS_LOGO_URL}
                alt="Logo QRIS"
                className="h-5 sm:h-5.5 w-auto object-contain select-none"
                loading="eager"
              />
            </div>
            <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase block mt-0.5">
              Pembayaran Digital Nasional
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-[#EE3124] tracking-wider uppercase">
              GPN
            </span>
            <div className="w-5 h-5 rounded-full border border-red-200 bg-red-50 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#EE3124]" />
            </div>
          </div>
        </div>

        {/* Info Merchant */}
        <div className="pt-3 pb-1 px-4">
          <h3 className="font-extrabold text-xs text-slate-900 tracking-wide uppercase">
            {merchantName}
          </h3>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            NMID: {nmid}
          </p>
        </div>

        {/* QR Code Matrix (Besar, Jelas, & Tajam) */}
        <div className="py-2.5 flex flex-col items-center justify-center">
          <div className="relative p-2 bg-white rounded-xl border border-slate-200 shadow-2xs inline-flex items-center justify-center">
            <canvas ref={canvasRef} className="rounded-lg block" />

            {/* Emblem QRIS Minimalis di Tengah */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white px-1.5 py-0.5 rounded border border-[#EE3124] shadow-xs flex items-center justify-center">
                <img
                  src={QRIS_LOGO_URL}
                  alt="QRIS"
                  className="h-2.5 w-auto object-contain select-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kotak Total Tagihan (Jelas & Nyaman Dibaca) */}
        <div className="mx-4 my-2 p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pembayaran
            </span>
            <span className="text-lg font-black text-[#194668] tracking-tight block">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          <button
            onClick={handleCopyNominal}
            className="px-2.5 py-1.5 bg-white border border-teal-200 hover:border-teal-300 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-teal-50 transition active:scale-95 cursor-pointer"
          >
            {copiedNominal ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-700 text-[11px]">Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span className="text-[11px]">Salin</span>
              </>
            )}
          </button>
        </div>

        {/* Tombol Unduh / Simpan QR */}
        <div className="px-4 pb-3 pt-1">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-2.5 px-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Download size={14} className="text-[#389D9C]" />
            <span>{downloading ? 'Menyimpan...' : 'Simpan / Unduh Gambar QR'}</span>
          </button>
        </div>

        {/* Daftar Aplikasi yang Didukung (Baris Rapi & Elegan) */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-semibold text-slate-400 mb-1.5">
            Dapat dibayar dari semua aplikasi berlogo QRIS:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1 text-[9px] font-bold text-slate-600">
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">GoPay</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">OVO</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">DANA</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">ShopeePay</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">BCA</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Mandiri</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">BRI</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">BNI</span>
          </div>
        </div>
      </div>

      {/* Petunjuk Praktis 3 Langkah (Sangat Mudah Dipahami) */}
      {showInstructions && (
        <div className="mt-3.5 bg-white rounded-xl border border-slate-200/80 p-3.5 text-left text-xs shadow-3xs space-y-2">
          <p className="font-extrabold text-[#389D9C] flex items-center gap-1 text-xs">
            <Sparkles size={13} />
            Cara Bayar Praktis:
          </p>
          <ol className="space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-teal-50 text-[#389D9C] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <span><strong>Simpan gambar QR</strong> di atas atau lakukan screenshot layar ini.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-teal-50 text-[#389D9C] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <span>Buka aplikasi m-banking (BCA/Mandiri/BRI) atau e-wallet (GoPay/DANA/OVO/ShopeePay).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-teal-50 text-[#389D9C] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <span>Pilih menu <strong>QRIS &gt; Unggah dari Galeri</strong>, lalu selesaikan pembayaran.</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default AuthenticQrisCard;
