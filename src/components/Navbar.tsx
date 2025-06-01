import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>彩旗软件分发平台</h1>
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