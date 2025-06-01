import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

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

// 支持完整路径的文件下载：/download/app/os/arch/version/filename
router.get('/:application/:os/:architecture/:versionType/:filename', (req: Request, res: Response) => {
  const { application, os, architecture, versionType, filename } = req.params;
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // 构建完整的文件路径
  const fullPath = path.join(uploadsDir, application, os, architecture, versionType, filename);
  
  // 安全检查：确保文件路径在uploads目录内
  if (!fullPath.startsWith(uploadsDir)) {
    return res.status(403).send('访问被拒绝。');
  }
  
  console.log('尝试下载文件:', fullPath);
  
  // 检查文件是否存在
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('文件不存在:', fullPath);
      return res.status(404).send('文件未找到。');
    }
    
    // 文件存在，直接下载
    res.download(fullPath, (downloadErr) => {
      if (downloadErr) {
        console.error('文件下载失败:', downloadErr);
        if (!res.headersSent) {
          res.status(500).send('文件下载失败。');
        }
      }
    });
  });
});

// 简化的文件下载路由
router.get('/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const fullPath = path.join(uploadsDir, filename);

  // 安全检查：确保文件路径在uploads目录内
  if (!fullPath.startsWith(uploadsDir)) {
    return res.status(403).send('访问被拒绝。');
  }

  console.log('尝试下载文件:', fullPath);

  // 检查文件是否存在
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('文件不存在:', fullPath);
      return res.status(404).send('文件未找到。');
    }

    // 文件存在，直接下载
    res.download(fullPath, (downloadErr) => {
      if (downloadErr) {
        console.error('文件下载失败:', downloadErr);
        if (!res.headersSent) {
          res.status(500).send('文件下载失败。');
        }
      }
    });
  });
});

export default router; 