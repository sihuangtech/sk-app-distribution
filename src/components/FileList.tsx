// src/components/FileList.tsx
import React, { useState, useMemo } from 'react';
import { getApiBaseUrl } from '../utils/config';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import '../styles/App.css'; // 引入 App.css 以使用其中的样式

interface UploadedFile {
  name: string;
  path: string; // 文件的相对下载路径
  uploadTime: string; // 文件上传时间
  application: string; // 应用名称
  os: string; // 操作系统
  architecture: string; // 架构
  versionType: string; // 版本类型
}

interface FileListProps {
  files: UploadedFile[]; // 已上传文件列表数据
  onFileDeleted?: () => void; // 文件删除成功回调
}

function FileList({ files, onFileDeleted }: FileListProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  // 筛选状态
  const [filters, setFilters] = useState({
    application: '',
    os: '',
    architecture: '',
    versionType: ''
  });

  // 获取所有可用的筛选选项
  const filterOptions = useMemo(() => {
    const applications = [...new Set(files.map(file => file.application))].filter(app => app !== '未知');
    const operatingSystems = [...new Set(files.map(file => file.os))].filter(os => os !== '未知');
    const architectures = [...new Set(files.map(file => file.architecture))].filter(arch => arch !== '未知');
    const versionTypes = [...new Set(files.map(file => file.versionType))].filter(type => type !== '未知');

    return {
      applications,
      operatingSystems,
      architectures,
      versionTypes
    };
  }, [files]);

  // 操作系统显示标签映射
  const osLabels: { [key: string]: string } = {
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
    android: 'Android',
    ios: 'iOS',
    harmonyos: 'HarmonyOS'
  };

  // 架构显示标签映射
  const archLabels: { [key: string]: string } = {
    x64: 'x64 (64位)',
    x86: 'x86 (32位)',
    arm64: 'arm64',
    universal: 'Universal'
  };

  // 版本类型显示标签映射
  const versionLabels: { [key: string]: string } = {
    release: '正式版',
    test: '测试版'
  };

  // 获取显示标签的辅助函数
  const getOsLabel = (os: string) => osLabels[os] || os;
  const getArchLabel = (arch: string) => archLabels[arch] || arch;
  const getVersionLabel = (version: string) => versionLabels[version] || version;

  // 筛选后的文件列表
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      return (
        (filters.application === '' || file.application === filters.application) &&
        (filters.os === '' || file.os === filters.os) &&
        (filters.architecture === '' || file.architecture === filters.architecture) &&
        (filters.versionType === '' || file.versionType === filters.versionType)
      );
    });
  }, [files, filters]);

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

  const handleCopyDownloadLink = async (filePath: string, fileName: string) => {
    try {
      // 获取配置的域名
      const apiBaseUrl = await getApiBaseUrl();
      const configResponse = await fetch(`${apiBaseUrl}/api/config`);
      let domain = window.location.origin; // 默认使用当前域名
      
      if (configResponse.ok) {
        const config = await configResponse.json();
        if (config.website?.domain) {
          domain = config.website.domain;
        }
      }
      
      // 生成完整的下载链接
      const downloadUrl = `${domain}${filePath}`;
      
      // 复制到剪贴板
      await navigator.clipboard.writeText(downloadUrl);
      showToast(`下载链接已复制: ${fileName}`, 'success');
    } catch (error) {
      console.error('复制下载链接失败:', error);
      showToast('复制下载链接失败', 'error');
    }
  };

  const handleFileClick = async (filePath: string) => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const url = `${apiBaseUrl}${filePath}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('获取下载链接失败:', error);
      // 如果获取配置失败，直接使用相对路径
      window.open(filePath, '_blank');
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/list/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast('文件删除成功！', 'success');
        if (onFileDeleted) {
          onFileDeleted(); // 通知父组件刷新文件列表
        }
      } else {
        showToast(`删除失败: ${result.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('删除文件出错:', error);
      showToast('删除文件出错。', 'error');
    }
  };

  const confirmDeleteFile = (fileName: string, filePath: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '确认删除',
      message: `确定要删除文件 "${fileName}" 吗？此操作不可撤销。`,
      onConfirm: () => {
        handleDeleteFile(filePath);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 格式化上传时间
  const formatUploadTime = (uploadTime: string) => {
    const date = new Date(uploadTime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 清除所有筛选
  const clearFilters = () => {
    setFilters({
      application: '',
      os: '',
      architecture: '',
      versionType: ''
    });
  };

  return (
    <>
      <div className="file-list-section section-box">
        <h2>已上传文件</h2>
        
        {/* 筛选器 */}
        <div className="file-filters">
          <div className="filter-row">
            <div className="filter-col">
              <label>应用:</label>
              <select 
                value={filters.application} 
                onChange={(e) => setFilters(prev => ({ ...prev, application: e.target.value }))}
                title="选择应用进行筛选"
              >
                <option value="">全部应用</option>
                {filterOptions.applications.map(app => (
                  <option key={app} value={app}>{app}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-col">
              <label>操作系统:</label>
              <select 
                value={filters.os} 
                onChange={(e) => setFilters(prev => ({ ...prev, os: e.target.value }))}
                title="选择操作系统进行筛选"
              >
                <option value="">全部系统</option>
                {filterOptions.operatingSystems.map(os => (
                  <option key={os} value={os}>{getOsLabel(os)}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-col">
              <label>架构:</label>
              <select 
                value={filters.architecture} 
                onChange={(e) => setFilters(prev => ({ ...prev, architecture: e.target.value }))}
                title="选择架构进行筛选"
              >
                <option value="">全部架构</option>
                {filterOptions.architectures.map(arch => (
                  <option key={arch} value={arch}>{getArchLabel(arch)}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-col">
              <label>版本类型:</label>
              <select 
                value={filters.versionType} 
                onChange={(e) => setFilters(prev => ({ ...prev, versionType: e.target.value }))}
                title="选择版本类型进行筛选"
              >
                <option value="">全部版本</option>
                {filterOptions.versionTypes.map(type => (
                  <option key={type} value={type}>{getVersionLabel(type)}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-actions">
            <button onClick={clearFilters} className="clear-filters-button">
              清除筛选
            </button>
            <span className="filter-count">
              显示 {filteredFiles.length} / {files.length} 个文件
            </span>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <p>{files.length === 0 ? '暂无上传文件。' : '没有符合筛选条件的文件。'}</p>
        ) : (
          <ul className="file-list">
            {filteredFiles.map((file) => (
              <li key={file.path} className="file-item">
                <div className="file-info">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleFileClick(file.path);
                    }}
                    className="file-link"
                  >
                    {file.name}
                  </a>
                  <div className="file-metadata">
                    <span className="metadata-item">应用: {file.application}</span>
                    <span className="metadata-item">系统: {getOsLabel(file.os)}</span>
                    <span className="metadata-item">架构: {getArchLabel(file.architecture)}</span>
                    <span className="metadata-item">版本: {getVersionLabel(file.versionType)}</span>
                  </div>
                </div>
                <div className="file-actions">
                  <span className="upload-time">
                    {formatUploadTime(file.uploadTime)}
                  </span>
                  <button
                    className="copy-link-button"
                    onClick={() => handleCopyDownloadLink(file.path, file.name)}
                    title="复制下载链接"
                  >
                    复制链接
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => confirmDeleteFile(file.name, file.path)}
                    title="删除文件"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

export default FileList; 