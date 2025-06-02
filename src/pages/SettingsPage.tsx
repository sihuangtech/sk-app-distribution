import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/config';
import { updatePageTitle } from '../utils/pageTitle';
import { eventBus } from '../utils/eventBus';
import Toast from '../components/Toast';
import '../styles/SettingsPage.css';

interface WebsiteConfig {
  domain: string;
  title: string;
  description: string;
}

interface UploadConfig {
  max_file_size: number;
  allowed_extensions: string[];
  max_files_per_app: number;
}

// 新增下载配置接口
interface DownloadConfig {
  speed_limit_kbps: number; // 下载速度限制，单位：MB/s
}

interface SystemConfig {
  website: WebsiteConfig;
  upload: UploadConfig;
  download?: DownloadConfig; // 添加 download 配置，注意是可选的，以兼容旧配置
}

// 预设的下载速度选项 (MB/s)
const predefinedDownloadSpeeds = [
  { value: 0, label: '不限制' },
  { value: 1, label: '1 MB/s' },
  { value: 5, label: '5 MB/s' },
  { value: 10, label: '10 MB/s' },
  { value: 20, label: '20 MB/s' },
  { value: 50, label: '50 MB/s' },
  { value: 100, label: '100 MB/s' },
];

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // 初始化 editConfig 时，确保 download 属性存在并有默认值
  const [editConfig, setEditConfig] = useState<SystemConfig | null>(null);
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

  // 获取系统配置
  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const configData: SystemConfig = await response.json();
        // 确保 download 属性存在并有默认值
        const initializedConfig = {
          ...configData,
          download: configData.download || { speed_limit_kbps: 0 }
        };
        setConfig(initializedConfig);
        setEditConfig(initializedConfig);
      } else {
        showToast('获取配置失败', 'error');
      }
    } catch (error) {
      console.error('获取配置失败:', error);
      showToast('获取配置失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    if (!editConfig) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // 发送 editConfig，其中已包含 download 属性
        body: JSON.stringify(editConfig),
      });

      if (response.ok) {
        // 更新 config 状态，确保 download 属性存在
        setConfig({
          ...editConfig,
          download: editConfig.download || { speed_limit_kbps: 0 }
        });
        setEditMode(false);
        showToast('配置保存成功', 'success');
        await updatePageTitle();
        eventBus.emit('configUpdated', editConfig);
      } else {
        showToast('配置保存失败', 'error');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      showToast('保存配置失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    // 恢复 config 状态，确保 download 属性存在
    if (config) {
      setEditConfig({
        ...config,
        download: config.download || { speed_limit_kbps: 0 }
      });
    }
    setEditMode(false);
  };

  // 添加文件扩展名
  const addExtension = () => {
    if (!editConfig) return;
    setEditConfig({
      ...editConfig,
      upload: {
        ...editConfig.upload,
        allowed_extensions: [...editConfig.upload.allowed_extensions, '']
      }
    });
  };

  // 删除文件扩展名
  const removeExtension = (index: number) => {
    if (!editConfig) return;
    const newExtensions = editConfig.upload.allowed_extensions.filter((_, i) => i !== index);
    setEditConfig({
      ...editConfig,
      upload: {
        ...editConfig.upload,
        allowed_extensions: newExtensions
      }
    });
  };

  // 更新文件扩展名
  const updateExtension = (index: number, value: string) => {
    if (!editConfig) return;
    const newExtensions = [...editConfig.upload.allowed_extensions];
    newExtensions[index] = value;
    setEditConfig({
      ...editConfig,
      upload: {
        ...editConfig.upload,
        allowed_extensions: newExtensions
      }
    });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-container">
          <div className="loading-spinner">加载配置中...</div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="settings-page">
        <div className="error-container">
          <p>无法加载配置信息</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="settings-page">
        <div className="settings-container">
          <div className="settings-header">
            <h2>系统设置</h2>
            <p>管理网站配置和上传限制</p>
            <div className="settings-actions">
              {!editMode ? (
                <button 
                  className="edit-button"
                  onClick={() => setEditMode(true)}
                >
                  编辑配置
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="save-button"
                    onClick={saveConfig}
                    disabled={saving}
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="settings-content">
            {/* 网站配置 */}
            <div className="settings-section">
              <h3>网站配置</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>网站域名:</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editConfig?.website.domain || ''}
                      onChange={(e) => setEditConfig(prev => prev ? {
                        ...prev,
                        website: { ...prev.website, domain: e.target.value }
                      } : null)}
                      placeholder="https://your-domain.com"
                      title="设置网站域名"
                    />
                  ) : (
                    <span className="setting-value">{config.website.domain}</span>
                  )}
                </div>

                <div className="setting-item">
                  <label>网站标题:</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editConfig?.website.title || ''}
                      onChange={(e) => setEditConfig(prev => prev ? {
                        ...prev,
                        website: { ...prev.website, title: e.target.value }
                      } : null)}
                      placeholder="彩旗软件分发平台"
                      title="设置网站标题"
                    />
                  ) : (
                    <span className="setting-value">{config.website.title}</span>
                  )}
                </div>

                <div className="setting-item">
                  <label>网站描述:</label>
                  {editMode ? (
                    <textarea
                      value={editConfig?.website.description || ''}
                      onChange={(e) => setEditConfig(prev => prev ? {
                        ...prev,
                        website: { ...prev.website, description: e.target.value }
                      } : null)}
                      placeholder="为开发者提供便捷的应用包上传、管理和分发服务"
                      title="设置网站描述"
                    />
                  ) : (
                    <span className="setting-value">{config.website.description}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 上传限制 */}
            <div className="settings-section">
              <h3>上传限制</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>最大文件大小 (MB):</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editConfig?.upload.max_file_size ?? ''}
                      onChange={(e) => setEditConfig(prev => prev ? {
                        ...prev,
                        upload: { ...prev.upload, max_file_size: parseInt(e.target.value) || 0 }
                      } : null)}
                      min="0"
                      title="设置最大文件大小限制 (MB)"
                    />
                  ) : (
                    <span className="setting-value">{config.upload.max_file_size} MB</span>
                  )}
                </div>

                <div className="setting-item full-width">
                  <label>允许的文件扩展名:</label>
                  {editMode ? (
                    <div className="extensions-list">
                      {editConfig?.upload.allowed_extensions.map((ext, index) => (
                        <div key={index} className="extension-input-group">
                          <input
                            type="text"
                            value={ext}
                            onChange={(e) => updateExtension(index, e.target.value)}
                            title="文件扩展名"
                          />
                          <button 
                            type="button"
                            className="remove-extension-button delete-button"
                            onClick={() => removeExtension(index)}
                          >
                            删除
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        className="add-extension-button"
                        onClick={addExtension}
                      >
                        添加扩展名
                      </button>
                    </div>
                  ) : (
                    <span className="setting-value">{config.upload.allowed_extensions.join(', ')}</span>
                  )}
                </div>
                
                <div className="setting-item">
                  <label>每应用最大文件数:</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editConfig?.upload.max_files_per_app ?? ''}
                      onChange={(e) => setEditConfig(prev => prev ? {
                        ...prev,
                        upload: { ...prev.upload, max_files_per_app: parseInt(e.target.value) || 0 }
                      } : null)}
                      min="0"
                      title="设置每应用最大文件数"
                    />
                  ) : (
                    <span className="setting-value">{config.upload.max_files_per_app}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* 下载限制 - 新增部分 */}
            <div className="settings-section">
              <h3>下载限制</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>下载速度限制 (MB/s):</label>
                  {editMode ? (
                    <div className="download-speed-input-group">
                      <select
                        value={predefinedDownloadSpeeds.some(speed => speed.value === editConfig?.download?.speed_limit_kbps) ? editConfig?.download?.speed_limit_kbps : 'custom'}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditConfig(prev => prev ? {
                            ...prev,
                            download: {
                              ...(prev.download || { speed_limit_kbps: 0 }),
                              speed_limit_kbps: value === 'custom' ? (prev.download?.speed_limit_kbps || 0) : parseInt(value)
                            }
                          } : null);
                        }}
                        title="选择预设下载速度或自定义"
                      >
                        {predefinedDownloadSpeeds.map(speed => (
                          <option key={speed.value} value={speed.value}>{speed.label}</option>
                        ))}
                        <option value="custom">自定义</option>
                      </select>
                      <input
                        type="number"
                        value={editConfig?.download?.speed_limit_kbps ?? ''}
                        onChange={(e) => setEditConfig(prev => prev ? {
                          ...prev,
                          download: { 
                            ...(prev.download || { speed_limit_kbps: 0 }),
                            speed_limit_kbps: parseInt(e.target.value) || 0 
                          }
                        } : null)}
                        min="0"
                        placeholder="0"
                        title="输入自定义下载速度 (MB/s)"
                        disabled={predefinedDownloadSpeeds.some(speed => speed.value === editConfig?.download?.speed_limit_kbps && editConfig?.download?.speed_limit_kbps !== 0)}
                      />
                      <span className="input-hint">(0 表示不限制)</span>
                    </div>
                  ) : (
                    <span className="setting-value">
                      {config.download?.speed_limit_kbps === 0 ? '不限制' : `${config.download?.speed_limit_kbps} MB/s`}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
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

export default SettingsPage; 