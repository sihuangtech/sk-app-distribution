import multer from 'multer';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import type { Request } from 'express';

// 读取配置文件
const getConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'config.yaml');
    const configFile = fs.readFileSync(configPath, 'utf8');
    return yaml.load(configFile) as any;
  } catch (error) {
    console.error('Failed to read config file:', error);
    throw error; // 直接抛出错误，不使用默认配置
  }
};

// 设置文件上传存储目录和文件名
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    // 直接使用uploads目录
    const uploadPath = path.join(process.cwd(), 'uploads');

    // 确保uploads目录存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    console.log('File upload to:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // 直接使用原始文件名，不添加时间戳
    const originalName = file.originalname;
    
    console.log('Using original filename:', originalName);
    cb(null, originalName);
  }
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const config = getConfig();
  const allowedExtensions = config.upload.allowed_extensions;
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${fileExtension}。允许的类型: ${allowedExtensions.join(', ')}`));
  }
};

// 创建multer实例
const createUpload = () => {
  const config = getConfig();
  const maxFileSize = config.upload.max_file_size * 1024 * 1024; // 转换为字节
  
  return multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSize
    }
  });
};

// 导出一个函数，每次调用时创建新的upload实例以获取最新配置
export const getUploadMiddleware = () => createUpload();

// 为了向后兼容，也导出一个默认实例
const upload = createUpload();
export default upload; 