import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/config';
import EditAppModal from './EditAppModal';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import '../styles/AppsList.css';

interface App {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  createdAt: string;
}

interface AppsListProps {
  onAppDeleted?: () => void;
}

const AppsList: React.FC<AppsListProps> = ({ onAppDeleted }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    appId: string;
    appName: string;
  }>({
    isOpen: false,
    appId: '',
    appName: ''
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

  // 获取应用列表
  const fetchApps = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  // 编辑应用
  const handleEditApp = (app: App) => {
    setEditingApp(app);
    setShowEditModal(true);
  };

  // 显示删除确认对话框
  const showDeleteConfirm = (appId: string, appName: string) => {
    setConfirmDialog({
      isOpen: true,
      appId,
      appName
    });
  };

  // 隐藏删除确认对话框
  const hideDeleteConfirm = () => {
    setConfirmDialog({
      isOpen: false,
      appId: '',
      appName: ''
    });
  };

  // 确认删除应用
  const confirmDeleteApp = async () => {
    const { appId, appName } = confirmDialog;
    hideDeleteConfirm();

    try {
      setDeletingId(appId);
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/apps/${appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showToast('应用删除成功！', 'success');
        fetchApps(); // 重新获取应用列表
        onAppDeleted?.(); // 通知父组件
      } else {
        const errorData = await response.json();
        showToast(`删除失败: ${errorData.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('删除应用失败:', error);
      showToast('删除失败，请稍后重试', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // 应用更新成功回调
  const handleAppUpdated = () => {
    fetchApps(); // 重新获取应用列表
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 组件加载时获取应用列表
  useEffect(() => {
    fetchApps();
  }, []);

  return (
    <>
      <div className="apps-list-section section-box">
        <div className="apps-list-header">
          <h2>已建应用</h2>
        </div>
        
        {loading ? (
          <div className="loading-message">加载应用列表中...</div>
        ) : apps.length === 0 ? (
          <div className="empty-message">
            <p>暂无应用</p>
            <small>点击右侧"新建应用"按钮创建第一个应用</small>
          </div>
        ) : (
          <div className="apps-grid">
            {apps.map((app) => (
              <div key={app.id} className="app-card">
                <div className="app-card-header">
                  <h3 className="app-display-name">{app.displayName}</h3>
                  <div className="app-actions">
                    <button
                      onClick={() => handleEditApp(app)}
                      className="edit-button"
                      title="编辑应用"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => showDeleteConfirm(app.id, app.displayName)}
                      disabled={deletingId === app.id}
                      className="delete-button"
                      title="删除应用"
                    >
                      {deletingId === app.id ? '删除中...' : '×'}
                    </button>
                  </div>
                </div>
                
                <div className="app-card-body">
                  <p className="app-name">
                    <strong>应用名称:</strong> {app.name}
                  </p>
                  
                  {app.description && (
                    <p className="app-description">
                      <strong>描述:</strong> {app.description}
                    </p>
                  )}
                  
                  <p className="app-created-at">
                    <strong>创建时间:</strong> {formatDate(app.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <EditAppModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onAppUpdated={handleAppUpdated}
          app={editingApp}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="删除应用"
        message={`确定要删除应用"${confirmDialog.appName}"吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
        onConfirm={confirmDeleteApp}
        onCancel={hideDeleteConfirm}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};

export default AppsList; 