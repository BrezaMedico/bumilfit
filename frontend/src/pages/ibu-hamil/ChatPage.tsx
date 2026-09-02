import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  AlertTriangle, 
  Stethoscope, 
  Search, 
  Plus, 
  Loader2, 
  ArrowLeft, 
  MessageSquare,
  X,
  Star
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface DoctorConversation {
  id: string;
  doctorName: string;
  doctorAvatar: string;
  status: 'Aktif' | 'Selesai';
  lastMessage: string;
  lastMessageTime: string;
  messages: {
    role: 'user' | 'model';
    text: string;
    timestamp: string;
    isEndingPrompt?: boolean;
  }[];
}

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const isBulletList = line.trim().startsWith('* ') || line.trim().startsWith('- ');
    let cleanLine = line;
    if (isBulletList) {
      cleanLine = line.trim().replace(/^[\*\-]\s+/, '');
    }

    const isNumList = /^\d+\.\s+/.test(line.trim());
    if (isNumList) {
      cleanLine = line.trim().replace(/^\d+\.\s+/, '');
    }

    const parts = [];
    let currentIndex = 0;
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    let match;

    while ((match = regex.exec(cleanLine)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > currentIndex) {
        parts.push({ text: cleanLine.substring(currentIndex, matchIndex), type: 'normal' });
      }

      const matchedText = match[0];
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        parts.push({ text: matchedText.slice(2, -2), type: 'bold' });
      } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
        parts.push({ text: matchedText.slice(1, -1), type: 'italic' });
      }
      currentIndex = regex.lastIndex;
    }

    if (currentIndex < cleanLine.length) {
      parts.push({ text: cleanLine.substring(currentIndex), type: 'normal' });
    }

    const lineContent = parts.map((part, partIdx) => {
      if (part.type === 'bold') {
        return <strong key={partIdx} className="font-bold text-[#194668]">{part.text}</strong>;
      }
      if (part.type === 'italic') {
        return <em key={partIdx} className="italic">{part.text}</em>;
      }
      return part.text;
    });

    if (isBulletList) {
      return (
        <li key={lineIdx} className="list-disc ml-5 mb-1 leading-relaxed text-left">
          {lineContent}
        </li>
      );
    }

    if (isNumList) {
      return (
        <li key={lineIdx} className="list-decimal ml-5 mb-1 leading-relaxed text-left" style={{ listStyleType: 'decimal' }}>
          {lineContent}
        </li>
      );
    }

    return (
      <p key={lineIdx} className="mb-2 leading-relaxed min-h-[1em] text-left">
        {lineContent}
      </p>
    );
  });
};

const DOCTORS_POOL = [
  {
    name: 'Sarah',
    welcomeMessage: 'Halo Bunda! Saya dr. Sarah. Senang bisa bantu Bunda hari ini. Ada keluhan atau pertanyaan apa nih yang mau diobrolin?'
  },
  {
    name: 'Deniz Affansyah',
    welcomeMessage: 'Halo Bunda, saya dr. Deniz. Salam kenal ya. Ada yang bisa saya bantu atau sharing hari ini seputar kehamilannya?'
  },
  {
    name: 'Amanda',
    welcomeMessage: 'Hai Bunda! Saya dr. Amanda. Yuk, jangan sungkan buat cerita atau tanya-tanya apa aja seputar perkembangan si kecil.'
  },
  {
    name: 'Budi Setiawan',
    welcomeMessage: 'Halo Bunda, saya dr. Budi. Senang bisa mendampingi Bunda hari ini. Apa nih yang lagi dirasakan atau ingin ditanyakan?'
  },
  {
    name: 'Riska Amelia',
    welcomeMessage: 'Halo Bunda! Saya dr. Riska. Ada yang bisa saya bantu diskusikan seputar kesehatan kehamilan Bunda hari ini?'
  },
  {
    name: 'Hendra Wijaya',
    welcomeMessage: 'Halo Bunda, saya dr. Hendra. Salam hangat. Ada keluhan atau pertanyaan seputar kehamilan yang perlu kita bahas?'
  },
  {
    name: 'Citra Lestari',
    welcomeMessage: 'Hai Bunda, saya dr. Citra. Senang sekali bisa ngobrol hari ini. Ada perkembangan atau keluhan apa nih dari si kecil?'
  },
  {
    name: 'Dimas Pratama',
    welcomeMessage: 'Halo Bunda, saya dr. Dimas. Salam kenal. Apa kabar hari ini? Ada yang mau dikonsultasikan seputar kehamilannya?'
  },
  {
    name: 'Eka Putri',
    welcomeMessage: 'Halo Bunda! Saya dr. Eka. Senang sekali bisa bantu Bunda hari ini. Ada cerita atau keluhan apa yang mau dibagi?'
  },
  {
    name: 'Faisal Rahman',
    welcomeMessage: 'Halo Bunda, saya dr. Faisal. Salam kenal ya. Ada keluhan atau pertanyaan seputar kandungan yang bisa saya bantu jelaskan?'
  }
];

