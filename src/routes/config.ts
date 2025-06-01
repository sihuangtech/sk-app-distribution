import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

export default function configRouter(config: any) {
  // 获取前端需要的配置信息
  router.get('/', (req: Request, res: Response) => {
    try {
      // 只返回前端需要的配置信息，不暴露敏感信息
      const clientConfig = {
        server: {
          backend_port: config.server.backend_port
        }
      };
      
      res.json(clientConfig);
    } catch (error) {
      console.error('获取配置失败:', error);
      res.status(500).json({ message: '获取配置失败' });
    }
  });

  return router;
} 