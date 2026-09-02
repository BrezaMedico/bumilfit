import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.jwt_token; // Mengambil token langsung dari cookie

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
