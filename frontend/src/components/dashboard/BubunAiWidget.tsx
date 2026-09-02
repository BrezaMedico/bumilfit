import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Bot, Send, X } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'model',
    text: 'Halo Bunda! Saya Bubun AI, asisten virtual kehamilan Anda. Ada yang bisa Bubun bantu diskusikan hari ini?'
  }
];

export const BubunAiWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      setMessages(INITIAL_MESSAGES); // Reset obrolan ke awal saat ditutup
    } else {
      setIsOpen(true);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setMessages(INITIAL_MESSAGES); // Reset obrolan ke awal saat ditutup
  };

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input.trim() };
    const currentHistory = [...messages];
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Slice off the first greeting message (role: model) so history starts with a 'user' turn
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
      setMessages(prev => [...prev, { role: 'model', text: "Maaf Bunda, Bubun sedang mengalami gangguan koneksi. Harap hubungi beberapa saat lagi." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Bunda yakin ingin menghapus riwayat obrolan dengan Bubun AI?")) {
      setMessages([
        {
          role: 'model',
          text: 'Halo Bunda! Saya Bubun AI, asisten virtual kehamilan Anda. Ada yang bisa Bubun bantu diskusikan hari ini?'
        }
      ]);
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-40 bg-[#389D9C] hover:bg-[#389D9C]/90 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer group"
        aria-label="Tanya Bubun AI"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          <Bot className="w-3.5 h-3.5 absolute -top-1.5 -right-1.5 bg-[#389D9C] rounded-full border border-white text-white p-0.5" />
        </div>
        
        {/* Tooltip */}
        <span className="absolute right-16 scale-0 transition-all rounded bg-slate-800 p-2 text-xs text-white group-hover:scale-100 font-bold shadow-md whitespace-nowrap">
          Tanya Bubun AI
        </span>
      </button>

      {/* FLOATING CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[80vh] bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-[#389D9C] text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-sm tracking-wide">Bubun AI</h4>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-teal-50">Online & Siap Bantu</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-teal-50 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                title="Hapus obrolan"
                type="button"
              >
                Hapus
              </button>
              <button
                onClick={closeChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-teal-50 hover:text-white transition-colors cursor-pointer"
                aria-label="Tutup"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5`}>
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-full bg-[#389D9C] flex items-center justify-center text-white flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl p-3 text-xs sm:text-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#194668] text-white rounded-tr-sm shadow-2xs' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-2xs'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-left">{msg.text}</p>
                  ) : (
                    <div className="space-y-1 text-left">
                      {renderMarkdown(msg.text)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#389D9C] flex items-center justify-center text-white flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-3.5 flex gap-1 items-center shadow-2xs">
                  <div className="w-1.5 h-1.5 bg-[#389D9C] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#389D9C] rounded-full animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#389D9C] rounded-full animate-bounce [animation-delay:0.3s]"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan ke Bubun..."
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#389D9C] focus:border-transparent text-xs sm:text-sm"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-[#389D9C] hover:bg-[#389D9C]/90 disabled:bg-slate-200 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
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
