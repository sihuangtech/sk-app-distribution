// src/components/FileList.tsx
import React from 'react';
import '../App.css'; // 引入 App.css 以使用其中的样式

interface UploadedFile {
  name: string;
  path: string; // 文件的相对下载路径
}

interface FileListProps {
  files: UploadedFile[]; // 已上传文件列表数据
}

function FileList({ files }: FileListProps) {
  return (
    <div className="file-list-section section-box">
      <h2>已上传文件</h2>
      {files.length === 0 ? (
        <p>暂无上传文件。</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file.path}>
              <a href={`http://localhost:3000${file.path}`} target="_blank" rel="noopener noreferrer">
                {file.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileList; 