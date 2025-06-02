// src/routes/list.ts
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getDownloadCount } from '../utils/downloadStats.ts';

// 修改为导出函数，接收 config 作为参数
const listRouter = (config: any) => {
  const router = express.Router();

interface FileMetadata {
  originalName: string;
  filename: string;
  application: string;
  os: string;
  architecture: string;
  versionType: string;
  uploadTime: string;
  downloadUrl: string;
}

interface FileWithMetadata {
  name: string;
  path: string;
  uploadTime: string;
  application: string;
  os: string;
  architecture: string;
  versionType: string;
  size: number;
  downloadCount: number;
}

// 文件元数据存储路径
const metadataPath = path.join(process.cwd(), 'data', 'file-metadata.json');

// 读取文件元数据
const readFileMetadata = (): FileMetadata[] => {
  try {
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to read file metadata:', error);
    return [];
  }
};

// 保存文件元数据
const saveFileMetadata = (metadata: FileMetadata[]): void => {
  try {
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Failed to save file metadata:', error);
  }
};

// 生成下载链接的函数
const generateDownloadUrl = (filename: string): string => {
  // 强制判断：只有明确设置为production才使用域名，其他一律使用localhost
  if (process.env.NODE_ENV === 'production') {
    // 生产环境：使用配置文件中的域名
    const domain = config.website?.domain;
    return `${domain}/${filename}`;
  } else {
    // 开发环境：强制使用localhost
    const backendPort = config.server?.backend_port || 4009;
    return `http://localhost:${backendPort}/${filename}`;
  }
};

// 获取 uploads 目录下所有文件及其元数据
const getFilesWithMetadata = (): FileWithMetadata[] => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const metadata = readFileMetadata();
  const fileList: FileWithMetadata[] = [];

  try {
    // 确保uploads目录存在
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return fileList;
    }

    const files = fs.readdirSync(uploadsDir);
    const validMetadata: FileMetadata[] = [];

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.isFile()) {
        // 直接使用文件名（不再有时间戳前缀）
        const originalName = file;
        
        // 查找对应的元数据
        const fileMetadata = metadata.find(meta => meta.filename === file);
        
        // 根据环境生成下载链接
        const downloadUrl = generateDownloadUrl(originalName);
        
        if (fileMetadata) {
          // 使用元数据中的信息，但下载链接使用当前环境生成的
          fileList.push({
            name: fileMetadata.originalName,
            path: downloadUrl,
            uploadTime: fileMetadata.uploadTime,
            application: fileMetadata.application,
            os: fileMetadata.os,
            architecture: fileMetadata.architecture,
            versionType: fileMetadata.versionType,
            size: fileStat.size,
            downloadCount: getDownloadCount(fileMetadata.filename)
          });
          validMetadata.push(fileMetadata);
        } else {
          // 如果没有元数据，使用默认值
          fileList.push({
            name: originalName,
            path: downloadUrl,
            uploadTime: fileStat.birthtime.toISOString(),
            application: '未知',
            os: '未知',
            architecture: '未知',
            versionType: '未知',
            size: fileStat.size,
            downloadCount: 0
          });
        }
      }
    });

    // 清理无效的元数据（对应的文件不存在）
    if (validMetadata.length !== metadata.length) {
      console.log('Cleaning up invalid metadata entries...');
      saveFileMetadata(validMetadata);
    }

  } catch (error) {
    console.error('Failed to read uploads directory:', error);
  }

  return fileList;
};

// 提供文件列表接口
router.get('/', (req: Request, res: Response) => {
  try {
    const files = getFilesWithMetadata();
    // 按上传时间倒序排列（最新的在前面）
    files.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
    
    // 计算总文件大小
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    // 返回文件列表和统计信息
    res.status(200).json({
      files,
      stats: {
        totalFiles: files.length,
        totalSize: totalSize
      }
    });
  } catch (err: any) {
    console.error('Failed to get file list:', err);
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
    // 移除开头的 '/' 如果存在，获取原始文件名
    const originalFilename = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // 直接使用原始文件名（不再有时间戳前缀）
    const fullPath = path.join(uploadsDir, originalFilename);

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
    
    // 同时删除元数据
    const metadata = readFileMetadata();
    const updatedMetadata = metadata.filter(meta => meta.filename !== originalFilename);
    saveFileMetadata(updatedMetadata);
    
    console.log('File deleted successfully:', fullPath);
    res.status(200).json({ success: true, message: '文件删除成功。' });
  } catch (error) {
    console.error('Failed to delete file:', error);
    res.status(500).json({ success: false, message: '删除文件失败。' });
  }
});

  return router; // 返回配置好的路由
};

export default listRouter; // 导出函数 