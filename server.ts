// server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml'; // 导入 js-yaml

import uploadRouter from './src/routes/upload';
import downloadRouter from './src/routes/download';
import listRouter from './src/routes/list'; // 导入文件列表路由

const app = express();
const port = 3000;

// 读取配置文件
const configPath = path.join(__dirname, 'config.yaml');
let config: any; // 定义 config 变量

try {
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(configFile); // 解析 YAML 文件
} catch (e) {
  console.error('读取或解析配置文件失败:', e);
  process.exit(1); // 读取配置文件失败，退出应用
}

// 允许跨域请求
app.use(cors());

// 创建 uploads 目录（如果不存在）
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// 将 config 传递给上传路由
app.use('/upload', uploadRouter(config));
app.use('/download', downloadRouter);
app.use('/list', listRouter); // 使用文件列表路由

// 在生产环境中，提供静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 