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
import statsRouter from './src/routes/stats.ts';
import { verifyToken } from './src/middleware/auth.ts';
import { recordDownload } from './src/utils/downloadStats.ts';

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

// 信任代理，允许获取真实客户端IP
app.set('trust proxy', true);

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
app.use('/api/list', verifyToken(config), listRouter(config));
app.use('/api/apps', verifyToken(config), appsRouter());
app.use('/api/settings', verifyToken(config), settingsRouter(config));
app.use('/api/version', verifyToken(config), versionRouter);
app.use('/api/stats', verifyToken(config), statsRouter());

// 下载路由（不需要认证，允许公开下载）
app.use('/download', downloadRouter(config));

// 在生产环境中，提供静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'dist')));
}

// 处理根路径的文件下载请求（统一处理生产和开发环境）
app.get('/:filename', (req: Request, res: Response, next) => {
  const filename = req.params.filename;
  
  // 从配置文件读取允许的文件扩展名
  const allowedExtensions = config.upload?.allowed_extensions || [];
  
  // 检查是否是文件下载请求（以配置的文件扩展名结尾）
  const isFile = allowedExtensions.some((ext: string) => filename.toLowerCase().endsWith(ext.toLowerCase()));
  
  if (isFile) {
    // 直接处理文件下载
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      // 记录下载次数（这是主要的下载入口）
      recordDownload(filename, req).catch(error => {
        console.error('Failed to record download:', error);
      });
      
      // 设置下载响应头
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      
      // 发送文件
      res.sendFile(filePath);
    } else {
      res.status(404).send('文件未找到');
    }
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

// 在生产环境中，SPA路由处理（必须在文件下载路由之后）
if (process.env.NODE_ENV === 'production') {
  app.get('/*path', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 