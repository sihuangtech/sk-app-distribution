import express, { Request, Response, RequestHandler } from 'express';
import path from 'path';
import fs from 'fs'; // 引入 fs 模块

const router = express.Router();

// 递归搜索文件
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

// 提供文件下载服务
router.get('/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

  findFile(uploadsDir, filename, (err, filePath) => {
    if (err) {
      console.error('搜索文件失败:', err);
      return res.status(500).send('文件下载失败。');
    }

    if (!filePath) {
      return res.status(404).send('文件未找到。');
    }

    res.download(filePath, (downloadErr) => {
      if (downloadErr) {
        console.error('文件下载失败:', downloadErr);
        if (!res.headersSent) {
           res.status(500).send('文件下载失败。');
        }
      }
    });
  });
});

export default router; // 使用 export default 导出 