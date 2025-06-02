import React from 'react';
import FileList from '../components/FileList';
import '../styles/AppsPage.css';

interface UploadedFile {
  name: string;
  path: string;
  uploadTime: string;
  application: string; // 应用名称
  os: string; // 操作系统
  architecture: string; // 架构
  versionType: string; // 版本类型
  size: number; // 文件大小（字节）
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
}

interface AppsPageProps {
  files: UploadedFile[];
  fileStats: FileStats;
  onFileDeleted?: () => void; // 文件删除回调
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AppsPage: React.FC<AppsPageProps> = ({ files, fileStats, onFileDeleted }) => {
  return (
    <div className="apps-page">
      <div className="apps-page-container">
        <div className="apps-page-header">
          <h2>已上传应用</h2>
          <p>管理您已上传的应用程序文件</p>
          <div className="apps-stats">
            <span className="apps-count">共 {fileStats.totalFiles} 个文件</span>
            <span className="apps-size">总大小 {formatFileSize(fileStats.totalSize)}</span>
          </div>
        </div>
        
        <div className="apps-page-content">
          <FileList files={files} onFileDeleted={onFileDeleted} />
        </div>
      </div>
    </div>
  );
};

export default AppsPage; 