export const ChatPage = () => {

  // State untuk Konsultasi Dokter Virtual
  const [conversations, setConversations] = useState<DoctorConversation[]>(() => {
    const saved = localStorage.getItem('bumilfit_consultation_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingStatusText, setMatchingStatusText] = useState('Mencari dokter yang tersedia...');
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorChatInput, setDoctorChatInput] = useState('');
  const [isDoctorLoading, setIsDoctorLoading] = useState(false);
  const doctorMessagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // User profile state
  const [profile, setProfile] = useState<{ namaIbu: string; fotoProfil: string | null } | null>(null);

  // State untuk Rating & Review
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // State untuk modal konfirmasi selesai konsultasi (Pop-up B5 Terpadu)
  const [endConfirmationModalOpen, setEndConfirmationModalOpen] = useState(false);
  const [confirmEndConvId, setConfirmEndConvId] = useState<string | null>(null);

  // State untuk modal konfirmasi hapus riwayat
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false);
  const [confirmDeleteConvId, setConfirmDeleteConvId] = useState<string | null>(null);

  // State untuk Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State baru untuk alur konfirmasi sekuensial dan rangkuman AI
  const [awaitingEndConfirmation, setAwaitingEndConfirmation] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const AUTO_FOLLOW_UP_TEXT = "Bunda, apakah masih ada hal lain seputar kesehatan kehamilan yang ingin dikonsultasikan? Saya siap membantu menjawab pertanyaan Bunda lebih lanjut.";

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Deteksi Pesan Penutup Pasien
  const isClosingMessage = (text: string): boolean => {
    const normalized = text.toLowerCase().trim();
    const keywords = [
      'terima kasih', 'terimakasih', 'makasih', 'makasi', 'thanks', 
      'thank you', 'hatur nuhun', 'matur nuwun', 'sudah cukup', 
      'tidak ada lagi', 'selesai', 'beres', 'cukup dok', 'makasih banyak'
    ];
    return keywords.some(kw => normalized.includes(kw));
  };

  // Deteksi Pesan Persetujuan Selesai
  const isAgreeMessage = (text: string): boolean => {
    const normalized = text.toLowerCase().trim();
    const keywords = [
      'iya', 'ya', 'boleh', 'silakan', 'silahkan', 'oke', 'ok', 
      'baik', 'sudah', 'udah', 'beres', 'yes', 'tentu', 'bisa', 'siap'
    ];
    return keywords.some(kw => normalized.includes(kw));
  };

  // Trigger untuk membuka Pop-up B5 Terpadu dan menghasilkan Catatan Medis Berbasis AI
  const openEndingModal = async (convId: string) => {
    setConfirmEndConvId(convId);
    setEndConfirmationModalOpen(true);
    setIsSummaryLoading(true);
    setAiSummary(null);

    const activeConv = conversations.find(c => c.id === convId);
    if (!activeConv) return;

    // Ambil riwayat chat (kecuali pesan pembuka dokter)
    const chatTurns = activeConv.messages.slice(1);
    const geminiHistory = chatTurns.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    try {
      const res = await apiClient.post('/chat-ai', {
        message: "Tolong rangkum semua pembahasan dan keluhan konsultasi kita hari ini dalam bentuk 3-4 poin rekomendasi medis singkat yang sangat ramah untuk saya (Ibu Hamil/Bunda). Berikan kesimpulan medis dan petunjuk selanjutnya. JANGAN sertakan sapaan pembuka atau penutup, langsung tampilkan poin-poinnya saja.",
        history: geminiHistory,
        persona: 'dokter',
        doctorName: activeConv.doctorName.replace('dr. ', '')
      });
      setAiSummary(res.data.text);
    } catch (err) {
      console.error("Gagal memuat rangkuman AI:", err);
      setAiSummary(`- Istirahat yang teratur dan hindari aktivitas fisik berlebih.
- Penuhi kebutuhan nutrisi harian dan minum air mineral 2.5 liter per hari.
- Konsumsi vitamin prenatal secara rutin sesuai petunjuk.`);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        setProfile(response.data.profilIbu);
      } catch (err) {
        console.error('Gagal memuat profil di ChatPage:', err);
      }
    };
    fetchProfile();
  }, []);

  // Auto-save history list ke localStorage
  useEffect(() => {
    localStorage.setItem('bumilfit_consultation_history', JSON.stringify(conversations));
  }, [conversations]);

  // Auto-scroll doctor chat
  useEffect(() => {
    if (activeConvId) {
      setTimeout(() => {
        doctorMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [conversations, activeConvId]);

  // Efek Deteksi Idle 2 Menit (Auto-Follow-Up dari Dokter)
  useEffect(() => {
    if (!activeConvId || !activeConv || activeConv.status !== 'Aktif' || isDoctorLoading) {
      return;
    }

    const messages = activeConv.messages;
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    
    // Jika pesan terakhir sudah berupa auto-follow-up, jangan berulang
    if (lastMsg.role === 'model' && lastMsg.text === AUTO_FOLLOW_UP_TEXT) {
      return;
    }

    const lastMsgTime = new Date(lastMsg.timestamp).getTime();
    
    const checkIdle = () => {
      const now = Date.now();
      const elapsed = now - lastMsgTime;
      
      if (elapsed >= 120000) { // 2 menit (120 detik)
        const responseTime = new Date().toISOString();
        const followUpMsg = {
          role: 'model' as const,
          text: AUTO_FOLLOW_UP_TEXT,
          timestamp: responseTime
        };

        setConversations(prev => 
          prev.map(c => {
            if (c.id === activeConvId) {
              return {
                ...c,
                lastMessage: AUTO_FOLLOW_UP_TEXT,
                lastMessageTime: responseTime,
                messages: [...c.messages, followUpMsg]
              };
            }
            return c;
          })
        );
      } else {
        const delay = 120000 - elapsed;
        timerId = setTimeout(checkIdle, delay);
      }
    };

    let timerId = setTimeout(checkIdle, 1000);

    return () => {
      clearTimeout(timerId);
    };
  }, [activeConvId, conversations, isDoctorLoading]);

  // Format tanggal relatif
  const getRelativeTime = (dateInput: string): string => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 5) return 'Baru saja';
    if (diffInSeconds < 60) return `${diffInSeconds} detik lalu`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 172800) return 'Kemarin';

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };



  // Simulasi Pencocokan Dokter Kandungan Baru (Matching simulation)
  const startNewConsultation = () => {
    setIsMatching(true);
    setMatchingStatusText('Mencari dokter yang tersedia...');

    // Simulasi jeda pencarian dokter (diperlama agar terasa alami)
    setTimeout(() => {
      setMatchingStatusText('Menganalisis ketersediaan dokter siaga...');
      
      setTimeout(() => {
        // Pilih dokter acak dari pool
        const selectedDoctor = DOCTORS_POOL[Math.floor(Math.random() * DOCTORS_POOL.length)];
        setMatchingStatusText(`Tersambung dengan dr. ${selectedDoctor.name}`);

        setTimeout(() => {
          const newConvId = `conv-${Date.now()}`;
          const newConv: DoctorConversation = {
            id: newConvId,
            doctorName: `dr. ${selectedDoctor.name}`,
            doctorAvatar: selectedDoctor.name.charAt(0),
            status: 'Aktif',
            lastMessage: selectedDoctor.welcomeMessage,
            lastMessageTime: new Date().toISOString(),
            messages: [
              {
                role: 'model',
                text: selectedDoctor.welcomeMessage,
                timestamp: new Date().toISOString()
              }
            ]
          };

          setConversations(prev => [newConv, ...prev]);
          setActiveConvId(newConvId);
          setIsMatching(false);
        }, 1500);

      }, 1500);
    }, 1500);
  };

  // Handler Kirim Pesan Obrolan Dokter Virtual
  const handleDoctorSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorChatInput.trim() || !activeConvId || !activeConv) return;

    const userText = doctorChatInput.trim();
    const messageTime = new Date().toISOString();

    // 1. Tambahkan pesan user ke UI secara instan
    const updatedMessages = [
      ...activeConv.messages,
      { role: 'user' as const, text: userText, timestamp: messageTime }
    ];

    setConversations(prev => 
      prev.map(c => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastMessage: userText,
            lastMessageTime: messageTime,
            messages: updatedMessages
          };
        }
        return c;
      })
    );

    setDoctorChatInput('');

    // 2. Cek apakah sedang menunggu konfirmasi selesai sesi melalui chat
    if (awaitingEndConfirmation) {
      setAwaitingEndConfirmation(false);
      if (isAgreeMessage(userText)) {
        // Pengguna menyetujui, buka Pop-up B5 Terpadu
        openEndingModal(activeConv.id);
        return;
      }
      // Jika pengguna tidak menyetujui (contoh: masih ingin bertanya), biarkan alur berjalan normal ke API
    }

    setIsDoctorLoading(true);

    // 3. Cek apakah pesan merupakan kalimat penutup dari pasien
    if (isClosingMessage(userText)) {
      setAwaitingEndConfirmation(true);
      setTimeout(() => {
        const responseTime = new Date().toISOString();
        const endingText = "Sama-sama, Bunda. Semoga kehamilannya selalu sehat, lancar, dan dipenuhi kebahagiaan ya. Apakah sesi konsultasi ini bisa kita selesaikan?";
        
        setConversations(prev => 
          prev.map(c => {
            if (c.id === activeConvId) {
              return {
                ...c,
                lastMessage: endingText,
                lastMessageTime: responseTime,
                messages: [
                  ...updatedMessages,
                  { 
                    role: 'model', 
                    text: endingText, 
                    timestamp: responseTime,
                    isEndingPrompt: true // Tampilkan tombol konfirmasi di obrolan
                  }
                ]
              };
            }
            return c;
          })
        );
        setIsDoctorLoading(false);
      }, 1500);
      return;
    }

    // 3. Sync / Kirim ke Gemini API
    const startTime = Date.now();
    try {
      // Format riwayat pesan untuk API (hilangkan sapaan dokter pertama agar diawali turn 'user' sesuai aturan Gemini)
      const chatTurns = activeConv.messages.slice(1);
      const geminiHistory = chatTurns.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const res = await apiClient.post('/chat-ai', {
        message: userText,
        history: geminiHistory,
        persona: 'dokter',
        doctorName: activeConv.doctorName.replace('dr. ', '')
      });

      const apiDuration = Date.now() - startTime;
      const responseText = res.data.text;
      
      // Hitung simulasi durasi pengetikan (0.5 detik per kata, minimal 3 detik)
      const words = responseText.split(' ');
      const totalTypingTime = Math.max(3000, words.length * 500);
      const remainingDelay = Math.max(0, totalTypingTime - apiDuration);

      // Tahan status "dokter sedang mengetik..." selama sisa waktu simulasi
      await new Promise(resolve => setTimeout(resolve, remainingDelay));

      const responseTime = new Date().toISOString();

      setConversations(prev => 
        prev.map(c => {
          if (c.id === activeConvId) {
            return {
              ...c,
              lastMessage: responseText,
              lastMessageTime: responseTime,
              messages: [
                ...updatedMessages,
                { role: 'model', text: responseText, timestamp: responseTime }
              ]
            };
          }
          return c;
        })
      );
    } catch (error) {
      console.error('Error doctor chat:', error);
      const errTime = new Date().toISOString();
      setConversations(prev => 
        prev.map(c => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: [
                ...updatedMessages,
                { role: 'model', text: 'Maaf Bunda, koneksi dengan dokter sedang terputus sementara. Harap coba mengirim pesan kembali.', timestamp: errTime }
              ]
            };
          }
          return c;
        })
      );
    } finally {
      setIsDoctorLoading(false);
    }
  };

  // Logika Mengakhiri Sesi Konsultasi - Tombol ditekan, langsung membuka Pop-up B5 Terpadu
  const endConsultation = (convId: string) => {
    openEndingModal(convId);
  };

  // Callback dari Pop-up B5 Terpadu untuk Menyelesaikan Konsultasi & Mengirim Penilaian
  const confirmEndConsultation = () => {
    if (!confirmEndConvId) return;

    // 1. Ubah status sesi percakapan menjadi Selesai
    setConversations(prev => 
      prev.map(c => {
        if (c.id === confirmEndConvId) {
          return { ...c, status: 'Selesai' as const };
        }
        return c;
      })
    );

    // 2. Tampilkan Toast sukses umpan balik
    showToast(`Terima kasih Bunda atas ulasan dan penilaian bintang ${selectedRating}-nya!`);

    // 3. Reset state dan tutup modal
    setEndConfirmationModalOpen(false);
    setConfirmEndConvId(null);
    setSelectedRating(0);
    setRatingComment('');
    setActiveConvId(null); // Keluar dari ruang konsultasi menuju beranda
  };

  // Logika Menghapus Riwayat Percakapan - Buka Modal Konfirmasi Kustom
  const deleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop clicking to open conversation
    setConfirmDeleteConvId(convId);
    setDeleteConfirmationModalOpen(true);
  };

  // Callback dari Modal Konfirmasi Kustom untuk Hapus Percakapan
  const confirmDeleteConversation = () => {
    if (!confirmDeleteConvId) return;

    setConversations(prev => prev.filter(c => c.id !== confirmDeleteConvId));
    if (activeConvId === confirmDeleteConvId) {
      setActiveConvId(null);
    }

    setDeleteConfirmationModalOpen(false);
    setConfirmDeleteConvId(null);
  };

  // Filter Riwayat Percakapan
  const filteredConversations = conversations.filter(c => 
    c.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-gray-50 border-x border-gray-100 shadow-sm relative text-left">
      
      {/* Disclaimer Header */}
      <div className="bg-teal-50 border-b border-teal-100 p-3 flex items-start gap-3 flex-shrink-0">
        <AlertTriangle className="text-[#0D9488] w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
        <p className="text-xs sm:text-sm text-teal-800 font-medium leading-relaxed">
          Konsultasi ini bersifat virtual dan edukatif menggunakan kecerdasan buatan. Bila Bunda mengalami kondisi gawat darurat (pendarahan hebat, kontraksi berlebih), segera datangi RS terdekat.
        </p>
      </div>

      {/* 1. KONTEN UTAMA: DOKTER VIRTUAL */}
      <div className="flex-1 flex flex-col min-h-0 bg-white">
          
          {/* SIMULASI COCOK DOKTER / MATCHING SCREEN */}
          {isMatching ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white space-y-6">
              <div className="relative h-24 w-24 rounded-full bg-teal-50 flex items-center justify-center text-[#0D9488] mb-4">
                <Loader2 size={44} className="animate-spin text-[#0D9488]" />
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#0D9488] animate-spin [animation-duration:15s]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{matchingStatusText}</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Sistem kami sedang mencocokkan keluhan Bunda dengan Dokter Kandungan siaga.
                </p>
              </div>
              
              {/* Bounce 3-Dots loading wave */}
              <div className="flex gap-1.5 items-center justify-center pt-2">
                <div className="w-2.5 h-2.5 bg-[#0D9488] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2.5 h-2.5 bg-[#0D9488] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2.5 h-2.5 bg-[#0D9488] rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : activeConvId && activeConv ? (
            
            /* KONDISI ACTIVE CHAT ROOM DENGAN DOKTER */
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
              
              {/* Header Ruang Chat */}
              <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-3xs">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveConvId(null)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label="Kembali"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center font-black text-sm text-[#0D9488]">
                    {activeConv.doctorName.replace('dr. ', '').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight flex items-center gap-2">
                      {activeConv.doctorName}
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeConv.status === 'Aktif' && (
                    <button
                      onClick={() => endConsultation(activeConv.id)}
                      className="text-xs px-3.5 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      Selesai Konsultasi
                    </button>
                  )}
                  {activeConv.status === 'Selesai' && (
                    <span className="text-xs px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-bold">
                      Sesi Selesai
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Thread Messages list */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {activeConv.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                    {msg.role === 'model' && (
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 text-[#0D9488] font-bold text-xs">
                        {activeConv.doctorName.replace('dr. ', '').charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-[#0D9488] text-white rounded-tr-sm shadow-xs' 
                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-xs'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="text-sm space-y-1 text-left">
                          {renderMarkdown(msg.text)}
                        </div>
                      )}
                      <span className={`text-[9px] block text-right mt-1.5 font-semibold ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center flex-shrink-0 text-white bg-[#194668] overflow-hidden shadow-2xs">
                        {profile?.fotoProfil ? (
                          <img src={profile.fotoProfil} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase">
                            {profile?.namaIbu ? profile.namaIbu.charAt(0) : 'I'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isDoctorLoading && (
                  <div className="flex justify-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 text-[#0D9488] font-bold text-xs">
                      {activeConv.doctorName.replace('dr. ', '').charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center shadow-xs">
                      <div className="w-2 h-2 bg-[#0D9488] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#0D9488] rounded-full animate-bounce [animation-delay:0.15s]"></div>
                      <div className="w-2 h-2 bg-[#0D9488] rounded-full animate-bounce [animation-delay:0.3s]"></div>
                    </div>
                  </div>
                )}
                <div ref={doctorMessagesEndRef} />
              </div>

              {/* Input Area Chat Dokter */}
              <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                {activeConv.status === 'Aktif' ? (
                  <form onSubmit={handleDoctorSend} className="flex gap-2">
                     <input
                      type="text"
                      value={doctorChatInput}
                      onChange={(e) => setDoctorChatInput(e.target.value)}
                      placeholder={`Ketik pesan ke ${activeConv.doctorName}...`}
                      className="flex-1 rounded-full border border-gray-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-sm disabled:bg-slate-50 disabled:text-slate-400"
                      disabled={isDoctorLoading}
                    />
                    <button 
                      type="submit" 
                      disabled={isDoctorLoading || !doctorChatInput.trim()}
                      className="bg-[#0D9488] hover:bg-[#0D9488]/90 disabled:bg-gray-300 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer shadow-xs"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-2 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl">
                    Konsultasi telah berakhir. Bunda dapat memulai sesi baru.
                  </div>
                )}
              </div>
            </div>
          ) : conversations.length === 0 ? (
            
            /* KONDISI A: BELUM ADA RIWAYAT (EMPTY STATE SCREEN) */
            <div className="flex-1 flex items-center justify-center p-6 bg-[#F8FAFC]">
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-sm max-w-md w-full flex flex-col items-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
                {/* Header Visual: Stetoskop dengan Sentuhan AI/Pulse Wave */}
                <div className="h-20 w-20 rounded-full bg-teal-50 flex items-center justify-center text-[#0D9488] relative">
                  <Stethoscope size={36} className="relative z-10" />
                  <span className="absolute inset-0 rounded-full bg-teal-100/40 animate-ping duration-1000" />
                </div>
                
                {/* Teks Petunjuk */}
                <div className="space-y-2.5">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    Mulai Konsultasi Kesehatan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Konsultasikan keluhan Anda kapan saja dengan dokter siaga kami secara virtual.
                  </p>
                </div>

                {/* Tombol Aksi (CTA) */}
                <button
                  onClick={startNewConsultation}
                  className="bg-[#0D9488] hover:bg-[#0d8478] active:scale-98 text-white w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  Mulai Percakapan Baru
                </button>
              </div>
            </div>
          ) : (
            
            /* KONDISI B: SUDAH MEMILIKI RIWAYAT (CHAT HISTORY SCREEN) */
            <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] pb-24">
              
              {/* Header Pencarian & Aksi Baru */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0 bg-white border-b border-gray-100 p-4 shadow-3xs">
                <div className="relative flex-1 w-full">
                  <Search size={16} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama dokter atau cuplikan pesan..."
                    className="w-full h-11 pl-11 pr-4 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 transition-all text-sm text-slate-700 placeholder-slate-400 font-medium"
                  />
                </div>
                <button
                  onClick={startNewConsultation}
                  className="w-full sm:w-auto h-11 px-5 bg-[#0D9488] hover:bg-[#0d8478] active:scale-95 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>Percakapan Baru</span>
                </button>
              </div>

              {/* Scrollable History List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 mb-2">Riwayat Konsultasi</h4>
                
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className="bg-white rounded-2xl border border-slate-100 hover:border-[#0D9488]/50 shadow-3xs p-4 flex justify-between items-center hover:shadow-xs transition-all duration-200 cursor-pointer group text-left"
                    >
                      <div className="flex gap-4 items-center flex-1 min-w-0">
                        {/* Avatar Dokter */}
                        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center font-black text-base text-[#0D9488] shadow-3xs flex-shrink-0">
                          {conv.doctorName.replace("dr. ", "").charAt(0).toUpperCase()}
                        </div>

                        {/* Detail Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
                              {conv.doctorName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                              • {getRelativeTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-normal truncate leading-normal">
                            {conv.lastMessage}
                          </p>
                        </div>
                      </div>

                      {/* Status & Delete Options (Non-absolute, flexbox) */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {conv.status === 'Aktif' ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                            Selesai
                          </span>
                        )}

                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center flex-shrink-0"
                          title="Hapus riwayat"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 px-4 text-center text-slate-400 space-y-2">
                    <MessageSquare size={40} className="text-slate-300 mx-auto" />
                    <p className="font-bold text-sm text-slate-500">Tidak ada riwayat percakapan ditemukan</p>
                    <p className="text-xs max-w-xs mx-auto text-slate-400">Coba cari nama dokter lain atau mulailah percakapan baru.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* POP-UP B5 (MODAL KONFIRMASI AKHIR SESI & RATING DOKTER TERPADU) */}
      {endConfirmationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Visual Header */}
            <div className="h-14 w-14 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto shadow-3xs">
              <Stethoscope size={28} />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-lg leading-tight">Konfirmasi Penyelesaian Sesi</h3>
              <p className="text-xs text-slate-500">
                Sesi konsultasi Anda dengan <span className="font-bold text-slate-700">{conversations.find(c => c.id === confirmEndConvId)?.doctorName}</span> telah selesai.
              </p>
            </div>

            {/* Catatan & Rekomendasi Medis Berbasis AI */}
            <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 text-left space-y-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">Catatan & Rekomendasi Medis</span>
              
              {isSummaryLoading ? (
                <div className="space-y-2.5 animate-pulse py-2">
                  <div className="h-2.5 bg-teal-100 rounded-full w-3/4"></div>
                  <div className="h-2.5 bg-teal-100 rounded-full w-5/6"></div>
                  <div className="h-2.5 bg-teal-100 rounded-full w-2/3"></div>
                  <div className="h-2.5 bg-teal-100 rounded-full w-1/2"></div>
                </div>
              ) : (
                <div className="text-xs text-teal-900 leading-relaxed font-medium space-y-1">
                  {aiSummary ? renderMarkdown(aiSummary) : (
                    <p>Tidak ada catatan medis khusus untuk sesi ini.</p>
                  )}
                </div>
              )}
            </div>

            {/* Formulir Penilaian (Rating & Review) */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <span className="text-xs font-extrabold text-slate-500 block uppercase tracking-wider">Beri Nilai Pelayanan Dokter</span>
              
              {/* Bintang 1-5 */}
              <div className="flex justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSelectedRating(star)}
                    className="focus:outline-none transition-transform hover:scale-125 duration-100 cursor-pointer"
                    type="button"
                  >
                    <Star
                      size={32}
                      className={`transition-colors duration-150 ${
                        star <= selectedRating 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-slate-200 hover:text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Teks Ulasan */}
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Tulis ulasan Bunda seputar pelayanan dokter (opsional)..."
                className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/10 resize-none h-20 placeholder-slate-400 text-slate-700 font-medium"
              />
            </div>

            {/* Tombol Navigasi Keluar / Batal */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={confirmEndConsultation}
                disabled={selectedRating === 0}
                className="bg-[#0D9488] hover:bg-[#0d8478] disabled:bg-slate-200 disabled:text-slate-400 active:scale-98 text-white w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                type="button"
              >
                Kirim & Kembali ke Beranda
              </button>
              <button
                onClick={() => {
                  setEndConfirmationModalOpen(false);
                  setConfirmEndConvId(null);
                  setSelectedRating(0);
                  setRatingComment('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold block mx-auto cursor-pointer py-1"
                type="button"
              >
                Kembali ke Ruang Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS RIWAYAT */}
      {deleteConfirmationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-3xs">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-lg">Hapus Riwayat Konsultasi</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Apakah Bunda yakin ingin menghapus riwayat konsultasi dengan <span className="font-bold text-slate-700">{conversations.find(c => c.id === confirmDeleteConvId)?.doctorName}</span> ini secara permanen?
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={confirmDeleteConversation}
                className="bg-rose-500 hover:bg-rose-600 active:scale-98 text-white w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                type="button"
              >
                Hapus Permanen
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmationModalOpen(false);
                  setConfirmDeleteConvId(null);
                }}
                className="w-full py-3 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
                type="button"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs sm:text-sm font-semibold py-3 px-6 rounded-full shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
