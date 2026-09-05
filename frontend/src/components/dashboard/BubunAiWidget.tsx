import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Bot, 
  Send, 
  X, 
  Stethoscope, 
  ArrowRight, 
  Utensils, 
  CheckSquare, 
  ShoppingBag, 
  Users, 
  Crown, 
  User, 
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ActionButton {
  path: string;
  label: string;
}

// Helper untuk mengekstrak tag [ACTION:path|label] dari respons AI
const parseMessageActions = (rawText: string): { cleanText: string; actions: ActionButton[] } => {
  const actions: ActionButton[] = [];
  const regex = /\[ACTION:([^|\]]+)\|([^\]]+)\]/g;
  let match;

  while ((match = regex.exec(rawText)) !== null) {
    const path = match[1]?.trim();
    const label = match[2]?.trim();
    if (path && label) {
      actions.push({ path, label });
    }
  }

  const cleanText = rawText.replace(regex, '').trim();
  return { cleanText, actions };
};

// Helper ikon tombol berdasarkan path navigasi
const getActionIcon = (path: string) => {
  if (path.startsWith('/chat')) return <Stethoscope className="w-4 h-4 shrink-0" />;
  if (path.startsWith('/cek-gizi')) return <Utensils className="w-4 h-4 shrink-0" />;
  if (path === '/') return <CheckSquare className="w-4 h-4 shrink-0" />;
  if (path.startsWith('/belanja-obat')) return <ShoppingBag className="w-4 h-4 shrink-0" />;
  if (path.startsWith('/komunitas')) return <Users className="w-4 h-4 shrink-0" />;
  if (path.startsWith('/profil')) return <User className="w-4 h-4 shrink-0" />;
  if (path.startsWith('/pricing') || path.startsWith('/premium')) return <Crown className="w-4 h-4 shrink-0" />;
  return <ArrowRight className="w-4 h-4 shrink-0" />;
};

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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'model',
    text: 'Halo Bunda! Saya Bubun AI, asisten pemandu kehamilan Bunda di BumilFit. Ada keluhan kesehatan, pertanyaan nutrisi, atau panduan fitur website yang ingin Bubun bantu hari ini? [ACTION:/chat|Tanya Dokter / Bidan] [ACTION:/cek-gizi|Cek Gizi Makanan] [ACTION:/|Lihat To-Do List]'
  }
];

const QUICK_SUGGESTIONS = [
  { label: '🩺 Keluhan Medis & Chat Dokter', query: 'Halo Bubun, bagaimana cara berkonsultasi langsung dengan dokter spesialis atau bidan di BumilFit?' },
  { label: '🥗 Cek Nutrisi & Makanan Hamil', query: 'Tolong pandu saya cara menggunakan fitur Cek Gizi untuk makanan ibu hamil.' },
  { label: '📋 Panduan Fitur Website Ini', query: 'Halo Bubun, tolong jelaskan fitur-fitur utama apa saja yang ada di website BumilFit ini dan fungsinya.' },
  { label: '💊 Vitamin & Obat di Apotek', query: 'Bagaimana cara membeli vitamin asam folat dan kebutuhan hamil di apotek BumilFit?' },
];

