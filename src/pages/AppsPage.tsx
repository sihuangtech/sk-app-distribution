import React from 'react';
import FileList from '../components/FileList';
import '../styles/AppsPage.css';

interface UploadedFile {
  name: string;
  path: string;
  uploadTime: string;
}

interface AppsPageProps {
  files: UploadedFile[];
  onFileDeleted?: () => void; // 文件删除回调
}

const AppsPage: React.FC<AppsPageProps> = ({ files, onFileDeleted }) => {
  return (
    <div className="apps-page">
      <div className="apps-page-container">
        <div className="apps-page-header">
          <h2>已上传应用</h2>
          <p>管理您已上传的应用程序文件</p>
          <div className="apps-stats">
            <span className="apps-count">共 {files.length} 个应用</span>
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