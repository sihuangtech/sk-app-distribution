import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getApiBaseUrl } from './utils/config';
import './styles/App.css';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadPage from './pages/UploadPage';
import AppsPage from './pages/AppsPage';
import UploadForm from './components/UploadForm'; // 导入 UploadForm 组件
import FileList from './components/FileList';     // 导入 FileList 组件

interface UploadedFile {
  name: string;
  path: string; // 文件的相对下载路径
  uploadTime: string; // 文件上传时间
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // 存储已上传文件列表
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
        const files: UploadedFile[] = await response.json();
        setUploadedFiles(files);
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
        } else {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // 处理登录成功
  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    fetchFiles();
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
            <Route path="/apps" element={<AppsPage files={uploadedFiles} onFileDeleted={fetchFiles} />} />
            <Route path="/" element={<Navigate to="/upload" replace />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;