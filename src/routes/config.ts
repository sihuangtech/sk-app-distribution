import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

export default function configRouter(config: any) {
  // 获取前端需要的配置信息
  router.get('/', (req: Request, res: Response) => {
    try {
      // 直接返回配置文件中的实际值
      const clientConfig = {
        server: {
          backend_port: config.server.backend_port
        },
        website: config.website
      };
      
      res.json(clientConfig);
    } catch (error) {
      console.error('Failed to get config:', error);
      res.status(500).json({ message: '获取配置失败' });
    }
  });

  return router;
} 