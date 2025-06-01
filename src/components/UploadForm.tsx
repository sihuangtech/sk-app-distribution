// src/components/UploadForm.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/config';
import CreateAppModal from './CreateAppModal';
import Toast from './Toast';
import '../styles/App.css'; // 引入 App.css 以使用其中的样式

interface UploadFormProps {
  onUploadSuccess: () => void; // 上传成功回调函数
  onAppCreated?: () => void; // 应用创建成功回调函数
}

interface App {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  createdAt: string;
}

function UploadForm({ onUploadSuccess, onAppCreated }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [application, setApplication] = useState<string>('');
  const [os, setOs] = useState<string>('');
  const [architecture, setArchitecture] = useState<string>('');
  const [versionType, setVersionType] = useState<string>('release');
  const [uploading, setUploading] = useState<boolean>(false);
  const [apps, setApps] = useState<App[]>([]);
  const [loadingApps, setLoadingApps] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // 定义所有可能的操作系统和对应的架构
  const availableArchitectures: { [key: string]: { value: string, label: string }[] } = {
    windows: [{ value: 'x64', label: 'x64' }, { value: 'arm64', label: 'arm64' }],
    macos: [{ value: 'x64', label: 'x64 (Intel Chip)' }, { value: 'arm64', label: 'arm64 (Apple Silicon)' }, { value: 'universal', label: 'Universal' }],
    linux: [{ value: 'x64', label: 'x64' }, { value: 'arm64', label: 'arm64' }],
    android: [{ value: 'arm64', label: 'arm64' }],
    ios: [{ value: 'arm64', label: 'arm64' }],
    harmonyos: [{ value: 'arm64', label: 'arm64' }],
    '': [{ value: 'x64', label: 'x64' }, { value: 'arm64', label: 'arm64' }],
  };

  // 根据选择的操作系统计算可用的架构选项
  const filteredArchitectures = useMemo(() => {
    if (os && availableArchitectures[os] && !availableArchitectures[os].some(arch => arch.value === architecture)) {
        setArchitecture('');
    }
    return availableArchitectures[os] || availableArchitectures[''];
  }, [os, architecture]);

  // 获取应用列表
  const fetchApps = async () => {
    try {
      setLoadingApps(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/apps`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const appsData = await response.json();
        setApps(appsData);
      } else {
        console.error('获取应用列表失败:', response.statusText);
      }
    } catch (error) {
      console.error('获取应用列表出错:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  // 组件加载时获取应用列表
  useEffect(() => {
    fetchApps();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setDownloadLink(''); // 选择新文件时清空下载链接
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('请选择要上传的文件。', 'error');
      return;
    }
    if (!application || !os || !architecture || !versionType) {
      showToast('请选择应用、操作系统、架构和版本类型。', 'error');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('package', selectedFile);
    formData.append('application', application);
    formData.append('os', os);
    formData.append('architecture', architecture);
    formData.append('versionType', versionType);

    // 获取存储的token
    const token = localStorage.getItem('token');

    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDownloadLink(result.downloadUrl);
        showToast(result.message, 'success');
        onUploadSuccess(); // 调用上传成功回调
        
        // 重置表单
        setSelectedFile(null);
        setApplication('');
        setOs('');
        setArchitecture('');
        setVersionType('release');
        
        // 重置文件输入
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        const errorData = await response.json();
        showToast(`文件上传失败: ${errorData.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('上传出错:', error);
      showToast('上传出错。', 'error');
    } finally {
      setUploading(false);
    }
  };

  const getDownloadUrl = async () => {
    if (!downloadLink) return '';
    try {
      const apiBaseUrl = await getApiBaseUrl();
      return `${apiBaseUrl}${downloadLink}`;
    } catch (error) {
      console.error('获取下载链接失败:', error);
      return downloadLink;
    }
  };

  const handleAppCreated = () => {
    fetchApps(); // 重新获取应用列表
    if (onAppCreated) {
      onAppCreated(); // 通知父组件应用已创建
    }
  };

  return (
    <>
      <div className="upload-form-section section-box">
        <h2>上传新文件</h2>
        
        <div>
          <label htmlFor="application">应用:</label>
          <div className="app-selector-container">
            <select 
              id="application" 
              value={application} 
              onChange={(e) => setApplication(e.target.value)} 
              disabled={uploading || loadingApps}
            >
              <option value="">请选择应用</option>
              {apps.map((app) => (
                <option key={app.id} value={app.name}>
                  {app.displayName}
                </option>
              ))}
            </select>
            <button 
              type="button"
              onClick={() => setShowCreateModal(true)}
              disabled={uploading}
              className="create-app-button"
            >
              新建应用
            </button>
          </div>
          {loadingApps && <small className="loading-text">加载应用列表中...</small>}
        </div>
        
        {/* 操作系统、架构和版本类型在同一行 */}
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="os">操作系统:</label>
            <select id="os" value={os} onChange={(e) => setOs(e.target.value)} disabled={uploading}>
              <option value="">请选择</option>
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="linux">Linux</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="harmonyos">HarmonyOS</option>
            </select>
          </div>
          
          <div className="form-col">
            <label htmlFor="architecture">架构:</label>
            <select id="architecture" value={architecture} onChange={(e) => setArchitecture(e.target.value)} disabled={uploading}>
              <option value="">请选择</option>
              {filteredArchitectures.map((arch) => (
                <option key={arch.value} value={arch.value}>{arch.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-col">
            <label>版本类型:</label>
            <div className="radio-group-inline">
              <label className="radio-label">
                <input
                  type="radio"
                  name="versionType"
                  value="release"
                  checked={versionType === 'release'}
                  onChange={(e) => setVersionType(e.target.value)}
                  disabled={uploading}
                />
                正式版
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="versionType"
                  value="test"
                  checked={versionType === 'test'}
                  onChange={(e) => setVersionType(e.target.value)}
                  disabled={uploading}
                />
                测试版
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="file-input">选择文件:</label>
          <input 
            type="file" 
            id="file-input"
            onChange={handleFileChange} 
            disabled={uploading} 
          />
        </div>
        
        <button onClick={handleUpload} disabled={uploading || !selectedFile}>
          {uploading ? '上传中...' : '上传'}
        </button>
        
        {downloadLink && (
          <div className="download-link-container">
            <p>下载链接:</p>
            <a href={downloadLink} target="_blank" rel="noopener noreferrer" onClick={async (e) => {
              e.preventDefault();
              const url = await getDownloadUrl();
              window.open(url, '_blank');
            }}>
              {downloadLink}
            </a>
          </div>
        )}

        <CreateAppModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onAppCreated={handleAppCreated}
        />
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

export default UploadForm; 