import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  let token = req.cookies?.jwt_token;

  // Fallback ke header Authorization jika cookie tidak tersedia
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    // Menyisipkan data user ke dalam request untuk dipakai di controller
    (req as any).user = decoded; 
    next();
  } catch (error) {
    res.status(401).json({ message: 'Sesi tidak valid atau telah kedaluwarsa.' });
  }
};
