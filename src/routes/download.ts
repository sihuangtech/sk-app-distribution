import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Throttle } from 'stream-throttle'; // 导入 Throttle 类

// 修改为导出函数，接收 config 作为参数
const downloadRouter = (config: any) => {
  const router = express.Router();

// 递归搜索文件（保留原有功能作为备用）
const findFile = (startDir: string, filename: string, callback: (err: Error | null, filePath: string | null) => void) => {
  fs.readdir(startDir, { withFileTypes: true }, (err, entries) => {
    if (err) {
      return callback(err, null);
    }

    for (const entry of entries) {
      const fullPath = path.join(startDir, entry.name);
      if (entry.isDirectory()) {
        // 递归搜索子目录
        findFile(fullPath, filename, callback);
      } else if (entry.isFile() && entry.name === filename) {
        // 找到文件
        return callback(null, fullPath);
      }
    } 
    // 如果循环结束还没有找到，不在这里调用 callback，避免多次调用
  });
};

// 处理文件下载的通用函数
const streamFile = (fullPath: string, res: Response, originalFilename: string, speedLimitKbps: number) => {
  // 安全检查：确保文件路径在 uploads 目录内
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fullPath.startsWith(uploadsDir)) {
    return res.status(403).send('访问被拒绝。');
  }

  // 检查文件是否存在
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File not found:', fullPath);
      return res.status(404).send('文件未找到。');
    }

    // 设置响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFilename)}"`);

    const fileStream = fs.createReadStream(fullPath);

    if (speedLimitKbps > 0) {
      const speedLimitBps = speedLimitKbps * 1024 * 1024; // MB/s 转 Bytes/s
      console.log(`Limiting download speed to ${speedLimitKbps} MB/s`);
      const throttleStream = new Throttle({ rate: speedLimitBps });
      fileStream.pipe(throttleStream).pipe(res);
    } else {
      console.log('No download speed limit applied.');
      fileStream.pipe(res);
    }

    // 处理流的错误
    fileStream.on('error', (streamErr) => {
      console.error('File stream error:', streamErr);
      if (!res.headersSent) {
        res.status(500).send('文件读取失败。');
      }
    });

    res.on('finish', () => {
      console.log('File download finished.', fullPath);
    });

    res.on('error', (resErr) => {
      console.error('Response stream error:', resErr);
      // 如果响应流出错，尝试关闭文件流以释放资源
      fileStream.destroy();
    });
  });
};

// 支持完整路径的文件下载：/download/app/os/arch/version/filename
router.get('/:application/:os/:architecture/:versionType/:filename', (req: Request, res: Response) => {
  const { application, os, architecture, versionType, filename } = req.params;
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // 构建完整的文件路径
  const fullPath = path.join(uploadsDir, application, os, architecture, versionType, filename);
  
  const speedLimitKbps = config.download?.speed_limit_kbps || 0;
  
  streamFile(fullPath, res, filename, speedLimitKbps);
});

// 简化的文件下载路由 - 支持原始文件名查找
router.get('/:filename', (req: Request, res: Response) => {
  const originalFilename = req.params.filename;
  const uploadsDir = path.join(process.cwd(), 'uploads');

  console.log('Attempting to download file by original name:', originalFilename);

  // 直接查找原始文件名
  const fullPath = path.join(uploadsDir, originalFilename);
  
  const speedLimitKbps = config.download?.speed_limit_kbps || 0;

  streamFile(fullPath, res, originalFilename, speedLimitKbps);
});

  return router; // 返回配置好的路由
};

export default downloadRouter; // 导出函数 