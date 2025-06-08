import fs from 'fs';
import path from 'path';
import type { Request } from 'express';
import { getLocationInfo } from './geolocation.ts';
import yaml from 'js-yaml';

// 下载统计数据结构
export interface DownloadRecord {
  filename: string;
  downloadCount: number;
  lastDownload: string;
  firstDownload: string;
}

// 下载历史记录（详细记录，可选择性保存）
export interface DownloadHistory {
  filename: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    countryCode?: string;
    regionCode?: string;
    timezone?: string;
    isp?: string;
  };
}

const downloadStatsPath = path.join(process.cwd(), 'data', 'download-stats.json');
const downloadHistoryPath = path.join(process.cwd(), 'data', 'download-history.json');

// 确保数据目录存在
const ensureDataDir = (): void => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// 读取下载统计数据
export const readDownloadStats = (): DownloadRecord[] => {
  try {
    if (fs.existsSync(downloadStatsPath)) {
      const data = fs.readFileSync(downloadStatsPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to read download stats:', error);
    return [];
  }
};

// 保存下载统计数据
export const saveDownloadStats = (stats: DownloadRecord[]): void => {
  try {
    ensureDataDir();
    fs.writeFileSync(downloadStatsPath, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Failed to save download stats:', error);
  }
};

// 读取下载历史记录
export const readDownloadHistory = (): DownloadHistory[] => {
  try {
    if (fs.existsSync(downloadHistoryPath)) {
      const data = fs.readFileSync(downloadHistoryPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to read download history:', error);
    return [];
  }
};

// 保存下载历史记录
export const saveDownloadHistory = (history: DownloadHistory[]): void => {
  try {
    ensureDataDir();
    fs.writeFileSync(downloadHistoryPath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to save download history:', error);
  }
};

// 获取真实客户端IP地址（支持代理）
const getRealClientIP = (req: Request): string => {
  // 按优先级检查各种可能包含真实IP的请求头
  const forwarded = req.get('X-Forwarded-For');
  if (forwarded) {
    // X-Forwarded-For 可能包含多个IP，第一个是客户端真实IP
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  const realIP = req.get('X-Real-IP');
  if (realIP) {
    return realIP;
  }
  
  const clientIP = req.get('X-Client-IP');
  if (clientIP) {
    return clientIP;
  }
  
  const forwardedFor = req.get('X-Forwarded');
  if (forwardedFor) {
    return forwardedFor;
  }
  
  // 如果都没有，回退到默认方式
  return req.ip || req.connection.remoteAddress || 'unknown';
};

// 读取配置文件
const readConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'config.yaml');
    const configFile = fs.readFileSync(configPath, 'utf8');
    return yaml.load(configFile) as any;
  } catch (error) {
    console.error('Failed to read config file:', error);
    return null;
  }
};

// 记录下载
export const recordDownload = async (filename: string, req: Request): Promise<void> => {
  const now = new Date().toISOString();
  const ip = getRealClientIP(req);
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // 更新统计数据
  const stats = readDownloadStats();
  let record = stats.find(r => r.filename === filename);
  
  if (record) {
    // 更新现有记录 - 只增加计数和更新最后下载时间
    record.downloadCount++;
    record.lastDownload = now;
  } else {
    // 创建新记录
    record = {
      filename,
      downloadCount: 1,
      lastDownload: now,
      firstDownload: now
    };
    stats.push(record);
  }
  
  saveDownloadStats(stats);
  
  // 查询地理信息
  const config = readConfig();
  let location = null;
  if (config?.geolocation) {
    try {
      location = await getLocationInfo(ip, config.geolocation);
    } catch (error) {
      console.error('Failed to get location info:', error);
    }
  }
  
  // 记录详细历史（可选，用于分析）
  const history = readDownloadHistory();
  history.push({
    filename,
    timestamp: now,
    ip,
    userAgent,
    location
  });
  
  // 保留最近1000次历史记录（用于分析，不影响统计计数）
  if (history.length > 1000) {
    const trimmedHistory = history.slice(-1000);
    saveDownloadHistory(trimmedHistory);
  } else {
    saveDownloadHistory(history);
  }
  
  console.log(`Download recorded: ${filename} (${record.downloadCount} times total)`);
};

// 获取文件的下载次数
export const getDownloadCount = (filename: string): number => {
  const stats = readDownloadStats();
  const record = stats.find(r => r.filename === filename);
  return record ? record.downloadCount : 0;
};

// 获取所有文件的下载统计
export const getAllDownloadStats = (): DownloadRecord[] => {
  return readDownloadStats();
};

// 获取下载排行榜
export const getDownloadRanking = (limit: number = 10): DownloadRecord[] => {
  const stats = readDownloadStats();
  return stats
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, limit);
}; 