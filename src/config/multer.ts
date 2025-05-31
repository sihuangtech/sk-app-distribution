import multer from 'multer';
import path from 'path';
import fs from 'fs'; // 引入 fs 模块
import { Request } from 'express';

// 设置文件上传存储目录和文件名
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    // 从请求体中获取分类信息和版本类型
    const { application, os, architecture, versionType } = req.body;
    // 构建上传路径，回到项目根目录并加上分类信息和版本类型
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', application, os, architecture, versionType);

    // 创建多级目录（如果不存在）
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        console.error('创建上传目录失败:', err);
        return cb(err, ''); // 传递错误给 Multer
      }
      cb(null, uploadPath); // 设置文件上传目录
    });
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // 使用原始文件名
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

export default upload; // 使用 export default 导出 