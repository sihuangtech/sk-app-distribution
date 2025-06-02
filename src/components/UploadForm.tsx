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
  const [os, setOs] = useState<string>('windows');
  const [architecture, setArchitecture] = useState<string>('x64');
  const [versionType, setVersionType] = useState<string>('release');
  const [uploading, setUploading] = useState<boolean>(false);
  const [apps, setApps] = useState<App[]>([]);
  const [loadingApps, setLoadingApps] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [uploadConfig, setUploadConfig] = useState<{
    max_file_size: number;
    allowed_extensions: string[];
  } | null>(null);
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
    windows: [
      { value: 'x64', label: 'x64 (64位)' }, 
      { value: 'x86', label: 'x86 (32位)' }, 
      { value: 'arm64', label: 'arm64' }
    ],
    macos: [
      { value: 'arm64', label: 'arm64 (Apple Silicon)' }, 
      { value: 'x64', label: 'x64 (Intel Chip)' }, 
      { value: 'universal', label: 'Universal' }
    ],
    linux: [
      { value: 'x64', label: 'x64 (64位)' }, 
      { value: 'x86', label: 'x86 (32位)' }, 
      { value: 'arm64', label: 'arm64' }
    ],
    android: [{ value: 'arm64', label: 'arm64' }],
    ios: [{ value: 'arm64', label: 'arm64' }],
    harmonyos: [{ value: 'arm64', label: 'arm64' }],
    '': [{ value: 'x64', label: 'x64' }, { value: 'arm64', label: 'arm64' }],
  };

  // 定义每个操作系统的默认架构
  const defaultArchitectures: { [key: string]: string } = {
    windows: 'x64',
    macos: 'arm64',
    linux: 'x64',
    android: 'arm64',
    ios: 'arm64',
    harmonyos: 'arm64'
  };

  // 根据选择的操作系统计算可用的架构选项
  const filteredArchitectures = useMemo(() => {
    return availableArchitectures[os] || availableArchitectures[''];
  }, [os]);

  // 当操作系统改变时，自动设置默认架构
  useEffect(() => {
    if (os && defaultArchitectures[os]) {
      setArchitecture(defaultArchitectures[os]);
    } else if (os && availableArchitectures[os] && availableArchitectures[os].length > 0) {
      setArchitecture(availableArchitectures[os][0].value);
    }
  }, [os]);

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

  // 获取上传配置
  const fetchUploadConfig = async () => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/config`);
      
      if (response.ok) {
        const config = await response.json();
        if (config.upload) {
          setUploadConfig(config.upload);
        }
      }
    } catch (error) {
      console.error('获取上传配置失败:', error);
    }
  };

  // 组件加载时获取应用列表和上传配置
  useEffect(() => {
    fetchApps();
    fetchUploadConfig();
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
        setOs('windows');
        setArchitecture('x64');
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
          {uploadConfig && (
            <div className="upload-limits">
              <div className="limit-info">
                <span className="limit-label">文件大小限制:</span>
                <span className="limit-value">最大 {uploadConfig.max_file_size} MB (约 {(uploadConfig.max_file_size / 1024).toFixed(1)} GB)</span>
              </div>
              <div className="limit-info">
                <span className="limit-label">支持格式:</span>
                <span className="limit-value">{uploadConfig.allowed_extensions.join(', ')}</span>
              </div>
            </div>
          )}
          {selectedFile && (
            <div className="selected-file-info">
              <span className="file-name">已选择: {selectedFile.name}</span>
              <span className="file-size">大小: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
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