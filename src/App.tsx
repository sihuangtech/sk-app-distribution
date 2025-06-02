import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getApiBaseUrl } from './utils/config';
import { updatePageTitle, setDefaultTitle } from './utils/pageTitle';
import './styles/App.css';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadPage from './pages/UploadPage';
import AppsPage from './pages/AppsPage';
import SettingsPage from './pages/SettingsPage';
import UploadForm from './components/UploadForm'; // 导入 UploadForm 组件
import FileList from './components/FileList';     // 导入 FileList 组件

interface UploadedFile {
  name: string;
  path: string; // 文件的相对下载路径
  uploadTime: string; // 文件上传时间
  application: string; // 应用名称
  os: string; // 操作系统
  architecture: string; // 架构
  versionType: string; // 版本类型
  size: number; // 文件大小（字节）
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // 存储已上传文件列表
  const [fileStats, setFileStats] = useState<FileStats>({ totalFiles: 0, totalSize: 0 }); // 文件统计信息
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 验证token
  const verifyToken = async (token: string) => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Token验证失败:', error);
      return false;
    }
  };

  // 获取文件列表
  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // 处理新的API响应格式
        if (data.files && data.stats) {
          setUploadedFiles(data.files);
          setFileStats(data.stats);
        } else {
          // 兼容旧格式
          setUploadedFiles(data);
          setFileStats({ totalFiles: data.length, totalSize: 0 });
        }
      } else {
        console.error('获取文件列表失败:', response.statusText);
      }
    } catch (error) {
      console.error('获取文件列表出错:', error);
    }
  };

  // 组件加载时检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const isValid = await verifyToken(token);
        if (isValid) {
          setIsAuthenticated(true);
          await fetchFiles();
          // 更新页面标题
          await updatePageTitle();
        } else {
          localStorage.removeItem('token');
        }
      } else {
        // 如果没有token，也尝试更新页面标题
        await updatePageTitle();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // 处理登录成功
  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    fetchFiles();
    // 登录成功后更新页面标题
    updatePageTitle();
  };

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUploadedFiles([]);
  };

  // 处理上传成功，刷新文件列表
  const handleUploadSuccess = () => {
    fetchFiles();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-layout">
        <Navbar onLogout={handleLogout} />
        
        <main className="main-content">
          <Routes>
            <Route path="/upload" element={<UploadPage onUploadSuccess={handleUploadSuccess} />} />
            <Route path="/apps" element={<AppsPage files={uploadedFiles} fileStats={fileStats} onFileDeleted={fetchFiles} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/upload" replace />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;