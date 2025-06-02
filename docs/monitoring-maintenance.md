# 彩旗软件分发平台 - 部署指南：监控和维护

本文档介绍如何监控彩旗软件分发平台的运行状态以及如何进行应用更新。

## 1. 监控应用状态

### 查看 PM2 进程状态

使用 PM2 可以方便地查看应用进程的运行状态：

```bash
pm2 status
```

### 查看应用日志

如果应用出现问题，可以通过查看 PM2 日志来排查：

```bash
pm2 logs app-distribution # <mark style="background-color: #ADCCFF;">app-distribution 是你在 ecosystem.config.js 中设置的应用名称</mark>
```

你也可以查看更详细的日志，例如最近的100行日志：

```bash
pm2 logs app-distribution --lines 100
```

### 查看 Nginx 日志

Nginx 的访问日志和错误日志也对于排查问题非常有帮助：

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 2. 更新应用

当有新的代码更新时，你需要执行以下步骤来更新部署在服务器上的应用：

```bash
# 进入项目目录
cd /opt/app-distribution # <mark style="background-color: #ADCCFF;">替换为你的项目实际部署路径</mark>

# 拉取最新代码
git pull origin main # <mark style="background-color: #ADCCFF;">如果你的主分支不是 main，请修改</mark>

# 安装新依赖（如果有 package.json 或 package-lock.json 变化）
npm install

# 重新构建前端
npm run build

# 重启 PM2 进程以加载新代码
pm2 restart app-distribution # <mark style="background-color: #ADCCFF;">app-distribution 是你在 ecosystem.config.js 中设置的应用名称</mark>
```

## 3. 回滚应用 (可选)

如果更新后出现问题，你可以回滚到上一个稳定的版本。这通常通过 Git 的 `reset` 或 `checkout` 命令结合 PM2 重启来实现。

例如，回滚到上一个提交：

```bash
cd /opt/app-distribution
git reset --hard HEAD~1
npm install # 如果回滚的提交有依赖变化
npm run build # 如果回滚的提交有前端代码变化
pm2 restart app-distribution
```

## 完成

你已经完成了彩旗软件分发平台的部署、安全配置和基本的监控维护设置。 