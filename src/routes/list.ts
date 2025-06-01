// src/routes/list.ts
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 获取 uploads 目录下所有文件及其上传时间
const getFiles = (dir: string, fileList: { name: string, path: string, uploadTime: string }[] = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isFile()) {
      // 获取文件的创建时间（上传时间）
      const uploadTime = fileStat.birthtime.toISOString();
      fileList.push({ 
        name: file, 
        path: `/${file}`, // 简化路径，直接使用文件名
        uploadTime: uploadTime
      });
    }
    // 忽略子目录，只处理根目录下的文件
  });

  return fileList;
};

// 提供文件列表接口
router.get('/', (req: Request, res: Response) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  try {
    const files = getFiles(uploadsDir);
    // 按上传时间倒序排列（最新的在前面）
    files.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
    res.status(200).json(files);
  } catch (err: any) {
    console.error('获取文件列表失败:', err);
    res.status(500).send('获取文件列表失败。');
  }
});

// 删除文件接口 - 使用POST方法避免路径匹配问题
router.post('/delete', (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ success: false, message: '文件路径不能为空。' });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    // 移除开头的 '/' 如果存在，获取纯文件名
    const filename = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(uploadsDir, filename);

    // 安全检查：确保文件路径在uploads目录内
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(403).json({ success: false, message: '访问被拒绝。' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: '文件不存在。' });
    }

    // 删除文件
    fs.unlinkSync(fullPath);
    
    console.log('文件删除成功:', fullPath);
    res.status(200).json({ success: true, message: '文件删除成功。' });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ success: false, message: '删除文件失败。' });
  }
});

export default router; 