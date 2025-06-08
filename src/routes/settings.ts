import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = express.Router();

// 配置文件路径
const configPath = path.join(process.cwd(), 'config.yaml');

// 读取配置文件
const readConfig = () => {
  try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    return yaml.load(configFile);
  } catch (error) {
    console.error('Failed to read config file:', error);
    throw new Error('Failed to read configuration');
  }
};

// 写入配置文件
const writeConfig = (config: any) => {
  try {
    const yamlStr = yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    fs.writeFileSync(configPath, yamlStr, 'utf8');
  } catch (error) {
    console.error('Failed to write config file:', error);
    throw new Error('Failed to save configuration');
  }
};

export default function settingsRouter(config: any) {
  // 获取系统配置
  router.get('/', (req: Request, res: Response) => {
    try {
      const currentConfig = readConfig();
      
      // 直接返回配置文件中的实际值
      const clientConfig = {
        website: currentConfig.website,
        upload: currentConfig.upload,
        download: currentConfig.download,
        geolocation: currentConfig.geolocation
      };
      
      res.json(clientConfig);
    } catch (error) {
      console.error('Failed to get settings:', error);
      res.status(500).json({ message: '获取配置失败' });
    }
  });

  // 更新系统配置
  router.put('/', (req: Request, res: Response) => {
    try {
      const { website, upload, download, geolocation } = req.body;
      
      // 验证必要字段
      if (!website || !upload) {
        return res.status(400).json({ message: '配置数据不完整' });
      }

      // 验证网站配置
      if (!website.domain || !website.title || !website.description) {
        return res.status(400).json({ message: '网站配置不完整' });
      }

      // 验证上传配置
      if (!upload.max_file_size || !upload.allowed_extensions || !upload.max_files_per_app) {
        return res.status(400).json({ message: '上传配置不完整' });
      }

      // 验证文件大小限制 - 支持更大的文件大小
      if (upload.max_file_size < 1 || upload.max_file_size > 10240) {
        return res.status(400).json({ message: '文件大小限制必须在1-10240MB之间' });
      }

      // 验证文件扩展名
      if (!Array.isArray(upload.allowed_extensions) || upload.allowed_extensions.length === 0) {
        return res.status(400).json({ message: '必须至少允许一种文件扩展名' });
      }

      // 验证每个扩展名格式
      for (const ext of upload.allowed_extensions) {
        if (!ext.startsWith('.') || ext.length < 2) {
          return res.status(400).json({ message: `无效的文件扩展名: ${ext}` });
        }
      }

      // 验证每个应用最大文件数 - 支持更大的数量
      if (upload.max_files_per_app < 1 || upload.max_files_per_app > 10000) {
        return res.status(400).json({ message: '每个应用最大文件数必须在1-10000之间' });
      }

      // 验证下载配置（如果提供）
      if (download) {
        if (typeof download.speed_limit_kbps !== 'number' || download.speed_limit_kbps < 0) {
          return res.status(400).json({ message: '下载速度限制必须是非负数' });
        }
      }

      // 验证地理信息配置（如果提供）
      if (geolocation) {
        if (typeof geolocation.enabled !== 'boolean') {
          return res.status(400).json({ message: '地理信息启用状态必须是布尔值' });
        }
        
        if (geolocation.enabled) {
          const validProviders = ['ipapi', 'ipstack', 'ipgeolocation', 'ip2location'];
          if (!validProviders.includes(geolocation.api_provider)) {
            return res.status(400).json({ message: '无效的地理信息API提供商' });
          }
          
          if ((geolocation.api_provider === 'ipstack' || geolocation.api_provider === 'ipgeolocation' || geolocation.api_provider === 'ip2location') && 
              (!geolocation.api_key || geolocation.api_key.trim() === '')) {
            return res.status(400).json({ message: `${geolocation.api_provider} 需要API密钥` });
          }
          
          if (typeof geolocation.cache_duration !== 'number' || 
              geolocation.cache_duration < 3600 || 
              geolocation.cache_duration > 604800) {
            return res.status(400).json({ message: '缓存时间必须在1小时到7天之间' });
          }
        }
      }

      // 读取当前配置
      const currentConfig = readConfig();
      
      // 更新配置
      const updatedConfig = {
        ...currentConfig,
        website: {
          domain: website.domain.trim(),
          title: website.title.trim(),
          description: website.description.trim()
        },
        upload: {
          max_file_size: parseInt(upload.max_file_size),
          allowed_extensions: upload.allowed_extensions.filter((ext: string) => ext.trim()),
          max_files_per_app: parseInt(upload.max_files_per_app)
        }
      };

      // 更新下载配置（如果提供）
      if (download) {
        updatedConfig.download = {
          speed_limit_kbps: parseInt(download.speed_limit_kbps) || 0
        };
      }

      // 更新地理信息配置（如果提供）
      if (geolocation) {
        updatedConfig.geolocation = {
          enabled: geolocation.enabled,
          api_provider: geolocation.api_provider,
          api_key: geolocation.api_key ? geolocation.api_key.trim() : '',
          cache_duration: parseInt(geolocation.cache_duration) || 86400
        };
      }

      // 保存配置
      writeConfig(updatedConfig);
      
      res.json({ 
        message: '配置保存成功',
        config: {
          website: updatedConfig.website,
          upload: updatedConfig.upload,
          download: updatedConfig.download,
          geolocation: updatedConfig.geolocation
        }
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      res.status(500).json({ message: '保存配置失败' });
    }
  });

  return router;
} 