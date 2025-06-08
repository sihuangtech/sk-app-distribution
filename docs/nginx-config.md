# 彩旗软件分发平台 - 部署指南：Nginx 反向代理配置

本文档介绍如何配置 Nginx 作为彩旗软件分发平台的前端静态文件服务器和后端 API 的反向代理，以及如何正确获取用户真实 IP 地址。

## 重要说明

为了在下载统计中正确显示用户的真实公网 IP 地址（而不是代理服务器的内网 IP），需要正确配置 Nginx 代理头和后端应用。本配置已经包含了必要的设置。

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

    # 后端 API 代理
    location ~ ^/(api|upload|download) {
        proxy_pass http://localhost:4009;  # 确保端口与 config.yaml 一致
        proxy_set_header Host $host;
        
        # 重要：传递真实客户端IP的配置，用于正确统计下载IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        client_max_body_size 6G;  # 文件上传大小限制，与config.yaml中的max_file_size保持一致
    }

    # 文件下载代理 - 匹配任何包含扩展名的文件（格式：/filename.ext）
    location ~ ^/[^/]+\.[^/]+$ {
        proxy_pass http://localhost:4009;
        proxy_set_header Host $host;
        
        # 重要：传递真实客户端IP的配置，用于正确统计下载IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        client_max_body_size 6G;
    }

    # 前端静态文件 (必须放在最后)
    location / {
        root /var/www/sk-app-distribution/dist;  # 替换为你的项目路径
        try_files $uri $uri/ /index.html;
    }
}
```

**重要变更**:
- 添加了文件下载的location规则，匹配任何包含扩展名的文件（格式：/filename.ext）
- 将前端静态文件的location规则移到最后，确保文件下载请求优先被代理到后端
- **新增**：配置了完整的代理头信息，确保后端能够获取用户真实 IP 地址用于下载统计
- 域名已设置为 `download.skstudio.cn`
- 将 `/opt/app-distribution/dist` 替换为你的项目实际部署路径
- 确保端口 `4009` 与你 `config.yaml` 中的 `backend_port` 一致

## IP 地址获取说明

### 问题背景
在使用 Nginx 代理的情况下，后端应用默认只能获取到代理服务器的内网 IP（如 127.0.0.1），而无法获取用户的真实公网 IP。

### 解决方案
1. **Nginx 配置**：通过 `proxy_set_header` 指令传递真实客户端 IP
   - `X-Real-IP`：直接传递客户端 IP
   - `X-Forwarded-For`：传递完整的 IP 转发链
   - `X-Forwarded-Proto`：传递协议信息（http/https）

2. **后端应用配置**：
   - 已在 `server.ts` 中添加 `app.set('trust proxy', true)` 信任代理
   - 已在 `src/utils/downloadStats.ts` 中实现智能 IP 获取逻辑，按优先级检查各种代理头

### 验证方法
部署后可以通过查看下载历史页面的 IP 统计来验证是否正确获取了用户的真实公网 IP 地址。

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