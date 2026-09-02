import { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import komunitasImg from '../../assets/komunitas.png';

interface Comment {
  id: string;
  namaUser: string;
  avatar: string | null;
  timestamp: string;
  isiKomentar: string;
  peran?: string;
  authorId: string;
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
}

export const KomunitasPage = () => {
  // State untuk data postingan dan profil user
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; namaIbu: string; fotoProfil: string | null } | null>(null);

  // State untuk interaktivitas forum
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // State untuk form postingan baru (Modal FAB)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('Keluhan & Tips');

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

  // Kategori kategori forum
  const categories = ['Semua', 'Keluhan & Tips', 'Nutrisi & Makanan', 'Kesehatan', 'Persiapan Melahirkan'];

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
          id: data.profilIbu?.userId || '',
          namaIbu: data.profilIbu?.namaIbu || 'Ibu Hamil',
          fotoProfil: data.profilIbu?.fotoProfil || null,
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

  // Generator warna avatar berdasarkan nama user
  const getAvatarStyle = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-[#E0F2FE] text-[#0369a1]', // light blue
      'bg-[#FCE7F3] text-[#be185d]', // light pink
      'bg-[#E6F4EA] text-[#137333]', // light green
      'bg-[#FEF3C7] text-[#b45309]', // light amber
      'bg-[#EDE9FE] text-[#6d28d9]', // light purple
    ];
    return colors[hash % colors.length];
  };

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
    };

    // Optimistic Update: taruh di paling atas feed secara instan
    setPosts(prevPosts => [tempPost, ...prevPosts]);
    setIsPostModalOpen(false);
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
    const matchesSearch = 
      post.isiPost.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.namaUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tag.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'Semua' || post.tag === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* 1. Hero Banner */}
        <div className="bg-gradient-to-r from-[#CCFBF1] to-[#E0F2FE] rounded-[2rem] p-6 sm:p-8 border border-teal-100/50 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 z-10 text-left max-w-md">
            <span className="bg-[#389D9C]/10 text-[#389D9C] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Forum Diskusi
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Hai, {currentUser?.namaIbu || 'Ibu Hebat'}! 👋
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Selamat datang di ruang hangat kami. Berbagi cerita kehamilan, ajukan pertanyaan seputar nutrisi, kesehatan, atau persalinan, dan mari saling menguatkan.
            </p>
          </div>
          {/* Ilustrasi Komunitas */}
          <div className="w-48 sm:w-56 md:w-60 flex-shrink-0 flex items-center justify-center relative">
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
            <h2 className="text-lg font-black text-[#0F172A] mb-1 flex items-center gap-2 tracking-tight">
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
              className="h-12 px-6 bg-[#389D9C] hover:bg-[#2c7d7c] active:scale-95 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
              aria-label="Cari"
            >
              <Search className="w-4 h-4" />
              <span>Cari</span>
            </button>
          </div>

          {/* Kategori Tags Filter */}
          <div className="flex gap-2 flex-wrap">
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
              const avatarStyle = getAvatarStyle(post.namaUser);
              
              return (
                <div 
                  key={post.id} 
                  className="bg-white rounded-[2rem] border border-slate-100/80 shadow-md p-6 sm:p-8 space-y-6 hover:shadow-lg transition-all duration-300 relative text-left"
                >
                  {/* Header Postingan */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${avatarStyle}`}>
                        {post.namaUser.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-none">
                          {post.namaUser}
                        </h3>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1 block flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 inline" />
                          {getRelativeTime(post.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tombol Hapus Postingan (Hanya milik author) */}
                      {post.authorId === currentUser?.id && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Postingan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
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
                            const commentAvatarStyle = getAvatarStyle(comment.namaUser);
                            return (
                              <div 
                                key={comment.id} 
                                className="ml-4 sm:ml-8 bg-[#F8FAFC] border border-slate-100/50 rounded-2xl p-4 flex gap-3 text-left relative hover:border-slate-200 transition-colors"
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-3xs flex-shrink-0 ${commentAvatarStyle}`}>
                                  {comment.namaUser.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                                        {comment.namaUser}
                                      </span>
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
                                      {/* Tombol Hapus Komentar (Milik author komentar atau pemilik postingan) */}
                                      {(comment.authorId === currentUser?.id || post.authorId === currentUser?.id) && (
                                        <button 
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-100/50 p-1 rounded-md transition-colors cursor-pointer"
                                          title="Hapus Komentar"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      
                                      <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100/50 cursor-pointer">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </button>
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
                          className="bg-[#389D9C] hover:bg-[#2c7d7c] disabled:bg-slate-200 disabled:cursor-not-allowed text-white p-2.5 rounded-xl flex items-center justify-center transition-colors shadow-xs cursor-pointer"
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
        className="fixed bottom-6 right-6 z-40 bg-[#389D9C] hover:bg-[#2c7d7c] active:scale-95 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer hover:shadow-xl group"
        aria-label="Buat Postingan Baru"
      >
        <Plus className="w-7 h-7 transform group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* 6. Modal Pembuatan Postingan Baru (Tanpa input nama manual) */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay Gelap */}
          <div 
            onClick={() => setIsPostModalOpen(false)}
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-xs transition-opacity"
          />

          {/* Konten Modal */}
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 sm:p-8 z-10 border border-slate-100 text-left relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsPostModalOpen(false)}
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarStyle(currentUser?.namaIbu || 'Ibu Hamil')}`}>
                  {(currentUser?.namaIbu || 'I').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Memposting sebagai</span>
                  <span className="text-sm font-bold text-slate-700">{currentUser?.namaIbu || 'Ibu Hamil'}</span>
                </div>
              </div>

              {/* Kategori Diskusi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori Topik</label>
                <select 
                  value={newPostTag}
                  onChange={(e) => setNewPostTag(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#389D9C]/20 focus:border-[#389D9C] transition-all bg-slate-50/50 text-slate-700 font-bold"
                >
                  {categories.filter(c => c !== 'Semua').map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
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
                  onClick={() => setIsPostModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#389D9C] hover:bg-[#2c7d7c] text-white font-bold text-sm transition-all shadow-sm cursor-pointer text-center"
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
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
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
