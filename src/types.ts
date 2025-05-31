import { Request } from 'express';

// 定义一个扩展了 Request 接口的类型，用于包含 Multer 添加的 file 属性
interface MulterRequest extends Request {
  file: Express.Multer.File;
}

export { MulterRequest }; 