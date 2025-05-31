import express, { Request, Response, RequestHandler } from 'express';
import upload from '../config/multer'; // 导入配置好的 multer 实例
import { MulterRequest } from '../types'; // 导入自定义 MulterRequest 类型
import path from 'path'; // 引入 path 模块
import fs from 'fs'; // 引入 fs 模块

// 修改为导出函数，接收 config 作为参数
const uploadRouter = (config: any) => {
  const router = express.Router();

  // 添加认证中间件
  router.use((req, res, next) => {
    // 简单的 basic 认证示例 (生产环境请使用更安全的认证方式)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
      const username = auth[0];
      const password = auth[1];

      if (username === config.admin.username && password === config.admin.password) {
        next(); // 认证成功，继续处理请求
      } else {
        res.status(401).send('认证失败');
      }
    } else {
      res.status(401).send('需要认证');
    }
  });

  // 处理文件上传，直接使用导入的 upload 实例
  router.post('/', upload.single('package'), ((req: MulterRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).send('没有上传文件。');
    }
    // 文件上传成功，返回文件的相对下载路径 (只包含文件名)
    const downloadUrl = `/download/${req.file.originalname}`;
    res.status(200).json({ message: '文件上传成功！', downloadUrl: downloadUrl });
  }) as RequestHandler); // 使用 RequestHandler 断言

  return router; // 返回配置好的路由
};

export default uploadRouter; 