import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/config';
import { eventBus } from '../utils/eventBus';
import '../styles/Navbar.css';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();
  const [websiteTitle, setWebsiteTitle] = useState('彩旗软件分发平台');

  // 获取网站标题
  const fetchWebsiteTitle = async () => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/config`);
      
      if (response.ok) {
        const config = await response.json();
        if (config.website?.title) {
          setWebsiteTitle(config.website.title);
        }
      }
    } catch (error) {
      console.error('Failed to fetch website title:', error);
    }
  };

  useEffect(() => {
    fetchWebsiteTitle();

    // 监听配置更新事件
    const handleConfigUpdate = (config: any) => {
      if (config.website?.title) {
        setWebsiteTitle(config.website.title);
      }
    };

    eventBus.on('configUpdated', handleConfigUpdate);

    // 清理事件监听器
    return () => {
      eventBus.off('configUpdated', handleConfigUpdate);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>{websiteTitle}</h1>
        </div>
        
        <div className="navbar-menu">
          <Link 
            to="/upload" 
            className={`navbar-item ${location.pathname === '/upload' ? 'active' : ''}`}
          >
            上传应用
          </Link>
          <Link 
            to="/apps" 
            className={`navbar-item ${location.pathname === '/apps' ? 'active' : ''}`}
          >
            已上传应用
          </Link>
          <Link 
            to="/stats" 
            className={`navbar-item ${location.pathname === '/stats' ? 'active' : ''}`}
          >
            下载统计
          </Link>
          <Link 
            to="/settings" 
            className={`navbar-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            系统设置
          </Link>
        </div>
        
        <div className="navbar-actions">
          <button onClick={onLogout} className="logout-button">
            退出登录
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 