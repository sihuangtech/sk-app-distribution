import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

// 读取配置文件
let config: any;
try {
  const configPath = path.join(process.cwd(), 'config.yaml');
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(configFile);
  
  // 验证必要的配置项
  if (!config.server || !config.server.frontend_port || !config.server.backend_port) {
    throw new Error('配置文件中缺少必要的端口配置');
  }
} catch (e) {
  console.error('Failed to read config file:', e);
  console.error('Please ensure config.yaml exists and contains correct port configuration');
  process.exit(1);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: config.server.frontend_port,
    host: true,
    proxy: {
      // 代理所有API请求到后端服务器
      '/api': {
        target: `http://localhost:${config.server.backend_port}`,
        changeOrigin: true,
      },
      '/upload': {
        target: `http://localhost:${config.server.backend_port}`,
        changeOrigin: true,
      },
      '/download': {
        target: `http://localhost:${config.server.backend_port}`,
        changeOrigin: true,
      },
      // 代理根路径的文件下载请求（包含文件扩展名的请求）
      '^/[^/]*\\.[^/]+$': {
        target: `http://localhost:${config.server.backend_port}`,
        changeOrigin: true,
      }
    }
  }
}); 