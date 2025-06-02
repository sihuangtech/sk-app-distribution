# 彩旗软件分发平台 - 部署指南：基础环境准备

本文档介绍在部署彩旗软件分发平台之前所需的服务器基础环境准备工作。

## 服务器要求

- **操作系统**: Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- **Node.js**: 版本 16.0 或更高
- **内存**: 至少 1GB RAM
- **存储**: 至少 10GB 可用空间（根据上传文件大小调整）
- **网络**: 公网 IP 地址

## 安装必要的软件

在服务器上执行以下命令安装必要的工具和软件：

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要的工具 (curl, wget, git, nginx)
sudo apt install -y curl wget git nginx

# 安装 Node.js (使用 NodeSource 仓库，推荐使用最新的 LTS 版本，例如 Node.js 18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

**注意**: 如果你使用的是 CentOS 或其他非 Debian/Ubuntu 系操作系统，请使用对应的包管理器（如 `yum`）来安装软件。

## 下一步

完成基础环境准备后，请继续进行 [项目部署和配置](project-setup.md)。 