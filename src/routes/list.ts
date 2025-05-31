// src/routes/list.ts
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 递归获取 uploads 目录下所有文件及其路径
const getFiles = (dir: string, fileList: { name: string, path: string }[] = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      // 递归获取子目录文件
      getFiles(filePath, fileList);
    } else {
      // 添加文件到列表
      // 移除 uploads 目录前缀，生成相对路径
      const relativePath = path.relative(path.join(__dirname, '..', '..', 'uploads'), filePath);
      fileList.push({ name: file, path: `/${relativePath.replace(/\\/g, '/')}` }); // 将 Windows 路径分隔符转换为 '/' 并添加 '/' 前缀
    }
  });

  return fileList;
};

// 提供文件列表接口
router.get('/', (req: Request, res: Response) => {
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

  try {
    const files = getFiles(uploadsDir);
    res.status(200).json(files);
  } catch (err: any) {
    console.error('获取文件列表失败:', err);
    res.status(500).send('获取文件列表失败。');
  }
});

export default router; 