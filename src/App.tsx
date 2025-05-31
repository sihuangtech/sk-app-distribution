import React, { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm'; // 导入 UploadForm 组件
import FileList from './components/FileList';     // 导入 FileList 组件

interface UploadedFile {
  name: string;
  path: string; // 文件的相对下载路径
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // 存储已上传文件列表

  // 获取文件列表
  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:3000/list');
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

  // 组件加载时获取文件列表
  useEffect(() => {
    fetchFiles();
  }, []);

  // 处理上传成功，刷新文件列表
  const handleUploadSuccess = () => {
    fetchFiles();
  };

  return (
    <div className="page-layout">
      <h1>软件分发平台</h1>
      <div className="content-container">
        {/* 渲染 FileList 组件，并传递文件列表数据 */}
        <FileList files={uploadedFiles} />

        {/* 渲染 UploadForm 组件，并传递上传成功回调函数 */}
        <UploadForm onUploadSuccess={handleUploadSuccess} />
      </div>
    </div>
  );
}

export default App;