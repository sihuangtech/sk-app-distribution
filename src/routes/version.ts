import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 记录服务启动时间
const startTime = new Date();

// 格式化启动时间
const formatStartTime = (startTime: Date) => {
  return startTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// 读取package.json获取版本信息
const getVersionInfo = () => {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const versionInfo: any = {};
    
    if (packageJson.version) versionInfo.project = packageJson.version;
    if (process.version) versionInfo.node = process.version;
    if (packageJson.dependencies?.react) versionInfo.react = packageJson.dependencies.react.replace('^', '');
    if (packageJson.dependencies?.express) versionInfo.express = packageJson.dependencies.express.replace('^', '');
    if (packageJson.devDependencies?.typescript) versionInfo.typescript = packageJson.devDependencies.typescript.replace('^', '');
    if (packageJson.devDependencies?.vite) versionInfo.vite = packageJson.devDependencies.vite.replace('^', '');
    
    // 添加启动时间
    versionInfo.startTime = formatStartTime(startTime);
    
    // 添加运行模式
    versionInfo.mode = process.env.NODE_ENV === 'production' ? '生产模式' : '开发模式';
    
    return versionInfo;
  } catch (error) {
    console.error('Failed to read version info:', error);
    return {};
  }
};

// 获取版本信息
router.get('/', (req: Request, res: Response) => {
  try {
    const versionInfo = getVersionInfo();
    res.json(versionInfo);
  } catch (error) {
    console.error('Failed to get version info:', error);
    res.status(500).json({ message: '获取版本信息失败' });
  }
});

export default router; 