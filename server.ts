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
import settingsRouter from './src/routes/settings.ts';
import versionRouter from './src/routes/version.ts';
import { verifyToken } from './src/middleware/auth.ts';

const app = express();

// 读取配置文件
const configPath = path.join(process.cwd(), 'config.yaml');
let config: any;

try {
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(configFile);
} catch (e) {
  console.error('Failed to read or parse config file:', e);
  process.exit(1);
}

// 从配置文件获取端口
const port = config.server.backend_port;

// 允许跨域请求
app.use(cors());

// 配置请求体解析中间件，支持大文件上传
const maxFileSize = config.upload.max_file_size * 1024 * 1024; // 从config.yaml读取，转换为字节
app.use(express.json({ limit: maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: maxFileSize }));
app.use(express.raw({ limit: maxFileSize }));

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
app.use('/api/settings', verifyToken(config), settingsRouter(config));
app.use('/api/version', verifyToken(config), versionRouter);

// 下载路由（不需要认证，允许公开下载）
app.use('/download', downloadRouter(config));

// 处理根路径的文件下载请求（统一处理生产和开发环境）
app.get('/:filename', (req: Request, res: Response, next) => {
  const filename = req.params.filename;
  // 检查是否是文件下载请求（包含文件扩展名）
  if (filename.includes('.')) {
    // 转发到下载路由处理
    req.url = `/download/${filename}`;
    downloadRouter(config)(req, res, next);
  } else {
    // 不是文件请求，根据环境处理
    if (process.env.NODE_ENV === 'production') {
      // 生产环境：继续到SPA路由处理
      next();
    } else {
      // 开发环境：返回404
      res.status(404).send('Not found');
    }
  }
});

// 在生产环境中，提供静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'dist')));

  // SPA路由处理（必须在文件下载路由之后）
  app.get('/*path', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 