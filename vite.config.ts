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
  console.error('读取配置文件失败:', e);
  console.error('请确保config.yaml文件存在且包含正确的端口配置');
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
      '/list': {
        target: `http://localhost:${config.server.backend_port}`,
        changeOrigin: true,
      }
    }
  }
}); 