import { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Search, 
  Plus, 
  X, 
  Send, 
  MoreHorizontal, 
  Sparkles, 
  Clock, 
  BookOpen, 
  AlertCircle,
  Trash2,
  Loader2,
  CheckCircle2,
  Flag,
  Link2,
  ChevronDown,
  Check,
  HelpCircle,
  Apple,
  HeartPulse,
  Baby
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { UserAvatar } from '../../components/common/UserAvatar';
import komunitasImg from '../../assets/komunitas.png';

interface Comment {
  id: string;
  namaUser: string;
  avatar: string | null;
  timestamp: string;
  isiKomentar: string;
  peran?: string;
  authorId: string;
  isSubscribed?: boolean;
}

interface Post {
  id: string;
  namaUser: string;
  avatar: string | null;
  timestamp: string;
  isiPost: string;
  tag: string;
  likes: number;
  likedByUser: boolean;
  comments: Comment[];
  authorId: string;
  isSubscribed?: boolean;
}

export const KomunitasPage = () => {
  // State untuk data postingan dan profil user
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ 
    id: string; 
    namaIbu: string; 
    fotoProfil: string | null; 
    isSubscribed?: boolean;
  } | null>(null);

  // State untuk interaktivitas forum
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // State untuk form postingan baru (Modal FAB)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('Keluhan & Tips');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement | null>(null);

  // State untuk mengetik komentar baru per postingan
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // State untuk notifikasi Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // State untuk dropdown menu 3-titik (postingan utama & balasan komentar)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const activeDropdownRef = useRef<HTMLDivElement | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [reportingPost, setReportingPost] = useState<Record<string, boolean>>({});
  const [reportingComment, setReportingComment] = useState<Record<string, boolean>>({});

  // Menutup dropdown menu saat klik di luar atau menekan Esc
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdownRef.current && !activeDropdownRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        setIsTagDropdownOpen(false);
      }
    };

    if (activeMenuId || isTagDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId, isTagDropdownOpen]);

  // Deteksi query param (?post=...&comment=...&search=...) saat tautan dibuka
  useEffect(() => {
    if (isLoading) return;

    const params = new URLSearchParams(window.location.search);
    const postParam = params.get('post');
    const commentParam = params.get('comment');
    const searchParam = params.get('search');

    if (searchParam) {
      setSearchQuery(searchParam);
    }

    if (postParam) {
      setExpandedComments(prev => ({
        ...prev,
        [postParam]: true
      }));

      // Jika membuka tautan postingan utama (tanpa target komentar spesifik)
      if (!commentParam) {
        setHighlightedPostId(postParam);
        const scrollTimer = setTimeout(() => {
          const postEl = document.getElementById(`post-${postParam}`);
          if (postEl) {
            postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);

        const clearTimer = setTimeout(() => {
          setHighlightedPostId(null);
        }, 4500);

        return () => {
          clearTimeout(scrollTimer);
          clearTimeout(clearTimer);
        };
      }
    }

    if (commentParam) {
      setHighlightedCommentId(commentParam);
      
      const scrollTimer = setTimeout(() => {
        const commentEl = document.getElementById(`comment-${commentParam}`);
        if (commentEl) {
          commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

      const clearTimer = setTimeout(() => {
        setHighlightedCommentId(null);
      }, 4500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [isLoading]);

  // Helper copy teks ke clipboard
  const copyTextToClipboard = async (text: string, successMsg: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        showToast(successMsg, 'success');
        return;
      } catch {
        fallbackCopyText(text, successMsg);
      }
    } else {
      fallbackCopyText(text, successMsg);
    }
  };

  const fallbackCopyText = (text: string, successMsg: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(successMsg, 'success');
    } catch {
      showToast('Gagal menyalin tautan.', 'error');
    }
    document.body.removeChild(textArea);
  };

  // Salin tautan postingan utama beserta kata kunci pencarian
  const handleCopyPostLink = (postId: string, postText: string) => {
    const cleanSearch = postText.slice(0, 60).replace(/\n/g, ' ').trim();
    const url = `${window.location.origin}/komunitas?post=${encodeURIComponent(postId)}&search=${encodeURIComponent(cleanSearch)}`;
    copyTextToClipboard(url, 'Tautan postingan berhasil disalin ke clipboard!');
  };

  // Salin link komentar beserta halaman & parameter pencarian
  const handleCopyCommentLink = (postId: string, commentId: string, commentText: string) => {
    const cleanSearch = commentText.slice(0, 60).replace(/\n/g, ' ').trim();
    const url = `${window.location.origin}/komunitas?post=${encodeURIComponent(postId)}&comment=${encodeURIComponent(commentId)}&search=${encodeURIComponent(cleanSearch)}`;
    copyTextToClipboard(url, 'Tautan komentar berhasil disalin ke clipboard!');
  };

  // Laporkan postingan utama (jika 5 akun melaporkan, sistem akan menghapus otomatis)
  const handleReportPost = async (postId: string) => {
    if (reportingPost[postId]) return;
    setReportingPost(prev => ({ ...prev, [postId]: true }));

    try {
      const response = await apiClient.post(`/komunitas/posts/${postId}/report`);
      const { deleted } = response.data;

      if (deleted) {
        // Hapus postingan dari state postingan karena sudah mencapai 5 laporan
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      }
      showToast('Berhasil dilaporkan', 'success');
    } catch (error: any) {
      console.error('Gagal melaporkan postingan:', error);
      const errMsg = error.response?.data?.message || 'Gagal melaporkan postingan. Silakan coba lagi.';
      showToast(errMsg, 'error');
    } finally {
      setReportingPost(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Laporkan komentar (jika 5 akun melaporkan, sistem akan menghapus otomatis)
  const handleReportComment = async (postId: string, commentId: string) => {
    if (reportingComment[commentId]) return;
    setReportingComment(prev => ({ ...prev, [commentId]: true }));

    try {
      const response = await apiClient.post(`/komunitas/comments/${commentId}/report`);
      const { deleted } = response.data;

      if (deleted) {
        // Hapus komentar dari state postingan karena sudah mencapai 5 laporan
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: post.comments.filter(c => c.id !== commentId)
              };
            }
            return post;
          })
        );
      }
      showToast('Berhasil dilaporkan', 'success');
    } catch (error: any) {
      console.error('Gagal melaporkan komentar:', error);
      const errMsg = error.response?.data?.message || 'Gagal melaporkan komentar. Silakan coba lagi.';
      showToast(errMsg, 'error');
    } finally {
      setReportingComment(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // Kategori forum & metadata tampilan dropdown
  const categories = ['Semua', 'Keluhan & Tips', 'Nutrisi & Makanan', 'Kesehatan', 'Persiapan Melahirkan'];

  const categoryConfig: Record<string, { icon: any; color: string; bg: string; desc: string }> = {
    'Keluhan & Tips': {
      icon: HelpCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      desc: 'Pengalaman Bunda, solusi keluhan & tips kehamilan'
    },
    'Nutrisi & Makanan': {
      icon: Apple,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      desc: 'Menu bergizi, asupan vitamin & makanan sehat'
    },
    'Kesehatan': {
      icon: HeartPulse,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      desc: 'Gejala medis, konsultasi dokter & kebugaran'
    },
    'Persiapan Melahirkan': {
      icon: Baby,
      color: 'text-sky-500',
      bg: 'bg-sky-50',
      desc: 'Perlengkapan bayi, proses persalinan & pasca lahiran'
    },
  };

  // Native helper untuk memformat waktu relatif secara dinamis
  const getRelativeTime = (dateInput: string | Date | number): string => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 5) return 'Baru saja';
    if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;

    const intervals = [
      { label: 'tahun', seconds: 31536000 },
      { label: 'bulan', seconds: 2592000 },
      { label: 'minggu', seconds: 604800 },
      { label: 'hari', seconds: 86400 },
      { label: 'jam', seconds: 3600 },
      { label: 'menit', seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(diffInSeconds / interval.seconds);
      if (count >= 1) {
        if (interval.label === 'hari' && count === 1) {
          return 'Kemarin';
        }
        return `${count} ${interval.label} yang lalu`;
      }
    }

    return 'Baru saja';
  };

  // Muat data profil pengguna saat mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        const data = response.data;
        setCurrentUser({
          id: data.id || data.profilIbu?.userId || '',
          namaIbu: data.profilIbu?.namaIbu || 'Ibu Hamil',
          fotoProfil: data.profilIbu?.fotoProfil || null,
          isSubscribed: data.subscription?.hasActiveSubscription ?? false,
        });
      } catch (err) {
        console.error('Gagal mengambil data profil:', err);
      }
    };
    fetchProfile();
  }, []);

  // Muat daftar postingan dari database
  const fetchPosts = async () => {
    try {
      const response = await apiClient.get('/komunitas/posts');
      setPosts(response.data);
      
      // Buka utas pertama secara default jika ada postingan
      if (response.data.length > 0) {
        setExpandedComments(prev => ({
          ...prev,
          [response.data[0].id]: true
        }));
      }
    } catch (error) {
      console.error('Gagal mengambil data postingan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Logika toggle Like (Optimistic UI Update + Database Sync)
  const handleLike = async (postId: string) => {
    // 1. Update UI secara instan
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const liked = !post.likedByUser;
          return {
            ...post,
            likedByUser: liked,
            likes: liked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      })
    );

    // 2. Sinkronisasi ke Database
    try {
      await apiClient.post(`/komunitas/posts/${postId}/like`);
    } catch (error) {
      console.error('Gagal memproses like ke database:', error);
      // Rollback jika request database gagal
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const liked = !post.likedByUser;
            return {
              ...post,
              likedByUser: liked,
              likes: liked ? post.likes + 1 : post.likes - 1
            };
          }
          return post;
        })
      );
    }
  };

  // Logika toggle Komentar
  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Logika mengirim komentar baru (Optimistic UI + Database Sync)
  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    if (submittingComment[postId]) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));

    const tempCommentId = `temp-${Date.now()}`;
    const tempComment: Comment = {
      id: tempCommentId,
      namaUser: currentUser?.namaIbu || 'Anda',
      avatar: currentUser?.fotoProfil || null,
      timestamp: new Date().toISOString(),
      isiKomentar: content,
      authorId: currentUser?.id || '',
      isSubscribed: currentUser?.isSubscribed || false,
    };

    // Optimistic Update: Tambah ke UI secara instan
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, tempComment]
          };
        }
        return post;
      })
    );

    // Reset field input & buka utas komentar
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));

    // Kirim data ke API backend
    try {
      const response = await apiClient.post(`/komunitas/posts/${postId}/comments`, {
        isiKomentar: content
      });

      // Tukar data komentar sementara dengan data tersimpan dari database
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(c => c.id === tempCommentId ? response.data : c)
            };
          }
          return post;
        })
      );
      showToast('Komentar berhasil dikirim!', 'success');
    } catch (error: any) {
      console.error('Gagal mengirim komentar ke database:', error);
      // Rollback: Hapus komentar temp dan kembalikan teks ke input field
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.filter(c => c.id !== tempCommentId)
            };
          }
          return post;
        })
      );
      setCommentInputs(prev => ({ ...prev, [postId]: content }));
      showToast(error.response?.data?.message || 'Gagal mengirim komentar. Silakan periksa koneksi Anda.', 'error');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Logika membuat postingan baru (Optimistic UI + Database Sync)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newPostContent.trim();
    if (!content) return;

    const tempPostId = `temp-${Date.now()}`;
    const tempPost: Post = {
      id: tempPostId,
      namaUser: currentUser?.namaIbu || 'Anda',
      avatar: currentUser?.fotoProfil || null,
      timestamp: new Date().toISOString(),
      isiPost: content,
      tag: newPostTag,
      likes: 0,
      likedByUser: false,
      comments: [],
      authorId: currentUser?.id || '',
      isSubscribed: currentUser?.isSubscribed || false,
    };

    // Optimistic Update: taruh di paling atas feed secara instan
    setPosts(prevPosts => [tempPost, ...prevPosts]);
    setIsPostModalOpen(false);
    setIsTagDropdownOpen(false);
    setNewPostContent('');

    // Kirim ke database
    try {
      const response = await apiClient.post('/komunitas/posts', {
        isiPost: content,
        tag: newPostTag
      });

      // Tukar postingan sementara dengan postingan asli dari database
      setPosts(prevPosts => 
        prevPosts.map(post => post.id === tempPostId ? response.data : post)
      );
    } catch (error) {
      console.error('Gagal membuat postingan ke database:', error);
      // Hapus postingan sementara dari UI & kembalikan input modal
      setPosts(prevPosts => prevPosts.filter(post => post.id !== tempPostId));
      setNewPostContent(content);
      setIsPostModalOpen(true);
      alert('Gagal mengirim postingan. Silakan coba kembali.');
    }
  };

  // Logika menghapus postingan (Sync database + UI)
  const handleDeletePost = async (postId: string) => {
    const confirmDelete = window.confirm('Apakah Bunda yakin ingin menghapus postingan ini secara permanen?');
    if (!confirmDelete) return;

    const originalPosts = [...posts];

    // Optimistic UI Update: langsung hapus dari UI
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

    try {
      await apiClient.delete(`/komunitas/posts/${postId}`);
    } catch (error) {
      console.error('Gagal menghapus postingan:', error);
      alert('Gagal menghapus postingan. Silakan coba lagi.');
      // Rollback jika gagal
      setPosts(originalPosts);
    }
  };

  // Logika menghapus komentar (Sync database + UI)
  const handleDeleteComment = async (postId: string, commentId: string) => {
    const confirmDelete = window.confirm('Apakah Bunda yakin ingin menghapus balasan komentar ini secara permanen?');
    if (!confirmDelete) return;

    // Optimistic UI Update: langsung hapus komentar dari UI
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.filter(c => c.id !== commentId)
          };
        }
        return post;
      })
    );

    try {
      await apiClient.delete(`/komunitas/comments/${commentId}`);
      showToast('Komentar berhasil dihapus', 'success');
    } catch (error: any) {
      console.error('Gagal menghapus komentar dari database:', error);
      showToast(error.response?.data?.message || 'Gagal menghapus komentar.', 'error');
      // Re-fetch untuk me-revert state komentar secara aman
      fetchPosts();
    }
  };

  // Filter postingan berdasarkan query pencarian dan kategori aktif
  const filteredPosts = posts.filter(post => {
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !searchLower ||
      post.isiPost.toLowerCase().includes(searchLower) ||
      post.namaUser.toLowerCase().includes(searchLower) ||
      post.tag.toLowerCase().includes(searchLower) ||
      post.comments.some(c => 
        c.isiKomentar.toLowerCase().includes(searchLower) ||
        c.namaUser.toLowerCase().includes(searchLower)
      );
    
    const matchesCategory = activeCategory === 'Semua' || post.tag === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-6 md:pt-12 pb-24 mobile-bottom-pad px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* 1. Hero Banner (Khusus Desktop, disembunyikan di HP) */}
        <div className="hidden md:flex bg-gradient-to-r from-[#CCFBF1] to-[#E0F2FE] rounded-[2rem] p-6 sm:p-8 border border-teal-100/50 shadow-sm relative overflow-hidden flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 z-10 text-left max-w-md">
            <span className="bg-[#389D9C]/10 text-[#389D9C] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Forum Diskusi
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#194668] tracking-tight">
              Hai, {currentUser?.namaIbu || 'Ibu Hebat'}! 👋
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Selamat datang di ruang hangat kami. Berbagi cerita kehamilan, ajukan pertanyaan seputar nutrisi, kesehatan, atau persalinan, dan mari saling menguatkan.
            </p>
          </div>
          {/* Ilustrasi Komunitas */}
          <div className="w-36 sm:w-56 md:w-60 flex-shrink-0 flex items-center justify-center relative">
            <img 
              src={komunitasImg} 
              alt="Ilustrasi Komunitas Ibu Hamil" 
              className="w-full h-auto object-contain drop-shadow-[0_10px_15px_rgba(25,70,104,0.08)] transform hover:scale-102 transition-transform duration-300"
            />
          </div>
        </div>

        {/* 2. Redesain Search Bar (UI/UX Improvement) */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 space-y-5 text-left animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#194668] mb-1 flex items-center gap-2 tracking-tight">
              <Search className="w-5 h-5 text-[#389D9C]" />
              Cari di komunitas...
            </h2>
            <p className="text-xs text-slate-400 font-semibold">Temukan pengalaman dan tips dari ibu hamil lainnya.</p>
          </div>

          {/* Minimalist & Compact Search Input Bar dengan Clear Button & Focus Ring */}
          <div className="flex gap-3 items-center w-full">
            <div className="relative flex-1 flex items-center">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik, pengalaman, atau tips..." 
                className="w-full h-12 pl-10 pr-10 rounded-full bg-white border border-slate-200 focus:outline-none focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/20 transition-all text-sm text-slate-700 placeholder-slate-400 font-medium shadow-xs hover:border-slate-300"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer flex items-center justify-center"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <button 
              className="h-12 px-4 sm:px-6 bg-[#389D9C] hover:bg-[#2E8281] active:scale-95 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
              aria-label="Cari"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Cari</span>
            </button>
          </div>

          {/* Kategori Tags Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 sm:flex-wrap no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`h-9 px-4 rounded-full text-xs font-bold whitespace-nowrap flex items-center justify-center leading-none transition-all duration-200 cursor-pointer ${
                  activeCategory === category
                    ? 'bg-[#389D9C] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Daftar Feed Postingan */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded-full w-1/3 mx-auto"></div>
              <div className="h-4 bg-slate-200 rounded-full w-2/3 mx-auto"></div>
              <div className="h-4 bg-slate-200 rounded-full w-1/2 mx-auto"></div>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const isExpanded = expandedComments[post.id] || false;
              
              return (
                <div 
                  key={post.id} 
                  id={`post-${post.id}`}
                  className={`bg-white rounded-[2rem] border shadow-md p-4 sm:p-6 md:p-8 space-y-6 hover:shadow-lg transition-all duration-300 relative text-left ${
                    highlightedPostId === post.id 
                      ? 'border-[#389D9C] ring-4 ring-[#389D9C]/20 shadow-lg' 
                      : 'border-slate-100/80'
                  }`}
                >
                  {/* Header Postingan */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        size="md"
                        src={post.avatar}
                        name={post.namaUser}
                        isSubscribed={post.isSubscribed}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-none">
                            {post.namaUser}
                          </h3>
                        </div>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1 block flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 inline" />
                          {getRelativeTime(post.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tombol Hapus Cepat (Khusus Author Postingan) */}
                      {post.authorId === currentUser?.id && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Postingan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Menu 3-Titik Postingan Utama (Komentar Utama) */}
                      <div 
                        className="relative"
                        ref={activeMenuId === `post-${post.id}` ? activeDropdownRef : null}
                      >
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === `post-${post.id}` ? null : `post-${post.id}`);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeMenuId === `post-${post.id}`
                              ? 'bg-slate-200/80 text-slate-700'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/80'
                          }`}
                          title="Opsi postingan"
                          aria-label="Opsi postingan"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu Postingan Utama */}
                        {activeMenuId === `post-${post.id}` && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 z-40 min-w-[200px] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.12)] p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right text-left"
                          >
                            {/* Salin Tautan Postingan */}
                            <button
                              type="button"
                              onClick={() => {
                                handleCopyPostLink(post.id, post.isiPost);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#389D9C] hover:bg-teal-50/80 rounded-xl transition-colors cursor-pointer text-left"
                            >
                              <Link2 className="w-3.5 h-3.5 text-[#389D9C]" />
                              <span>Salin Tautan</span>
                            </button>

                            {/* Laporkan Postingan (jika bukan postingan sendiri) */}
                            {post.authorId !== currentUser?.id && (
                              <button
                                type="button"
                                disabled={reportingPost[post.id]}
                                onClick={() => {
                                  handleReportPost(post.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer text-left disabled:opacity-50"
                              >
                                <Flag className="w-3.5 h-3.5 text-rose-500" />
                                <span>{reportingPost[post.id] ? 'Melaporkan...' : 'Laporkan Postingan'}</span>
                              </button>
                            )}

                            {/* Hapus Postingan jika postingan sendiri */}
                            {post.authorId === currentUser?.id && (
                              <>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDeletePost(post.id);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer text-left"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Hapus Postingan</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body Postingan */}
                  <div className="space-y-3">
                    <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
                      {post.isiPost}
                    </p>
                    
                    {/* Kapsul Tag */}
                    <span 
                      onClick={() => setActiveCategory(post.tag)}
                      className="inline-flex items-center gap-1.5 bg-teal-50/50 hover:bg-teal-50 text-[#389D9C] px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {post.tag}
                    </span>
                  </div>

                  {/* Engagement Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-slate-500 text-xs sm:text-sm font-semibold">
                    <div className="flex items-center gap-4">
                      {/* Tombol Like Interaktif dengan Coral-Red Solid */}
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full transition-colors cursor-pointer ${
                          post.likedByUser 
                            ? 'bg-rose-50 text-[#EF4444]' 
                            : 'hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        <Heart className={`w-5 h-5 transition-transform ${post.likedByUser ? 'fill-current scale-110' : ''}`} />
                        <span>{post.likes}</span>
                      </button>

                      {/* Tombol Komentar */}
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments.length}</span>
                      </button>
                    </div>

                    {/* Toggle Link Komentar */}
                    <button 
                      onClick={() => toggleComments(post.id)}
                      className="text-[#389D9C] hover:text-[#2c7d7c] font-bold text-xs sm:text-sm hover:underline cursor-pointer"
                    >
                      {isExpanded ? 'Tutup komentar' : `Lihat ${post.comments.length} komentar`}
                    </button>
                  </div>

                  {/* 4. Area Balasan Komentar (Nested Thread View) */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Utas Komentar */}
                      {post.comments.length > 0 ? (
                        <div className="space-y-3">
                          {post.comments.map((comment) => {
                            const isHighlighted = highlightedCommentId === comment.id;
                            const isMenuOpen = activeMenuId === `comment-${comment.id}`;
                            const isCommentAuthorOrPostAuthor = comment.authorId === currentUser?.id || post.authorId === currentUser?.id;

                            return (
                              <div 
                                key={comment.id} 
                                id={`comment-${comment.id}`}
                                className={`ml-2 sm:ml-8 rounded-2xl p-3 sm:p-4 flex gap-2.5 sm:gap-3 text-left relative transition-all duration-300 ${
                                  isHighlighted 
                                    ? 'bg-teal-50/70 border-2 border-[#389D9C] shadow-md ring-4 ring-[#389D9C]/20' 
                                    : 'bg-[#F8FAFC] border border-slate-100/60 hover:border-slate-200'
                                }`}
                              >
                                <UserAvatar
                                  size="sm"
                                  src={comment.avatar}
                                  name={comment.namaUser}
                                  isSubscribed={comment.isSubscribed}
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                                        {comment.namaUser}
                                      </span>
                                      {comment.isSubscribed && (
                                        <span 
                                          className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-[#389D9C] to-[#75D5D4] text-white text-[8px] font-black uppercase tracking-wider shrink-0 shadow-2xs"
                                          title="Member Berlangganan Aktif"
                                        >
                                          PRO
                                        </span>
                                      )}
                                      {comment.peran && (
                                        <span className="bg-[#389D9C]/10 text-[#389D9C] px-2 py-0.5 rounded-full text-[9px] font-black border border-[#389D9C]/20 uppercase tracking-wider">
                                          {comment.peran}
                                        </span>
                                      )}
                                      <span className="text-[9px] sm:text-xs text-slate-400 font-bold ml-1.5">
                                        {getRelativeTime(comment.timestamp)}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5">
                                      {/* Menu 3-Titik Komentar */}
                                      <div 
                                        className="relative"
                                        ref={isMenuOpen ? activeDropdownRef : null}
                                      >
                                        <button 
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(isMenuOpen ? null : `comment-${comment.id}`);
                                          }}
                                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                            isMenuOpen
                                              ? 'bg-slate-200/80 text-slate-700'
                                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                                          }`}
                                          title="Opsi komentar"
                                          aria-label="Opsi komentar"
                                        >
                                          <MoreHorizontal className="w-4 h-4" />
                                        </button>

                                        {/* Dropdown Menu dengan tema desain Bumilfit */}
                                        {isMenuOpen && (
                                          <div 
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 top-full mt-1.5 z-40 min-w-[200px] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.12)] p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right text-left"
                                          >
                                            {/* Salin Tautan Komentar */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleCopyCommentLink(post.id, comment.id, comment.isiKomentar);
                                                setActiveMenuId(null);
                                              }}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#389D9C] hover:bg-teal-50/80 rounded-xl transition-colors cursor-pointer text-left"
                                            >
                                              <Link2 className="w-3.5 h-3.5 text-[#389D9C]" />
                                              <span>Salin Tautan</span>
                                            </button>

                                            {/* Laporkan Komentar (jika bukan komentar sendiri) */}
                                            {comment.authorId !== currentUser?.id && (
                                              <button
                                                type="button"
                                                disabled={reportingComment[comment.id]}
                                                onClick={() => {
                                                  handleReportComment(post.id, comment.id);
                                                  setActiveMenuId(null);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer text-left disabled:opacity-50"
                                              >
                                                <Flag className="w-3.5 h-3.5 text-rose-500" />
                                                <span>{reportingComment[comment.id] ? 'Melaporkan...' : 'Laporkan Komentar'}</span>
                                              </button>
                                            )}

                                            {/* Hapus Komentar jika author komentar atau author postingan */}
                                            {isCommentAuthorOrPostAuthor && (
                                              <>
                                                <div className="my-1 border-t border-slate-100" />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setActiveMenuId(null);
                                                    handleDeleteComment(post.id, comment.id);
                                                  }}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer text-left"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>Hapus Komentar</span>
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                                    {comment.isiKomentar}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-2">Belum ada komentar. Jadilah yang pertama membalas!</p>
                      )}

                      {/* Input Balasan Komentar Baru (Tanpa input nama manual) */}
                      <form 
                        onSubmit={(e) => handleAddComment(post.id, e)}
                        className="flex gap-2 items-center ml-4 sm:ml-8 pt-2"
                      >
                        <input 
                          type="text" 
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Tulis komentar balasan..." 
                          disabled={submittingComment[post.id]}
                          className="flex-1 py-2.5 px-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#389D9C]/20 focus:border-[#389D9C] transition-all bg-slate-50/30 text-slate-700 disabled:opacity-60"
                        />
                        <button 
                          type="submit" 
                          disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                          className="bg-[#389D9C] hover:bg-[#2E8281] disabled:bg-slate-200 disabled:cursor-not-allowed text-white p-2.5 rounded-xl flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                          aria-label="Kirim balasan"
                        >
                          {submittingComment[post.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="py-12 px-4 text-center text-slate-400 space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-500">Tidak ada hasil diskusi ditemukan</p>
              <p className="text-xs max-w-sm mx-auto">Coba cari kata kunci lain atau pilih kategori yang berbeda untuk menemukan topik diskusi.</p>
            </div>
          )}
        </div>

      </div>

      {/* 5. Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-8 right-4 sm:right-6 z-40 bg-[#389D9C] hover:bg-[#2E8281] active:scale-95 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer hover:shadow-xl group"
        aria-label="Buat Postingan Baru"
      >
        <Plus className="w-7 h-7 transform group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* 6. Modal Pembuatan Postingan Baru (Tanpa input nama manual) */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay Gelap */}
          <div 
            onClick={() => {
              setIsPostModalOpen(false);
              setIsTagDropdownOpen(false);
            }}
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-xs transition-opacity"
          />

          {/* Konten Modal */}
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-5 sm:p-8 z-10 border border-slate-100 text-left relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                setIsPostModalOpen(false);
                setIsTagDropdownOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Buat Postingan Baru
            </h3>
            <p className="text-xs text-slate-400 font-semibold mb-6">Bagikan pertanyaan, tips kehamilan, atau sekadar cerita Bunda hari ini.</p>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Info Pengguna Terautentikasi (Otomatis) */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                <UserAvatar
                  size="sm"
                  src={currentUser?.fotoProfil}
                  name={currentUser?.namaIbu}
                  isSubscribed={currentUser?.isSubscribed}
                />
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Memposting sebagai</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-700">{currentUser?.namaIbu || 'Ibu Hamil'}</span>
                    {currentUser?.isSubscribed && (
                      <span 
                        className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-[#389D9C] to-[#75D5D4] text-white text-[8px] font-black uppercase tracking-wider shrink-0 shadow-2xs"
                        title="Member Berlangganan Aktif"
                      >
                        PRO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Kategori Diskusi (Custom Modern Dropdown) */}
              <div className="space-y-1.5" ref={tagDropdownRef}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Kategori Topik
                </label>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setIsTagDropdownOpen(prev => !prev)}
                    className={`w-full py-2.5 px-3.5 text-sm rounded-xl border transition-all flex items-center justify-between cursor-pointer bg-slate-50/70 hover:bg-white text-left ${
                      isTagDropdownOpen 
                        ? 'border-[#389D9C] ring-2 ring-[#389D9C]/20 bg-white shadow-xs' 
                        : 'border-slate-200 hover:border-[#389D9C]/50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {(() => {
                        const activeConfig = categoryConfig[newPostTag];
                        const ActiveIcon = activeConfig?.icon || BookOpen;
                        return (
                          <>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeConfig?.bg || 'bg-teal-50'}`}>
                              <ActiveIcon className={`w-4 h-4 ${activeConfig?.color || 'text-[#389D9C]'}`} />
                            </div>
                            <span className="font-bold text-slate-700 text-sm truncate">
                              {newPostTag}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                      isTagDropdownOpen ? 'rotate-180 text-[#389D9C]' : ''
                    }`} />
                  </button>

                  {/* Dropdown Menu Options */}
                  {isTagDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      {categories.filter(c => c !== 'Semua').map((tag) => {
                        const isSelected = newPostTag === tag;
                        const config = categoryConfig[tag];
                        const ItemIcon = config?.icon || BookOpen;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setNewPostTag(tag);
                              setIsTagDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-teal-50/80 text-[#389D9C]' 
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config?.bg || 'bg-slate-100'}`}>
                              <ItemIcon className={`w-4 h-4 ${config?.color || 'text-slate-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#389D9C]' : 'text-slate-700'}`}>
                                {tag}
                              </p>
                              {config?.desc && (
                                <p className="text-[11px] text-slate-400 truncate font-medium">
                                  {config.desc}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#389D9C] flex items-center justify-center shrink-0 ml-2">
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Isi Postingan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Isi Cerita / Pertanyaan</label>
                <textarea 
                  required
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan cerita, keluhan, atau tips di sini Bun..." 
                  className="w-full py-3 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#389D9C]/20 focus:border-[#389D9C] transition-all bg-slate-50/50 text-slate-700 leading-relaxed font-normal resize-none"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsPostModalOpen(false);
                    setIsTagDropdownOpen(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#389D9C] hover:bg-[#2E8281] text-white font-bold text-sm transition-all shadow-sm cursor-pointer text-center"
                >
                  Kirim Postingan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Toast Notification Feedback */}
      {toast && (
        <div className={`fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:bottom-8 right-4 sm:right-6 z-50 max-w-[calc(100vw-2rem)] px-5 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.type === 'success' 
            ? 'bg-teal-50 border-teal-200 text-teal-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="text-[#389D9C] flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-500 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
};
