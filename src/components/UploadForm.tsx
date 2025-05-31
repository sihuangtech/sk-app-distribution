// src/components/UploadForm.tsx
import React, { useState, useMemo } from 'react';
import '../App.css'; // 引入 App.css 以使用其中的样式

interface UploadFormProps {
  onUploadSuccess: () => void; // 上传成功回调函数
}

function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [application, setApplication] = useState<string>('');
  const [os, setOs] = useState<string>('');
  const [architecture, setArchitecture] = useState<string>('');
  const [versionType, setVersionType] = useState<string>('release');

  // 定义所有可能的操作系统和对应的架构
  const availableArchitectures: { [key: string]: { value: string, label: string }[] } = {
    windows: [{ value: 'x64', label: 'x64' }, { value: 'arm64', label: 'arm64' }],
    macos: [{ value: 'x64', label: 'x64 (Intel Chip)' }, { value: 'arm64', label: 'arm64 (Apple Silicon)' }, { value: 'universal', label: 'Universal' }],
    linux: [{ value: 'x64', label: 'x64' }, { value: 'arm64', label: 'arm64' }],
    android: [{ value: 'arm64', label: 'arm64' }],
    ios: [{ value: 'arm64', label: 'arm64' }],
    harmonyos: [{ value: 'arm64', label: 'arm64' }],
    '': [{ value: 'x64', label: 'x64' }, { value: 'arm64', label: 'arm64' }],
  };

  // 根据选择的操作系统计算可用的架构选项
  const filteredArchitectures = useMemo(() => {
    if (os && availableArchitectures[os] && !availableArchitectures[os].some(arch => arch.value === architecture)) {
        setArchitecture('');
    }
    return availableArchitectures[os] || availableArchitectures[''];
  }, [os, architecture]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setDownloadLink(''); // 选择新文件时清空下载链接
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择要上传的文件。');
      return;
    }
    if (!application || !os || !architecture || !versionType) {
      alert('请选择应用、操作系统、架构和版本类型。');
      return;
    }

    const formData = new FormData();
    formData.append('package', selectedFile);
    formData.append('application', application);
    formData.append('os', os);
    formData.append('architecture', architecture);
    formData.append('versionType', versionType);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDownloadLink(result.downloadUrl);
        alert(result.message);
        onUploadSuccess(); // 调用上传成功回调
      } else {
        const errorText = await response.text();
        alert(`文件上传失败: ${errorText}`);
      }
    } catch (error) {
      console.error('上传出错:', error);
      alert('上传出错。');
    }
  };

  return (
    <div className="upload-form-section section-box"> {/* 添加类名 */}
      <h2>上传新文件</h2>
      <div>
        <label htmlFor="application">应用:</label>
        <select id="application" value={application} onChange={(e) => setApplication(e.target.value)}>
          <option value="">请选择</option>
          <option value="app1">应用1</option>
          <option value="app2">应用2</option>
          {/* 可以添加更多应用选项 */}
        </select>
      </div>
      <div>
        <label htmlFor="os">操作系统:</label>
        <select id="os" value={os} onChange={(e) => setOs(e.target.value)}>
          <option value="">请选择</option>
          <option value="windows">Windows</option>
          <option value="macos">macOS</option>
          <option value="linux">Linux</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
          <option value="harmonyos">HarmonyOS</option>
          {/* 可以添加更多操作系统选项 */}
        </select>
      </div>
      <div>
        <label htmlFor="architecture">架构:</label>
        <select id="architecture" value={architecture} onChange={(e) => setArchitecture(e.target.value)}>
          <option value="">请选择</option>
          {/* 动态生成架构选项 */}
          {filteredArchitectures.map((arch) => (
            <option key={arch.value} value={arch.value}>{arch.label}</option>
          ))}
        </select>
      </div>
      <div className="radio-group">
        <label>版本类型:</label>
        <div>
          <input
            type="radio"
            id="release"
            name="versionType"
            value="release"
            checked={versionType === 'release'}
            onChange={(e) => setVersionType(e.target.value)}
          />
          <label htmlFor="release">正式版</label>
        </div>
        <div>
          <input
            type="radio"
            id="test"
            name="versionType"
            value="test"
            checked={versionType === 'test'}
            onChange={(e) => setVersionType(e.target.value)}
          />
          <label htmlFor="test">测试版</label>
        </div>
      </div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>上传</button>
      {downloadLink && (
        <div className="download-link-container">
          <p>下载链接:</p>
          <a href={`http://localhost:3000${downloadLink}`} target="_blank" rel="noopener noreferrer">
            {`http://localhost:3000${downloadLink}`}
          </a>
        </div>
      )}
    </div>
  );
}

export default UploadForm; 