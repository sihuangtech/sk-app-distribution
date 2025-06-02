import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

interface App {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  createdAt: string;
}

// 应用数据文件路径
const appsDataPath = path.join(process.cwd(), 'data', 'apps.json');

// 确保数据目录存在
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 读取应用列表
const readApps = (): App[] => {
  try {
    if (fs.existsSync(appsDataPath)) {
      const data = fs.readFileSync(appsDataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to read apps list:', error);
    return [];
  }
};

// 保存应用列表
const saveApps = (apps: App[]): void => {
  try {
    fs.writeFileSync(appsDataPath, JSON.stringify(apps, null, 2));
  } catch (error) {
    console.error('Failed to save apps list:', error);
  }
};

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default function appsRouter() {
  // 获取所有应用
  router.get('/', (req: Request, res: Response) => {
    try {
      const apps = readApps();
      res.json(apps);
    } catch (error) {
      console.error('Failed to get apps list:', error);
      res.status(500).json({ message: '获取应用列表失败' });
    }
  });

  // 创建新应用
  router.post('/', (req: Request, res: Response) => {
    try {
      const { name, displayName, description } = req.body;

      if (!name || !displayName) {
        return res.status(400).json({ message: '应用名称和显示名称不能为空' });
      }

      // 检查应用名称是否已存在
      const apps = readApps();
      const existingApp = apps.find(app => app.name === name);
      if (existingApp) {
        return res.status(400).json({ message: '应用名称已存在' });
      }

      // 创建新应用
      const newApp: App = {
        id: generateId(),
        name: name.trim(),
        displayName: displayName.trim(),
        description: description?.trim() || '',
        createdAt: new Date().toISOString()
      };

      apps.push(newApp);
      saveApps(apps);

      res.status(201).json({ 
        message: '应用创建成功', 
        app: newApp 
      });
    } catch (error) {
      console.error('Failed to create app:', error);
      res.status(500).json({ message: '创建应用失败' });
    }
  });

  // 编辑应用
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, displayName, description } = req.body;

      if (!name || !displayName) {
        return res.status(400).json({ message: '应用名称和显示名称不能为空' });
      }

      const apps = readApps();
      const appIndex = apps.findIndex(app => app.id === id);

      if (appIndex === -1) {
        return res.status(404).json({ message: '应用不存在' });
      }

      // 检查应用名称是否与其他应用冲突（排除当前应用）
      const existingApp = apps.find(app => app.name === name && app.id !== id);
      if (existingApp) {
        return res.status(400).json({ message: '应用名称已存在' });
      }

      // 更新应用信息
      apps[appIndex] = {
        ...apps[appIndex],
        name: name.trim(),
        displayName: displayName.trim(),
        description: description?.trim() || '',
      };

      saveApps(apps);

      res.json({ 
        message: '应用更新成功', 
        app: apps[appIndex] 
      });
    } catch (error) {
      console.error('Failed to update app:', error);
      res.status(500).json({ message: '更新应用失败' });
    }
  });

  // 删除应用
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const apps = readApps();
      const appIndex = apps.findIndex(app => app.id === id);

      if (appIndex === -1) {
        return res.status(404).json({ message: '应用不存在' });
      }

      apps.splice(appIndex, 1);
      saveApps(apps);

      res.json({ message: '应用删除成功' });
    } catch (error) {
      console.error('Failed to delete app:', error);
      res.status(500).json({ message: '删除应用失败' });
    }
  });

  return router;
} 