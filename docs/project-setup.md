# 彩旗软件分发平台 - 部署指南：项目部署与配置

本文档介绍如何将彩旗软件分发平台项目部署到服务器，并进行必要的配置。

## 1. 下载和配置项目

在服务器上选择一个合适的目录（例如 `/var/`），然后克隆项目代码并安装依赖：

```bash
# 克隆项目到服务器
git clone https://gitee.com/SKStudio/sk-app-distribution.git /var/www/sk-app-distribution
cd /var/app-distribution

# 安装依赖
npm install

# 构建前端用于生产环境
npm run build
```

## 2. 配置文件设置

编辑 `config.yaml` 文件，配置服务器端口、管理员账号、JWT密钥、网站信息以及上传/下载限制等：

```bash
sudo nano config.yaml
```

请参考项目根目录下的 `config.yaml` 示例或 README 文档中的配置说明进行修改。确保设置强密码和复杂的JWT密钥。

## 3. 使用 PM2 进行进程管理

为了保证应用在后台稳定运行并在服务器重启后自动启动，我们使用 PM2 进行进程管理。

首先，全局安装 PM2：

```bash
sudo npm install -g pm2
```

然后，创建一个 PM2 配置文件 `ecosystem.config.js` 在项目根目录：

```javascript
module.exports = {
  apps: [{
    name: 'app-distribution',
    script: 'server.ts',
    interpreter: 'node',
    interpreter_args: '--loader ts-node/esm',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      # 根据 config.yaml 中的 backend_port 设置
      PORT: 4009 
    }
  }]
};
```

**注意**: 将 `PORT` 的值替换为你 `config.yaml` 中 `backend_port` 的值。

启动应用并设置开机自启：

```bash
pm2 start ecosystem.config.js

# 设置 PM2 开机自启 (根据提示执行相应的命令)
pm2 startup

# 保存当前 PM2 进程列表，以便开机时恢复
pm2 save
```

---

## 或者：使用 systemd 进行进程管理

除了使用 PM2，你也可以配置 systemd 服务来管理 Node.js 应用。这是一种更系统化的方式，尤其适用于对服务状态有严格要求的场景。

### 创建 systemd 服务文件

在 `/etc/systemd/system/` 目录下创建一个新的服务文件，例如 `sk-app-distribution.service`：

```bash
sudo nano /etc/systemd/system/sk-app-distribution.service
```

将以下内容粘贴到文件中，并根据你的实际情况修改 `WorkingDirectory` 和 `ExecStart` 的路径：

```ini
[Unit]
Description=Backend service for the CaiQi Software Distribution Platform
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/sk-app-distribution
ExecStart=/home/ubuntu/.nvm/versions/node/v24.0.0/bin/node /home/ubuntu/.nvm/versions/node/v24.0.0/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sk-app-distribution
Environment=NODE_ENV=production
Environment=PATH=/home/ubuntu/.nvm/versions/node/v24.0.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=NVM_DIR=/home/ubuntu/.nvm

[Install]
WantedBy=multi-user.target
```

**注意**:
- 将 `User` 替换为你希望运行服务的用户，建议创建一个专门用于运行应用的用户。
- 将 `WorkingDirectory` 替换为你的项目实际部署路径。
- `ExecStart` 现在使用nvm安装的Node.js 24版本的完整路径。请根据你的实际Node.js版本号调整路径（例如 v24.1.0, v24.2.0 等）。
- 添加了 `PATH` 环境变量，确保系统能找到nvm安装的Node.js和npm。
- 添加了 `NVM_DIR` 环境变量，指向nvm的安装目录。
- 添加了 `Environment=NODE_ENV=production` 设置生产环境变量。

**重要提示**: 
- 请将路径中的 `/home/ubuntu` 替换为实际的用户主目录。
- 请将 `v24.0.0` 替换为你实际安装的Node.js 24版本号。你可以通过运行 `nvm list` 命令查看已安装的版本。
- 如果你的用户名不是 `ubuntu`，请相应地修改所有路径中的用户名。

### 启用并启动服务

保存并关闭文件后，重新加载 systemd 配置，然后启动并启用服务使其开机自启：

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start sk-app-distribution

# 启用服务使其开机自启
sudo systemctl enable sk-app-distribution

# 查看服务状态
sudo systemctl status sk-app-distribution
```

### 查看日志

使用 `journalctl` 命令查看服务的日志：

```bash
sudo journalctl -u sk-app-distribution -f
```

---

## 下一步

应用后端已经在 PM2 或 systemd 的管理下运行，但目前还无法直接通过域名访问。接下来需要配置 [Nginx 反向代理](nginx-config.md) 来暴露应用并处理静态文件服务。 