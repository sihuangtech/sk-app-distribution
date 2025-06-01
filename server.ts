// server.ts
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

import uploadRouter from './src/routes/upload.ts';
import downloadRouter from './src/routes/download.ts';
import listRouter from './src/routes/list.ts';
import authRouter from './src/routes/auth.ts';
import configRouter from './src/routes/config.ts';
import appsRouter from './src/routes/apps.ts';
import { verifyToken } from './src/middleware/auth.ts';

const app = express();

// 读取配置文件
const configPath = path.join(process.cwd(), 'config.yaml');
let config: any;

try {
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(configFile);
} catch (e) {
  console.error('读取或解析配置文件失败:', e);
  process.exit(1);
}

// 从配置文件获取端口
const port = config.server.backend_port;

// 允许跨域请求
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 创建 uploads 目录（如果不存在）
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// 配置路由（不需要认证）
app.use('/api/config', configRouter(config));

// 认证路由（不需要token验证）
app.use('/api/auth', authRouter(config));

// 需要认证的路由
app.use('/upload', verifyToken(config), uploadRouter(config));
app.use('/list', verifyToken(config), listRouter);
app.use('/api/apps', verifyToken(config), appsRouter());

// 下载路由（不需要认证，允许公开下载）
app.use('/download', downloadRouter);

// 在生产环境中，提供静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'dist')));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 