import React, { useState, useRef } from 'react';
import UploadForm from '../components/UploadForm';
import AppsList from '../components/AppsList';
import '../styles/UploadPage.css';

interface UploadPageProps {
  onUploadSuccess: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onUploadSuccess }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const appsListRef = useRef<{ refreshApps: () => void }>(null);

  // 应用创建成功后的回调
  const handleAppCreated = () => {
    // 触发应用列表刷新
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="upload-page">
      <div className="upload-page-container">
        {/* 左侧：应用列表 */}
        <div className="apps-section">
          <AppsList key={refreshTrigger} />
        </div>
        
        {/* 右侧：上传表单 */}
        <div className="upload-section">
          <UploadForm 
            onUploadSuccess={onUploadSuccess} 
            onAppCreated={handleAppCreated}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadPage; 