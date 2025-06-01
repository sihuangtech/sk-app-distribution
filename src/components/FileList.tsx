// src/components/FileList.tsx
import React, { useState } from 'react';
import { getApiBaseUrl } from '../utils/config';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import '../styles/App.css'; // 引入 App.css 以使用其中的样式

interface UploadedFile {
  name: string;
  path: string; // 文件的相对下载路径
  uploadTime: string; // 文件上传时间
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

  return (
    <>
      <div className="file-list-section section-box">
        <h2>已上传文件</h2>
        {files.length === 0 ? (
          <p>暂无上传文件。</p>
        ) : (
          <ul className="file-list">
            {files.map((file) => (
              <li key={file.path} className="file-item">
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
                <div className="file-actions">
                  <span className="upload-time">
                    {formatUploadTime(file.uploadTime)}
                  </span>
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