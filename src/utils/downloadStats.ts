import fs from 'fs';
import path from 'path';
import type { Request } from 'express';

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

// 记录下载
export const recordDownload = (filename: string, req: Request): void => {
  const now = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
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
  
  // 记录详细历史（可选，用于分析）
  const history = readDownloadHistory();
  history.push({
    filename,
    timestamp: now,
    ip,
    userAgent
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