export const BubunAiWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      setMessages(INITIAL_MESSAGES);
    } else {
      setIsOpen(true);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setMessages(INITIAL_MESSAGES);
  };

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendUserQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: queryText.trim() };
    const currentHistory = [...messages];
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const chatTurns = currentHistory.slice(1);
      const geminiHistory = chatTurns.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const res = await apiClient.post('/chat-ai', { 
        message: userMsg.text,
        history: geminiHistory
      });

      setMessages(prev => [...prev, { role: 'model', text: res.data.text }]);
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'model', 
          text: "Maaf Bunda, jaringan Bubun sedang sedikit terganggu. Jika Bunda mengalami keluhan medis, silakan langsung berkonsultasi dengan dokter kami ya. [ACTION:/chat|Konsultasi Dokter Sekarang]" 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendUserQuery(input);
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={toggleChat}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 sm:right-6 z-40 bg-[#389D9C] hover:bg-[#2E8281] text-white w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer group"
        aria-label="Tanya Bubun AI"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          <Bot className="w-3.5 h-3.5 absolute -top-1.5 -right-1.5 bg-[#389D9C] rounded-full border border-white text-white p-0.5" />
        </div>
        
        {/* Tooltip */}
        <span className="absolute right-16 scale-0 transition-all rounded bg-slate-800 p-2 text-xs text-white group-hover:scale-100 font-bold shadow-md whitespace-nowrap">
          Pemandu & Tanya Bubun AI
        </span>
      </button>

      {/* FLOATING CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-24 right-4 sm:right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[75vh] bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.14)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#194668] to-[#389D9C] text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow-2xs">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm tracking-wide">Bubun AI</h4>
                  <span className="px-1.5 py-0.2 rounded-full bg-teal-300/30 text-[9px] font-bold text-teal-100 border border-teal-200/30">
                    Pemandu Web
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-teal-50">Solutif & Ramah</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={closeChat}
                className="p-1.5 hover:bg-white/15 rounded-lg text-teal-50 hover:text-white transition-colors cursor-pointer"
                aria-label="Tutup"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const { cleanText, actions } = isUser 
                ? { cleanText: msg.text, actions: [] } 
                : parseMessageActions(msg.text);

              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2.5`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#194668] to-[#389D9C] flex items-center justify-center text-white shrink-0 mt-1 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm ${
                    isUser 
                      ? 'bg-[#194668] text-white rounded-tr-sm shadow-2xs' 
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm shadow-2xs'
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-left">{msg.text}</p>
                    ) : (
                      <div>
                        <div className="space-y-1 text-left">
                          {renderMarkdown(cleanText)}
                        </div>

                        {/* Tombol-Tombol Navigasi / Aksi Interaktif */}
                        {actions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">
                              Aksi & Rekomendasi Fitur:
                            </span>
                            {actions.map((action, actIdx) => {
                              const isDoctorAction = action.path.startsWith('/chat');

                              if (isDoctorAction) {
                                return (
                                  <button
                                    key={actIdx}
                                    onClick={() => {
                                      navigate(action.path);
                                      closeChat();
                                    }}
                                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Stethoscope className="w-4 h-4 shrink-0 text-white animate-pulse" />
                                      <span>{action.label}</span>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                  </button>
                                );
                              }

                              return (
                                <button
                                  key={actIdx}
                                  onClick={() => {
                                    navigate(action.path);
                                    closeChat();
                                  }}
                                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#194668] border border-teal-200/80 text-xs font-bold transition-all cursor-pointer active:scale-95 group text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#389D9C]">
                                      {getActionIcon(action.path)}
                                    </span>
                                    <span>{action.label}</span>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#389D9C] group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Indikator Animasi Loading Respon Bubun AI */}
            {isLoading && (
              <div className="flex justify-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#194668] to-[#389D9C] flex items-center justify-center text-white shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm p-3.5 flex gap-1 items-center shadow-2xs">
                  <div className="w-1.5 h-1.5 bg-[#389D9C] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#389D9C] rounded-full animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#389D9C] rounded-full animate-bounce [animation-delay:0.3s]"></div>
                </div>
              </div>
            )}

            {/* Rekomendasi Pilihan Cepat (Starter Suggestions) saat obrolan baru dimulai */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block text-left flex items-center gap-1">
                  <Sparkles size={12} className="text-[#389D9C]" />
                  <span>Pilihan Pertanyaan Populer:</span>
                </span>
                <div className="flex flex-col gap-1.5">
                  {QUICK_SUGGESTIONS.map((sugg, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => sendUserQuery(sugg.query)}
                      className="text-left px-3 py-2 rounded-xl bg-white hover:bg-teal-50/70 border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-[#194668] hover:border-teal-300 transition-all cursor-pointer flex items-center justify-between group shadow-2xs active:scale-98"
                    >
                      <span>{sugg.label}</span>
                      <ArrowRight size={13} className="text-slate-400 group-hover:text-[#389D9C] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Area */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan keluhan atau panduan ke Bubun..."
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#389D9C] focus:border-transparent text-xs sm:text-sm"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-[#389D9C] hover:bg-[#2E8281] disabled:bg-slate-200 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-2xs active:scale-95"
                title="Kirim pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};
