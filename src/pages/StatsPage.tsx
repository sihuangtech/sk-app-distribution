import React, { useState, useEffect, useMemo } from 'react';
import { getApiBaseUrl } from '../utils/config';
import { updatePageTitle } from '../utils/pageTitle';
import { parseBrowserInfo } from '../utils/userAgentParser';
import Toast from '../components/Toast';
import '../styles/StatsPage.css';

interface DownloadRecord {
  filename: string;
  downloadCount: number;
  lastDownload: string;
  firstDownload: string;
}

interface DownloadHistory {
  filename: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    countryCode?: string;
    regionCode?: string;
    timezone?: string;
    isp?: string;
  };
}

interface StatsOverview {
  totalFiles: number;
  totalDownloads: number;
  todayDownloads: number;
  weekDownloads: number;
  monthDownloads: number;
  topFiles: DownloadRecord[];
}

interface HistoryResponse {
  history: DownloadHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  availableFileTypes: string[];
  filters: {
    fileType: string;
    startDate: string;
    endDate: string;
  };
}

const StatsPage: React.FC = () => {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [allStats, setAllStats] = useState<DownloadRecord[]>([]);
  const [history, setHistory] = useState<DownloadHistory[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);
  const [historyFilters, setHistoryFilters] = useState({
    fileType: 'all',
    application: 'all',
    operatingSystem: 'all', 
    architecture: 'all',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'history'>('overview');
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

  // 获取统计概览
  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      } else {
        showToast('获取统计概览失败', 'error');
      }
    } catch (error) {
      console.error('获取统计概览失败:', error);
      showToast('获取统计概览失败', 'error');
    }
  };

  // 获取所有文件统计
  const fetchAllStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/stats/downloads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 按下载次数排序
        const sortedData = data.sort((a: DownloadRecord, b: DownloadRecord) => b.downloadCount - a.downloadCount);
        setAllStats(sortedData);
      } else {
        showToast('获取文件统计失败', 'error');
      }
    } catch (error) {
      console.error('获取文件统计失败:', error);
      showToast('获取文件统计失败', 'error');
    }
  };

  // 获取下载历史
  const fetchHistory = async (page: number = 1, filters?: typeof historyFilters, customLimit?: number) => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      
      const currentFilters = filters || historyFilters;
      const currentLimit = customLimit || historyPagination.limit;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: currentLimit.toString()
      });
      
      // 构建fileType参数：如果选择了具体的应用、操作系统、架构，则组合成fileType
      if (currentFilters.application !== 'all' || currentFilters.operatingSystem !== 'all' || currentFilters.architecture !== 'all') {
        const app = currentFilters.application !== 'all' ? currentFilters.application : '*';
        const os = currentFilters.operatingSystem !== 'all' ? currentFilters.operatingSystem : '*';
        const arch = currentFilters.architecture !== 'all' ? currentFilters.architecture : '*';
        
        // 如果都选择了具体值，则传递完整的组合
        if (app !== '*' && os !== '*' && arch !== '*') {
          params.append('fileType', `${app}-${os}-${arch}`);
        }
        // 否则在前端进行筛选
      }
      
      if (currentFilters.startDate) {
        params.append('startDate', currentFilters.startDate);
      }
      if (currentFilters.endDate) {
        params.append('endDate', currentFilters.endDate);
      }
      
      const response = await fetch(`${apiBaseUrl}/api/stats/downloads/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: HistoryResponse = await response.json();
        
        let filteredHistory = data.history;
        
        // 前端筛选：如果有部分筛选条件
        if (currentFilters.application !== 'all' || currentFilters.operatingSystem !== 'all' || currentFilters.architecture !== 'all') {
          filteredHistory = filteredHistory.filter(record => {
            // 查找对应的文件元数据
            const fileType = availableFileTypes.find(type => {
              const parts = type.split('-');
              return parts.length === 3 && 
                     parts.join('-') === type && 
                     availableFileTypes.some(t => t.includes(record.filename.split('.')[0]));
            });
            
            if (fileType) {
              const [app, os, arch] = fileType.split('-');
              return (currentFilters.application === 'all' || app === currentFilters.application) &&
                     (currentFilters.operatingSystem === 'all' || os === currentFilters.operatingSystem) &&
                     (currentFilters.architecture === 'all' || arch === currentFilters.architecture);
            }
            return false;
          });
        }
        
        setHistory(filteredHistory);
        setHistoryPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages
        });
        setAvailableFileTypes(data.availableFileTypes);
        if (filters) {
          setHistoryFilters({
            fileType: data.filters.fileType || 'all',
            application: currentFilters.application,
            operatingSystem: currentFilters.operatingSystem,
            architecture: currentFilters.architecture,
            startDate: data.filters.startDate || '',
            endDate: data.filters.endDate || ''
          });
        }
      } else {
        showToast('获取下载历史失败', 'error');
      }
    } catch (error) {
      console.error('获取下载历史失败:', error);
      showToast('获取下载历史失败', 'error');
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // 格式化相对时间
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}天前`;
    } else if (diffHours > 0) {
      return `${diffHours}小时前`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分钟前`;
    } else {
      return '刚刚';
    }
  };



  // 格式化地理信息
  const formatLocation = (location?: DownloadHistory['location']) => {
    if (!location) return '未知';
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    
    return parts.length > 0 ? parts.join(', ') : '未知';
  };

  // 从可用文件类型中提取独立的选项
  const filterOptions = useMemo(() => {
    const applications = new Set<string>();
    const operatingSystems = new Set<string>();
    const architectures = new Set<string>();
    
    availableFileTypes.forEach(type => {
      const parts = type.split('-');
      
      // 改进分割逻辑：最后两个部分是操作系统和架构，其余部分组合成应用名称
      if (parts.length >= 3) {
        const architecture = parts[parts.length - 1]; // 最后一个部分是架构
        const operatingSystem = parts[parts.length - 2]; // 倒数第二个部分是操作系统
        const application = parts.slice(0, parts.length - 2).join('-'); // 其余部分组合成应用名称
        
        applications.add(application);
        operatingSystems.add(operatingSystem);
        architectures.add(architecture);
      }
    });
    
    const result = {
      applications: Array.from(applications).sort(),
      operatingSystems: Array.from(operatingSystems).sort(),
      architectures: Array.from(architectures).sort()
    };
    
    return result;
  }, [availableFileTypes]);

  // 格式化文件类型显示
  const formatFileType = (fileType: string) => {
    if (fileType === 'all') return '全部';
    const parts = fileType.split('-');
    if (parts.length === 3) {
      const [app, os, arch] = parts;
      // 操作系统标签映射
      const osLabels: { [key: string]: string } = {
        'windows': 'Windows',
        'macos': 'macOS',
        'linux': 'Linux',
        'android': 'Android',
        'ios': 'iOS',
        'harmonyos': 'HarmonyOS'
      };
      
      // 架构标签映射
      const archLabels: { [key: string]: string } = {
        'x64': 'x64 (64位)',
        'x86': 'x86 (32位)',
        'arm64': 'arm64',
        'universal': 'Universal'
      };
      
      const osLabel = osLabels[os] || os;
      const archLabel = archLabels[arch] || arch;
      
      return `${app} - ${osLabel} - ${archLabel}`;
    }
    return fileType;
  };

  // 处理筛选
  const handleFilterChange = (newFilters: typeof historyFilters) => {
    setHistoryFilters(newFilters);
    fetchHistory(1, newFilters);
  };

  // 处理便捷时间选项
  const handleQuickDateFilter = (type: 'today' | 'week' | 'month') => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    switch (type) {
      case 'today':
        startDate = now.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
    }

    const newFilters = {
      ...historyFilters,
      startDate,
      endDate
    };
    
    handleFilterChange(newFilters);
  };

  // 重置筛选
  const resetFilters = () => {
    const defaultFilters = {
      fileType: 'all',
      application: 'all',
      operatingSystem: 'all', 
      architecture: 'all',
      startDate: '',
      endDate: ''
    };
    setHistoryFilters(defaultFilters);
    fetchHistory(1, defaultFilters);
  };

  useEffect(() => {
    updatePageTitle();
    
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchAllStats(),
        fetchHistory()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="stats-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <h1>下载统计</h1>
      
      {/* 标签页导航 */}
      <div className="stats-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          统计概览
        </button>
        <button 
          className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          文件统计
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          下载历史
        </button>
      </div>

      {/* 统计概览 */}
      {activeTab === 'overview' && overview && (
        <div className="stats-overview">
          <div className="stats-cards">
            <div className="stats-card">
              <h3>总文件数</h3>
              <div className="stats-number">{overview.totalFiles}</div>
            </div>
            <div className="stats-card">
              <h3>总下载次数</h3>
              <div className="stats-number">{overview.totalDownloads}</div>
            </div>
            <div className="stats-card">
              <h3>今日下载</h3>
              <div className="stats-number">{overview.todayDownloads}</div>
            </div>
            <div className="stats-card">
              <h3>本周下载</h3>
              <div className="stats-number">{overview.weekDownloads}</div>
            </div>
            <div className="stats-card">
              <h3>本月下载</h3>
              <div className="stats-number">{overview.monthDownloads}</div>
            </div>
          </div>

          <div className="top-files">
            <h3>热门文件 Top 5</h3>
            <div className="top-files-list">
              {overview.topFiles.map((file, index) => (
                <div key={file.filename} className="top-file-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="file-info">
                    <div className="filename">{file.filename}</div>
                    <div className="download-count">{file.downloadCount} 次下载</div>
                  </div>
                  <div className="last-download">
                    最后下载: {formatRelativeTime(file.lastDownload)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 文件统计 */}
      {activeTab === 'files' && (
        <div className="files-stats">
          <h3>所有文件下载统计</h3>
          <div className="files-table">
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>文件名</th>
                  <th>下载次数</th>
                  <th>首次下载</th>
                  <th>最后下载</th>
                </tr>
              </thead>
              <tbody>
                {allStats.map((file, index) => (
                  <tr key={file.filename}>
                    <td>#{index + 1}</td>
                    <td className="filename">{file.filename}</td>
                    <td className="download-count">{file.downloadCount}</td>
                    <td>{formatTime(file.firstDownload)}</td>
                    <td>{formatTime(file.lastDownload)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 下载历史 */}
      {activeTab === 'history' && (
        <div className="download-history">
          <div className="history-header">
            <h3>下载历史记录</h3>
            <div className="history-filters">
              {/* 便捷时间选项 */}
              <div className="quick-date-filters-inline">
                <label>快捷选择:</label>
                <div className="quick-date-buttons">
                  <button 
                    className="quick-date-btn"
                    onClick={() => handleQuickDateFilter('today')}
                    title="查看今日下载记录"
                  >
                    今日
                  </button>
                  <button 
                    className="quick-date-btn"
                    onClick={() => handleQuickDateFilter('week')}
                    title="查看最近一周下载记录"
                  >
                    最近一周
                  </button>
                  <button 
                    className="quick-date-btn"
                    onClick={() => handleQuickDateFilter('month')}
                    title="查看最近一个月下载记录"
                  >
                    最近一个月
                  </button>
                </div>
              </div>
              

              
              <div className="date-range-group">
                <div className="filter-group-inline">
                  <label htmlFor="startDateFilter">开始日期:</label>
                  <input 
                    id="startDateFilter"
                    type="date" 
                    value={historyFilters.startDate}
                    onChange={(e) => handleFilterChange({...historyFilters, startDate: e.target.value})}
                    title="选择开始日期"
                    placeholder="选择开始日期"
                  />
                </div>
                <div className="filter-group-inline">
                  <label htmlFor="endDateFilter">结束日期:</label>
                  <input 
                    id="endDateFilter"
                    type="date" 
                    value={historyFilters.endDate}
                    onChange={(e) => handleFilterChange({...historyFilters, endDate: e.target.value})}
                    title="选择结束日期"
                    placeholder="选择结束日期"
                  />
                </div>
                
                <button className="reset-filters-btn" onClick={resetFilters}>
                  重置筛选
                </button>
              </div>
            </div>
            
            {/* 文件类型筛选器组 - 单独一行 */}
            <div className="file-type-filters">
              <div className="filter-group-inline">
                <label htmlFor="applicationFilter">应用: (共{filterOptions.applications.length}个)</label>
                <select 
                  id="applicationFilter"
                  value={historyFilters.application} 
                  onChange={(e) => handleFilterChange({...historyFilters, application: e.target.value})}
                  title="选择应用进行筛选"
                  style={{ minWidth: '120px' }}
                >
                  <option value="all">全部</option>
                  {filterOptions.applications.length > 0 ? (
                    filterOptions.applications.map(app => (
                      <option key={app} value={app}>{app}</option>
                    ))
                  ) : (
                    <option disabled>暂无数据</option>
                  )}
                </select>
              </div>
              
              <div className="filter-group-inline">
                <label htmlFor="osFilter">操作系统: (共{filterOptions.operatingSystems.length}个)</label>
                <select 
                  id="osFilter"
                  value={historyFilters.operatingSystem}
                  onChange={(e) => handleFilterChange({...historyFilters, operatingSystem: e.target.value})}
                  title="选择操作系统进行筛选"
                  style={{ minWidth: '120px' }}
                >
                  <option value="all">全部</option>
                  {filterOptions.operatingSystems.length > 0 ? (
                    filterOptions.operatingSystems.map(os => (
                      <option key={os} value={os}>{os.charAt(0).toUpperCase() + os.slice(1)}</option>
                    ))
                  ) : (
                    <option disabled>暂无数据</option>
                  )}
                </select>
              </div>
              
              <div className="filter-group-inline">
                <label htmlFor="archFilter">架构: (共{filterOptions.architectures.length}个)</label>
                <select 
                  id="archFilter"
                  value={historyFilters.architecture}
                  onChange={(e) => handleFilterChange({...historyFilters, architecture: e.target.value})}
                  title="选择架构进行筛选"
                  style={{ minWidth: '120px' }}
                >
                  <option value="all">全部</option>
                  {filterOptions.architectures.length > 0 ? (
                    filterOptions.architectures.map(arch => (
                      <option key={arch} value={arch}>{arch}</option>
                    ))
                  ) : (
                    <option disabled>暂无数据</option>
                  )}
                </select>
              </div>
            </div>
          </div>
          
          <div className="filter-summary">
            共找到 {historyPagination.total} 条记录，当前显示第 {historyPagination.page} 页（共 {historyPagination.totalPages} 页）
            {(historyFilters.fileType !== 'all' || historyFilters.startDate || historyFilters.endDate) && (
              <span className="active-filters">
                {historyFilters.fileType !== 'all' && ` | 文件类型: ${formatFileType(historyFilters.fileType)}`}
                {historyFilters.startDate && ` | 开始: ${historyFilters.startDate}`}
                {historyFilters.endDate && ` | 结束: ${historyFilters.endDate}`}
              </span>
            )}
          </div>
          
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>文件名</th>
                  <th>IP地址</th>
                  <th>地理位置</th>
                  <th>浏览器/系统</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => {
                  const browserInfo = parseBrowserInfo(record.userAgent);
                  return (
                    <tr key={index}>
                      <td>{formatTime(record.timestamp)}</td>
                      <td className="filename">{record.filename}</td>
                      <td>{record.ip}</td>
                      <td className="location-info">
                        {record.location ? (
                          <div className="location-details">
                            <div className="location-main">
                              {formatLocation(record.location)}
                            </div>
                            {record.location.isp && (
                              <div className="location-isp">
                                {record.location.isp}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="location-unknown">未知</span>
                        )}
                      </td>
                      <td className="browser-info">
                        <div className="browser-details">
                          <div className={`browser-main ${browserInfo.os === '爬虫' || browserInfo.os === '自动化工具' || browserInfo.os === '命令行工具' || browserInfo.os === 'API测试工具' ? 'bot-browser' : ''}`}>
                            {browserInfo.browser}
                          </div>
                          <div className={`browser-os ${browserInfo.os === '爬虫' || browserInfo.os === '自动化工具' || browserInfo.os === '命令行工具' || browserInfo.os === 'API测试工具' ? 'bot-os' : ''}`}>
                            {browserInfo.os}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {historyPagination.total > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                第 {historyPagination.page} 页，共 {historyPagination.totalPages} 页
                （每页 {historyPagination.limit} 条，共 {historyPagination.total} 条记录）
              </span>
              <div className="pagination-buttons">
                <div className="page-size-selector">
                  <label htmlFor="pageSizeSelect">每页显示:</label>
                  <select 
                    id="pageSizeSelect"
                    value={historyPagination.limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value);
                      setHistoryPagination(prev => ({...prev, limit: newLimit, page: 1}));
                      fetchHistory(1, undefined, newLimit);
                    }}
                    title="选择每页显示的记录数量"
                  >
                    <option value={20}>20条</option>
                    <option value={50}>50条</option>
                    <option value={100}>100条</option>
                    <option value={200}>200条</option>
                  </select>
                </div>
                <button 
                  className="pagination-btn"
                  onClick={() => fetchHistory(historyPagination.page - 1)}
                  disabled={historyPagination.page <= 1}
                >
                  上一页
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => fetchHistory(historyPagination.page + 1)}
                  disabled={historyPagination.page >= historyPagination.totalPages}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default StatsPage; 