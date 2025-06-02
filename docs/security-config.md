# 彩旗软件分发平台 - 部署指南：安全配置

本文档介绍如何为彩旗软件分发平台配置 SSL 证书以启用 HTTPS，以及配置防火墙来增强服务器安全性。

## 1. SSL 证书配置 (推荐)

为了保证数据传输安全，强烈建议为你的网站配置 SSL 证书，启用 HTTPS。

这里以使用 Let's Encrypt 和 Certbot 为例，提供免费的 SSL 证书。

### 安装 Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### 获取 SSL 证书

运行 Certbot 并按照提示操作，它会自动帮你修改 Nginx 配置文件，启用 HTTPS 并设置 HTTP 到 HTTPS 的重定向：

```bash
sudo certbot --nginx -d download.skstudio.cn
```

### 设置自动续期

Let's Encrypt 证书有效期为90天，需要定期续期。Certbot 通常会帮你设置一个定时任务。

你可以检查或手动添加定时任务：

```bash
sudo crontab -e
# 添加以下行来设置每天中午12点自动续期：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 2. 防火墙配置

配置防火墙可以限制对服务器的访问，只开放必要的端口。

这里以使用 UFW (Uncomplicated Firewall) 为例：

### 启用 UFW 防火墙

```bash
sudo ufw enable
```

### 允许必要的端口

通常需要允许 SSH (22), HTTP (80) 和 HTTPS (443) 端口。

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full' # 'Nginx Full' 包含了 80 和 443 端口
# 如果你没有使用 Nginx，可以单独允许 80 和 443
# sudo ufw allow 80/tcp
# sudo ufw allow 443/tcp
```

### 检查防火墙状态

```bash
sudo ufw status
```

确保输出显示防火墙处于活动状态 (active) 并列出了允许的端口。

## 下一步

完成安全配置后，请参考 [监控和维护指南](monitoring-maintenance.md)。 