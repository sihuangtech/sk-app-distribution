# 彩旗软件分发平台 - 部署指南

本文档详细介绍如何在生产环境中部署彩旗软件分发平台。

## 服务器要求

- **操作系统**: Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- **Node.js**: 版本 16.0 或更高
- **内存**: 至少 1GB RAM
- **存储**: 至少 10GB 可用空间（根据上传文件大小调整）
- **网络**: 公网 IP 地址

## 安装步骤

### 1. 服务器基础环境准备

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要的工具
sudo apt install -y curl wget git nginx

# 安装 Node.js (使用 NodeSource 仓库)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 下载和配置项目

```bash
# 克隆项目到服务器
git clone <your-repository-url> /opt/app-distribution
cd /opt/app-distribution

# 安装依赖
npm install

# 构建前端
npm run build
```

### 3. 配置文件设置

编辑 `config.yaml` 文件：

```bash
sudo nano config.yaml
```

配置内容：
```yaml
# 服务器端口配置
server:
  backend_port: 4009  # 后端API端口
  frontend_port: 3009 # 前端开发服务器端口（生产环境不使用）

admin:
  username: your_secure_admin_username
  password: your_secure_admin_password
  sessionDuration: 30

jwt:
  secret: your_very_secure_jwt_secret_key_here
```

**安全提示**: 请使用强密码和复杂的JWT密钥。

### 4. 使用 PM2 进行进程管理

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
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
      PORT: 4009
    }
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 设置 PM2 开机自启
pm2 startup
pm2 save
```

### 5. Nginx 反向代理配置

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/app-distribution
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 前端静态文件
    location / {
        root /opt/app-distribution/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 请求代理到后端
    location /api/ {
        proxy_pass http://localhost:4009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传
    location /upload {
        proxy_pass http://localhost:4009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 增加上传文件大小限制
        client_max_body_size 500M;
    }

    # 文件下载和列表
    location ~ ^/(download|list) {
        proxy_pass http://localhost:4009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点并重启 Nginx：

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/app-distribution /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 6. SSL 证书配置 (推荐)

使用 Let's Encrypt 免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. 防火墙配置

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许必要的端口
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 检查状态
sudo ufw status
```

## 监控和维护

### 查看应用状态

```bash
# 查看 PM2 进程状态
pm2 status

# 查看应用日志
pm2 logs app-distribution

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 更新应用

```bash
cd /opt/app-distribution

# 拉取最新代码
git pull origin main

# 安装新依赖（如果有）
npm install

# 重新构建前端
npm run build

# 重启应用
pm2 restart app-distribution
```

### 备份策略

```bash
# 创建备份脚本
cat > /opt/backup-app.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# 备份上传的文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/app-distribution/uploads/

# 备份配置文件
cp /opt/app-distribution/config.yaml $BACKUP_DIR/config_$DATE.yaml

# 删除30天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.yaml" -mtime +30 -delete
EOF

chmod +x /opt/backup-app.sh

# 设置定时备份（每天凌晨2点）
sudo crontab -e
# 添加：0 2 * * * /opt/backup-app.sh
```

## 故障排除

### 常见问题

1. **应用无法启动**
   ```bash
   # 检查端口是否被占用
   sudo netstat -tlnp | grep :4009
   
   # 检查 PM2 日志
   pm2 logs app-distribution
   ```

2. **文件上传失败**
   - 检查 `uploads` 目录权限
   - 确认 Nginx 上传大小限制
   - 查看磁盘空间

3. **无法访问网站**
   - 检查 Nginx 配置
   - 确认防火墙设置
   - 验证域名解析

### 性能优化

1. **启用 Gzip 压缩**（在 Nginx 配置中添加）：
   ```nginx
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
   ```

2. **调整 PM2 实例数量**：
   ```bash
   # 根据 CPU 核心数调整
   pm2 scale app-distribution 2
   ```

## 安全建议

1. **定期更新系统和依赖**
2. **使用强密码和复杂的 JWT 密钥**
3. **启用 HTTPS**
4. **定期备份数据**
5. **监控系统资源使用情况**
6. **限制文件上传类型和大小**

## 支持

如果在部署过程中遇到问题，请检查：
- 系统日志：`sudo journalctl -u nginx`
- PM2 日志：`pm2 logs`
- 应用配置文件是否正确 