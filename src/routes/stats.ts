import express from 'express';
import type { Request, Response } from 'express';
import { getAllDownloadStats, getDownloadRanking, readDownloadHistory } from '../utils/downloadStats.ts';
import fs from 'fs';
import path from 'path';

// 读取文件元数据
const readFileMetadata = () => {
  try {
    const metadataPath = path.join(process.cwd(), 'data', 'file-metadata.json');
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to read file metadata:', error);
    return [];
  }
};

const statsRouter = () => {
  const router = express.Router();

  // 获取所有下载统计
  router.get('/downloads', (req: Request, res: Response) => {
    try {
      const stats = getAllDownloadStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to get download stats:', error);
      res.status(500).json({ message: '获取下载统计失败' });
    }
  });

  // 获取下载排行榜
  router.get('/downloads/ranking', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const ranking = getDownloadRanking(limit);
      res.json(ranking);
    } catch (error) {
      console.error('Failed to get download ranking:', error);
      res.status(500).json({ message: '获取下载排行榜失败' });
    }
  });

  // 获取下载历史记录
  router.get('/downloads/history', (req: Request, res: Response) => {
    try {
      const history = readDownloadHistory();
      const metadata = readFileMetadata();
      
      // 筛选条件
      const fileType = req.query.fileType as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // 应用筛选
      let filteredHistory = history;
      
      // 按文件类型筛选（基于应用、操作系统、架构）
      if (fileType && fileType !== 'all') {
        filteredHistory = filteredHistory.filter(record => {
          // 查找对应的文件元数据
          const fileMetadata = metadata.find((meta: any) => meta.originalName === record.filename);
          if (fileMetadata) {
            // 构建文件类型标识：应用-操作系统-架构
            const fileTypeId = `${fileMetadata.application}-${fileMetadata.os}-${fileMetadata.architecture}`;
            return fileTypeId === fileType;
          }
          return false;
        });
      }
      
      // 按日期区间筛选
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filteredHistory = filteredHistory.filter(record => 
          new Date(record.timestamp) >= start
        );
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredHistory = filteredHistory.filter(record => 
          new Date(record.timestamp) <= end
        );
      }
      
      // 按时间倒序排列
      const sortedHistory = filteredHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // 支持分页
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedHistory = sortedHistory.slice(startIndex, endIndex);
      
      // 获取所有可用的文件类型（直接基于元数据，不依赖下载历史匹配）
      const allFileTypes = [...new Set(metadata.map((meta: any) => {
        return `${meta.application}-${meta.os}-${meta.architecture}`;
      }))].sort();
      
      res.json({
        history: paginatedHistory,
        total: sortedHistory.length,
        page,
        limit,
        totalPages: Math.ceil(sortedHistory.length / limit),
        availableFileTypes: allFileTypes,
        filters: {
          fileType: fileType || 'all',
          startDate: startDate || '',
          endDate: endDate || ''
        }
      });
    } catch (error) {
      console.error('Failed to get download history:', error);
      res.status(500).json({ message: '获取下载历史失败' });
    }
  });

  // 获取统计概览
  router.get('/overview', (req: Request, res: Response) => {
    try {
      const stats = getAllDownloadStats();
      const history = readDownloadHistory();
      
      // 计算总下载次数
      const totalDownloads = stats.reduce((sum, stat) => sum + stat.downloadCount, 0);
      
      // 计算今日下载次数
      const today = new Date().toISOString().split('T')[0];
      const todayDownloads = history.filter(record => 
        record.timestamp.startsWith(today)
      ).length;
      
      // 计算本周下载次数
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekDownloads = history.filter(record => 
        new Date(record.timestamp) >= weekAgo
      ).length;
      
      // 计算本月下载次数
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthDownloads = history.filter(record => 
        new Date(record.timestamp) >= monthAgo
      ).length;
      
      res.json({
        totalFiles: stats.length,
        totalDownloads,
        todayDownloads,
        weekDownloads,
        monthDownloads,
        topFiles: getDownloadRanking(5)
      });
    } catch (error) {
      console.error('Failed to get stats overview:', error);
      res.status(500).json({ message: '获取统计概览失败' });
    }
  });

  return router;
};

export default statsRouter; 