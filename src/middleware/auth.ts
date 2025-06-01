import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function verifyToken(config: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: '访问被拒绝，缺少token'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      (req as any).user = decoded;
      next();
    } catch (error) {
      res.status(403).json({
        success: false,
        message: 'Token无效或已过期'
      });
    }
  };
} 