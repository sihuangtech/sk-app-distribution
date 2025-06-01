import React from 'react';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>彩旗软件分发平台</h3>
            <p>简单、安全、高效的软件分发解决方案</p>
          </div>
          
          <div className="footer-section">
            <h4>功能特性</h4>
            <ul>
              <li>安全的文件上传</li>
              <li>便捷的下载链接</li>
              <li>用户权限管理</li>
              <li>文件列表管理</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>技术支持</h4>
            <ul>
              <li>React + TypeScript</li>
              <li>Express.js</li>
              <li>JWT 认证</li>
              <li>文件存储管理</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 彩旗软件分发平台. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 