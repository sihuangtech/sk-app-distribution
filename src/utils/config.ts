// src/utils/config.ts

interface Config {
  server: {
    backend_port: number;
  };
}

let cachedConfig: Config | null = null;
let configPromise: Promise<Config> | null = null;

// 获取配置信息
export const getConfig = async (): Promise<Config> => {
  if (cachedConfig) {
    return cachedConfig;
  }

  // 如果已经有一个正在进行的配置请求，等待它完成
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    try {
      // 开发环境和生产环境都使用相对路径
      // 开发环境通过Vite代理转发到后端
      const response = await fetch('/api/config');
      
      if (!response.ok) {
        throw new Error('获取配置失败');
      }
      
      const config = await response.json();
      cachedConfig = config;
      configPromise = null; // 重置promise
      return config;
    } catch (error) {
      configPromise = null; // 重置promise
      console.error('Failed to get config:', error);
      throw error;
    }
  })();

  return configPromise;
};

// 获取API基础URL
export const getApiBaseUrl = async (): Promise<string> => {
  if (import.meta.env.DEV) {
    // 开发环境：使用相对路径，由Vite代理处理
    return '';
  } else {
    // 生产环境：使用相对路径
    return '';
  }
};

// 清除配置缓存
export const clearConfigCache = (): void => {
  cachedConfig = null;
  configPromise = null;
}; 