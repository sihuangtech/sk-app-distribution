import express from 'express';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 登录接口
export default function authRouter(config: any) {
  router.use(express.json());

  // 登录
  router.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    // 验证用户名和密码
    if (username === config.admin.username && password === config.admin.password) {
      // 生成JWT token
      const token = jwt.sign(
        { username: username },
        config.jwt.secret,
        { expiresIn: `${config.admin.sessionDuration}d` }
      );

      res.json({
        success: true,
        token: token,
        message: '登录成功'
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  });

  // 验证token
  router.post('/verify', (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '缺少token'
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      res.json({
        success: true,
        user: decoded,
        message: 'Token有效'
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token无效或已过期'
      });
    }
  });

  return router;
} 