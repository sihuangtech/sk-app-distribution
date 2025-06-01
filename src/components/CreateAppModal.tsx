import React, { useState } from 'react';
import { getApiBaseUrl } from '../utils/config';
import Toast from './Toast';
import '../styles/CreateAppModal.css';

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppCreated: () => void;
}

interface App {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  createdAt: string;
}

const CreateAppModal: React.FC<CreateAppModalProps> = ({ isOpen, onClose, onAppCreated }) => {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/apps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          displayName: displayName.trim(),
          description: description.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('应用创建成功！', 'success');
        onAppCreated();
        handleClose();
      } else {
        setError(data.message || '创建应用失败');
      }
    } catch (error) {
      console.error('创建应用失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDisplayName('');
    setDescription('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>新建应用</h3>
            <button className="close-button" onClick={handleClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} className="create-app-form">
            <div className="form-group">
              <label htmlFor="name">应用名称 *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: my-app (用于内部标识，只能包含字母、数字、下划线和连字符)"
                required
                disabled={loading}
                pattern="^[a-zA-Z0-9_-]+$"
                title="只能包含字母、数字、下划线和连字符"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="displayName">显示名称 *</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如: 我的应用 (用户看到的名称)"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">应用描述</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述这个应用的功能..."
                disabled={loading}
                rows={3}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="modal-actions">
              <button type="button" onClick={handleClose} disabled={loading} className="cancel-button">
                取消
              </button>
              <button type="submit" disabled={loading || !name.trim() || !displayName.trim()} className="create-button">
                {loading ? '创建中...' : '创建应用'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};

export default CreateAppModal; 