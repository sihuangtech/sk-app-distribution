# API 参考文档

本文档描述了彩旗软件分发平台的主要API接口。

## 认证

所有API请求都需要在请求头中包含JWT令牌：

```
Authorization: Bearer <your_jwt_token>
```

## 版本信息 API

### GET /api/version

获取系统版本信息，包括项目版本、运行环境、启动时间和运行模式。

**请求方式：** GET  
**需要认证：** 是

**响应示例：**
```json
{
  "project": "1.0.0",
  "node": "v24.1.0",
  "react": "19.1.0",
  "express": "4.21.2",
  "typescript": "5.7.2",
  "vite": "6.0.7",
  "startTime": "2024/01/15 10:30:45",
  "mode": "生产模式"
}
```

**响应字段说明：**
- `project`: 项目版本号（从package.json读取）
- `node`: Node.js运行时版本
- `react`: React框架版本
- `express`: Express框架版本
- `typescript`: TypeScript版本
- `vite`: Vite构建工具版本
- `startTime`: 服务启动时间（格式：YYYY/MM/DD HH:mm:ss）
- `mode`: 运行模式（开发模式/生产模式，基于NODE_ENV环境变量）

## 系统设置 API

### GET /api/settings

获取系统配置信息。

**请求方式：** GET  
**需要认证：** 是

### PUT /api/settings

更新系统配置信息。

**请求方式：** PUT  
**需要认证：** 是  
**Content-Type：** application/json

## 文件上传 API

### POST /api/upload

上传文件到指定应用。

**请求方式：** POST  
**需要认证：** 是  
**Content-Type：** multipart/form-data

## 应用管理 API

### GET /api/apps

获取应用列表。

### POST /api/apps

创建新应用。

### DELETE /api/apps/:appId

删除指定应用。

## 文件下载

### GET /download/:filename

下载指定文件。支持速度限制配置。

**请求方式：** GET  
**需要认证：** 否（公开下载链接）

## 错误响应

所有API在出错时都会返回标准的错误响应格式：

```json
{
  "message": "错误描述信息"
}
```

常见HTTP状态码：
- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权（需要登录）
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误 