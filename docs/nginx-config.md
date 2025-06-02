# 彩旗软件分发平台 - 部署指南：Nginx 反向代理配置

本文档介绍如何配置 Nginx 作为彩旗软件分发平台的前端静态文件服务器和后端 API 的反向代理。

## Nginx 配置

创建 Nginx 配置文件，通常位于 `/etc/nginx/sites-available/` 目录下，例如 `/etc/nginx/sites-available/app-distribution`：

```bash
sudo nano /etc/nginx/sites-available/app-distribution
```

将以下配置内容粘贴到文件中，并根据你的实际情况修改相关路径：

```nginx
server {
    listen 80;
    server_name download.skstudio.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name download.skstudio.cn;

    # SSL 证书路径 (Certbot 会自动配置)
    ssl_certificate /etc/letsencrypt/live/download.skstudio.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/download.skstudio.cn/privkey.pem;
sk-
    # 前端静态文件
    location / {
        root /var/www/sk-app-distribution/dist;  # 替换为你的项目路径
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location ~ ^/(api|upload|download|list) {
        proxy_pass http://localhost:4009;  # 确保端口与 config.yaml 一致
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500M;  # 文件上传大小限制
    }
}
```

**注意**: 
- 域名已设置为 `download.skstudio.cn`
- 将 `/opt/app-distribution/dist` 替换为你的项目实际部署路径
- 确保端口 `4009` 与你 `config.yaml` 中的 `backend_port` 一致

## 启用站点并重启 Nginx

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/app-distribution /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 下一步

接下来配置 [SSL 证书和防火墙](security-config.md)。 