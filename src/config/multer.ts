import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

// 设置文件上传存储目录和文件名
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    // 直接使用uploads目录
    const uploadPath = path.join(process.cwd(), 'uploads');

    // 确保uploads目录存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    console.log('文件上传到:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // 生成唯一文件名：时间戳 + 原始文件名
    const timestamp = Date.now();
    const originalName = file.originalname;
    const uniqueFilename = `${timestamp}_${originalName}`;
    
    console.log('生成文件名:', uniqueFilename);
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });

export default upload; 