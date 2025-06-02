import express from 'express';
import type { Request, Response, RequestHandler } from 'express';
import { getUploadMiddleware } from '../config/multer.ts';
import type { MulterRequest } from '../types.ts';
import path from 'path';
import fs from 'fs';

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

// 文件元数据存储路径
const metadataPath = path.join(process.cwd(), 'data', 'file-metadata.json');

// 确保数据目录存在
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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

// 修改为导出函数，接收 config 作为参数
const uploadRouter = (config: any) => {
  const router = express.Router();

  // 处理文件上传，使用动态配置的upload中间件
  router.post('/', (req: Request, res: Response, next) => {
    // 获取最新的upload中间件
    const upload = getUploadMiddleware();
    
    upload.single('package')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: err.message || '文件上传失败' 
        });
      }
      
      const multerReq = req as MulterRequest;
      
      if (!multerReq.file) {
        return res.status(400).json({ success: false, message: '没有上传文件。' });
      }

      // 从请求体中获取分类信息（用于记录，但不影响存储路径）
      const { application, os, architecture, versionType } = multerReq.body;
      
      // 验证必要参数
      if (!application || !os || !architecture || !versionType) {
        return res.status(400).json({ 
          success: false, 
          message: '缺少必要的参数：应用名称、操作系统、架构或版本类型。' 
        });
      }

      // 检查应用文件数量限制
      const metadata = readFileMetadata();
      const appFiles = metadata.filter(file => file.application === application);
      const maxFilesPerApp = config.upload.max_files_per_app;
      
      if (appFiles.length >= maxFilesPerApp) {
        // 删除刚上传的文件
        fs.unlinkSync(multerReq.file.path);
        return res.status(400).json({ 
          success: false, 
          message: `应用 "${application}" 的文件数量已达到上限 (${maxFilesPerApp})。请删除一些旧文件后再试。` 
        });
      }

      // 生成下载链接，直接使用原始文件名
      const downloadUrl = `/${multerReq.file.originalname}`;
      
      // 保存文件元数据
      const newFileMetadata: FileMetadata = {
        originalName: multerReq.file.originalname,
        filename: multerReq.file.filename,
        application,
        os,
        architecture,
        versionType,
        uploadTime: new Date().toISOString(),
        downloadUrl
      };
      
      metadata.push(newFileMetadata);
      saveFileMetadata(metadata);
      
      console.log('File uploaded successfully:', {
        originalname: multerReq.file.originalname,
        filename: multerReq.file.filename,
        path: multerReq.file.path,
        downloadUrl: downloadUrl,
        metadata: { application, os, architecture, versionType }
      });

      res.status(200).json({ 
        success: true, 
        message: '文件上传成功！', 
        downloadUrl: downloadUrl 
      });
    });
  });

  return router; // 返回配置好的路由
};

export default uploadRouter; 