import express from 'express';
import type { Request, Response, RequestHandler } from 'express';
import upload from '../config/multer.ts';
import type { MulterRequest } from '../types.ts';
import path from 'path';
import fs from 'fs';

// 修改为导出函数，接收 config 作为参数
const uploadRouter = (config: any) => {
  const router = express.Router();

  // 处理文件上传，直接使用导入的 upload 实例
  router.post('/', upload.single('package'), ((req: MulterRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有上传文件。' });
    }

    // 从请求体中获取分类信息（用于记录，但不影响存储路径）
    const { application, os, architecture, versionType } = req.body;
    
    // 验证必要参数
    if (!application || !os || !architecture || !versionType) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要的参数：应用名称、操作系统、架构或版本类型。' 
      });
    }

    // 简化下载路径，直接使用文件名
    const downloadUrl = `/download/${req.file.filename}`;
    
    console.log('文件上传成功:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      downloadUrl: downloadUrl,
      metadata: { application, os, architecture, versionType }
    });

    res.status(200).json({ 
      success: true, 
      message: '文件上传成功！', 
      downloadUrl: downloadUrl 
    });
  }) as RequestHandler);

  return router; // 返回配置好的路由
};

export default uploadRouter; 