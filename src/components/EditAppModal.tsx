import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/config';
import Toast from './Toast';
import '../styles/CreateAppModal.css'; // 复用相同的样式

interface EditAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppUpdated: () => void;
  app: {
    id: string;
    name: string;
    displayName: string;
    description?: string;
  } | null;
}

const EditAppModal: React.FC<EditAppModalProps> = ({ isOpen, onClose, onAppUpdated, app }) => {
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

  // 当应用数据变化时更新表单
  useEffect(() => {
    if (app) {
      setName(app.name);
      setDisplayName(app.displayName);
      setDescription(app.description || '');
    }
  }, [app]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      console.log('编辑应用请求:', {
        url: `${apiBaseUrl}/api/apps/${app.id}`,
        token: token ? '存在' : '不存在',
        appId: app.id
      });
      
      const response = await fetch(`${apiBaseUrl}/api/apps/${app.id}`, {
        method: 'PUT',
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

      console.log('响应状态:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        showToast('应用更新成功！', 'success');
        onAppUpdated();
        handleClose();
      } else {
        // 尝试解析错误响应
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          setError(errorData.message || '更新应用失败');
        } else {
          // 如果不是JSON响应，可能是HTML错误页面
          const errorText = await response.text();
          console.error('非JSON响应:', errorText);
          setError(`服务器错误 (${response.status}): 请检查后端服务是否正常运行`);
        }
      }
    } catch (error) {
      console.error('更新应用失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen || !app) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>编辑应用</h3>
            <button className="close-button" onClick={handleClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} className="create-app-form">
            <div className="form-group">
              <label htmlFor="edit-name">应用名称 *</label>
              <input
                type="text"
                id="edit-name"
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
              <label htmlFor="edit-displayName">显示名称 *</label>
              <input
                type="text"
                id="edit-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如: 我的应用 (用户看到的名称)"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-description">应用描述</label>
              <textarea
                id="edit-description"
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
                {loading ? '更新中...' : '更新应用'}
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

export default EditAppModal; 