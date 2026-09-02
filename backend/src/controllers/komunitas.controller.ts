import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Ambil semua postingan komunitas beserta detail likes & komentar
export const getPosts = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          include: {
            profilIbu: true,
          },
        },
        likes: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              include: {
                profilIbu: true,
              },
            },
          },
        },
      },
    });

    // Format postingan agar sesuai dengan struktur frontend
    const formattedPosts = posts.map((post) => {
      const isLiked = post.likes.some((like) => like.userId === currentUserId);
      
      let authorName = 'Ibu Anonim';
      let authorAvatar = null;

      if (post.author.role === 'IBU_HAMIL' && post.author.profilIbu) {
        authorName = post.author.profilIbu.namaIbu;
        authorAvatar = post.author.profilIbu.fotoProfil;
      } else if (post.author.role === 'DOKTER') {
        authorName = 'dr. Deniz Affansyah, Sp.OG'; // Default mock doctor name
      }

      const formattedComments = post.comments.map((comment) => {
        let commentAuthorName = 'Ibu Anonim';
        let commentAuthorAvatar = null;
        let commentPeran = undefined;

        if (comment.author.role === 'IBU_HAMIL' && comment.author.profilIbu) {
          commentAuthorName = comment.author.profilIbu.namaIbu;
          commentAuthorAvatar = comment.author.profilIbu.fotoProfil;
        } else if (comment.author.role === 'DOKTER') {
          commentAuthorName = 'dr. Deniz Affansyah, Sp.OG';
          commentPeran = 'Dokter Kandungan';
        }

        return {
          id: comment.id,
          namaUser: commentAuthorName,
          avatar: commentAuthorAvatar,
          timestamp: comment.createdAt.toISOString(),
          isiKomentar: comment.isiKomentar,
          peran: commentPeran,
          authorId: comment.authorId,
        };
      });

      return {
        id: post.id,
        namaUser: authorName,
        avatar: authorAvatar,
        timestamp: post.createdAt.toISOString(),
        isiPost: post.isiPost,
        tag: post.tag,
        likes: post.likes.length,
        likedByUser: isLiked,
        comments: formattedComments,
        authorId: post.authorId,
      };
    });

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Gagal mengambil data postingan' });
  }
};

// Buat postingan baru
export const createPost = async (req: Request, res: Response) => {
  try {
    const authorId = (req as any).user.id;
    const { isiPost, tag } = req.body;

    if (!isiPost || !isiPost.trim()) {
      return res.status(400).json({ message: 'Isi postingan tidak boleh kosong' });
    }

    const newPost = await prisma.post.create({
      data: {
        authorId,
        isiPost: isiPost.trim(),
        tag: tag || 'Keluhan & Tips',
      },
      include: {
        author: {
          include: {
            profilIbu: true,
          },
        },
        likes: true,
        comments: true,
      },
    });

    let authorName = 'Ibu Anonim';
    let authorAvatar = null;
    if (newPost.author.role === 'IBU_HAMIL' && newPost.author.profilIbu) {
      authorName = newPost.author.profilIbu.namaIbu;
      authorAvatar = newPost.author.profilIbu.fotoProfil;
    } else if (newPost.author.role === 'DOKTER') {
      authorName = 'dr. Deniz Affansyah, Sp.OG';
    }

    const formattedPost = {
      id: newPost.id,
      namaUser: authorName,
      avatar: authorAvatar,
      timestamp: newPost.createdAt.toISOString(),
      isiPost: newPost.isiPost,
      tag: newPost.tag,
      likes: 0,
      likedByUser: false,
      comments: [],
      authorId: newPost.authorId,
    };

    res.status(201).json(formattedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Gagal membuat postingan baru' });
  }
};

// Hapus postingan (hanya pembuat yang berhak)
export const deletePost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Postingan tidak ditemukan' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ message: 'Anda tidak berhak menghapus postingan ini' });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Postingan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Gagal menghapus postingan' });
  }
};

// Toggle Like
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const postId = req.params.id as string;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Postingan tidak ditemukan' });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return res.status(200).json({ liked: false, message: 'Like dihapus' });
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      return res.status(200).json({ liked: true, message: 'Postingan disukai' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Gagal memproses like' });
  }
};

// Ambil daftar komentar untuk suatu postingan tertentu
export const getCommentsByPostId = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Postingan tidak ditemukan' });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          include: {
            profilIbu: true,
          },
        },
      },
    });

    const formattedComments = comments.map((comment) => {
      let commentAuthorName = 'Ibu Anonim';
      let commentAuthorAvatar = null;
      let commentPeran = undefined;

      if (comment.author.role === 'IBU_HAMIL' && comment.author.profilIbu) {
        commentAuthorName = comment.author.profilIbu.namaIbu;
        commentAuthorAvatar = comment.author.profilIbu.fotoProfil;
      } else if (comment.author.role === 'DOKTER') {
        commentAuthorName = 'dr. Deniz Affansyah, Sp.OG';
        commentPeran = 'Dokter Kandungan';
      }

      return {
        id: comment.id,
        postId: comment.postId,
        namaUser: commentAuthorName,
        avatar: commentAuthorAvatar,
        timestamp: comment.createdAt.toISOString(),
        isiKomentar: comment.isiKomentar,
        peran: commentPeran,
        authorId: comment.authorId,
      };
    });

    res.status(200).json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Gagal mengambil komentar postingan' });
  }
};

// Buat komentar baru
export const createComment = async (req: Request, res: Response) => {
  try {
    const authorId = (req as any).user.id;
    const postId = req.params.id as string;
    const { isiKomentar } = req.body;

    if (!isiKomentar || !isiKomentar.trim()) {
      return res.status(400).json({ message: 'Isi komentar tidak boleh kosong' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Postingan tidak ditemukan' });
    }

    const newComment: any = await prisma.comment.create({
      data: {
        postId,
        authorId,
        isiKomentar: isiKomentar.trim(),
      },
      include: {
        author: {
          include: {
            profilIbu: true,
          },
        },
      },
    });

    let commentAuthorName = 'Ibu Anonim';
    let commentAuthorAvatar = null;
    let commentPeran = undefined;

    if (newComment.author.role === 'IBU_HAMIL' && newComment.author.profilIbu) {
      commentAuthorName = newComment.author.profilIbu.namaIbu;
      commentAuthorAvatar = newComment.author.profilIbu.fotoProfil;
    } else if (newComment.author.role === 'DOKTER') {
      commentAuthorName = 'dr. Deniz Affansyah, Sp.OG';
      commentPeran = 'Dokter Kandungan';
    }

    const formattedComment = {
      id: newComment.id,
      namaUser: commentAuthorName,
      avatar: commentAuthorAvatar,
      timestamp: newComment.createdAt.toISOString(),
      isiKomentar: newComment.isiKomentar,
      peran: commentPeran,
      authorId: newComment.authorId,
    };

    res.status(201).json(formattedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Gagal membuat komentar baru' });
  }
};

// Hapus komentar
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        post: true,
      },
    });

    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    if (comment.authorId !== userId && comment.post.authorId !== userId) {
      return res.status(403).json({ message: 'Anda tidak berhak menghapus komentar ini' });
    }

    await prisma.comment.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Komentar berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Gagal menghapus komentar' });
  }
};
