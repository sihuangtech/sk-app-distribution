# 软件分发平台

这是一个简单的软件分发平台，允许开发者上传安装包，并生成下载链接供用户下载。

## 项目结构

- `server.js`: 后端 Express 服务器，处理文件上传和下载。
- `index.html`: 前端应用的入口文件。
- `src/main.jsx`: React 应用的主入口。
- `src/App.jsx`: 包含文件上传界面的 React 组件。
- `uploads/`: 上传的文件将存储在此目录。

## 开发环境准备

请确保你已经安装了 Node.js 和 npm。

## 安装依赖

在项目根目录下运行以下命令安装所有依赖：

```bash
npm install
```

## 运行项目

你需要分别启动后端服务器和前端开发服务器。

1.  **启动后端服务器：**

    在项目根目录下运行：

    ```bash
npm start
    ```

    服务器将运行在 `http://localhost:3000`。

2.  **启动前端开发服务器：**

    在项目根目录下运行：

    ```bash
npm run dev
    ```

    前端应用通常运行在 `http://localhost:5173`。

## 功能说明

- **文件上传：** 开发者可以通过前端界面选择并上传安装包。
- **文件下载：** 上传成功后，前端界面会显示生成的下载链接供用户下载。

## 注意事项

- 当前的文件下载是直接通过文件名访问，实际应用中可能需要更安全的下载方式和链接管理。
- 前端界面比较基础，仅用于开发者上传文件。

## 项目部署

### 1. 服务器环境准备

- 确保你的服务器上安装了 Node.js 和 npm。
- 上传所有项目文件到服务器。

### 2. 安装依赖

在服务器的项目根目录下运行以下命令安装所有依赖：

```bash
npm install
```

### 3. 构建前端应用

在项目根目录下运行以下命令构建前端应用：

```bash
npm run build
```

这将在项目根目录下生成一个 `dist` 目录，包含用于生产环境的前端文件。

### 4. 配置服务器以提供静态文件服务和运行后端

你需要配置你的 Web 服务器 (如 Nginx, Apache) 或者使用 Node.js 来同时提供静态的前端文件 (`dist` 目录中的内容) 和运行后端 Express 应用。

#### 使用 Node.js (PM2 推荐)

可以使用 PM2 这样的进程管理器来运行 `server.js` 文件，并配置 Express 来提供静态文件。

首先，安装 PM2：

```bash
npm install -g pm2
```

然后在项目根目录下运行后端应用：

```bash
pm2 start server.js
```

修改 `server.js` 以提供静态文件服务：

```javascript
// ... existing code ...

// 提供静态文件服务 (构建后的前端文件)
app.use(express.static(path.join(__dirname, 'dist')));

// 对于所有其他请求，发送 index.html，让 React Router (如果使用) 处理路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ... existing code ...
```

请注意，如果在前端使用了客户端路由 (如 React Router)，你需要配置服务器将所有非文件请求重定向到 `index.html`，以便客户端路由生效。

#### 使用 Nginx (示例配置)

以下是一个简化的 Nginx 配置示例，用于反向代理后端 API 请求并将其他请求指向前端静态文件：

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location /upload {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /download/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/your/project/dist;
        try_files $uri /index.html;
        index index.html;
    }
}
```

将 `your_domain.com` 替换为你的域名，`/path/to/your/project/dist` 替换为你的项目 `dist` 目录的实际路径。

### 5. 运行后端进程

如果你使用 Nginx 或 Apache 作为 Web 服务器，你需要独立运行后端 Express 应用。推荐使用 PM2 来管理 Node.js 进程。

在项目根目录下运行：

```bash
pm2 start server.js
```

### 6. 访问应用

部署完成后，通过你的服务器域名或 IP 地址访问应用程序。 