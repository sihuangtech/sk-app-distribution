# SK Software Distribution & Download Platform

<div align="center">

**[简体中文版本](README_zh-CN.md)**

</div>

This is a modern web technology stack-based software distribution platform that provides developers with convenient application package upload, management, and distribution services. The platform supports multi-OS and architecture installer package management, provides secure user authentication and file downloads, and features flexible configuration management and file categorization filtering.

## 🌐 Deployment Options

### 🏠 Self-Hosted Version (Current)
This is the open-source self-hosted version that you can deploy on your own server. Perfect for users who have their own infrastructure and want full control over their data and deployment.

### ☁️ Official Cloud-Hosted Version (Provided by SK Studio)
Don't have your own server or want to use it directly? We offer an official cloud-hosted version managed by SK Studio! 

**Get Started:** [Register and Purchase Official Service](https://dist.skstudio.cn)

**Why Choose Our Official Cloud Service:**
- ✅ **Managed by SK Studio** - Officially operated and maintained
- ✅ **Zero Configuration** - No server setup required, ready to use
- ✅ **Professional Support** - Direct technical support from our team
- ✅ **Always Updated** - Latest features and security updates
- ✅ **Reliable Infrastructure** - Enterprise-grade hosting environment

**Contact Us:**
- **Email:** contact@skstudio.cn
- **QQ Group:** [Click here to join QQ Group](https://qm.qq.com/q/KSyXDRdYQI)
- **Discord Server:** [Click here to join Discord](https://discord.gg/thWGWq7CwA)

## Technology Stack

### Backend Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript superset
- **Multer** - File upload middleware
- **jsonwebtoken** - JWT authentication
- **js-yaml** - YAML configuration file parsing
- **CORS** - Cross-origin resource sharing support
- **stream-throttle** - Download speed limiting

### Frontend Technologies
- **React** - User interface library
- **TypeScript** - Type-safe development
- **React Router** - Single-page application routing
- **Vite** - Modern build tool and development server
- **CSS3** - Modern styling design

### Development Tools
- **ES6 Modules** - Modern module system
- **PM2** - Production environment process management
- **Nginx** - Reverse proxy and static file service

## Core Features

- 🔐 **JWT Authentication** - Secure user login and session management
- 📁 **Application Management** - Create, view, and manage application projects
- ⬆️ **File Upload** - Support multiple formats and platform architecture installer uploads with upload limit configuration
- 📋 **File List** - View, search, and filter uploaded files
- 🔗 **Download Links** - Auto-generate clean and secure download links with download speed limiting support
- 🎨 **Modern UI** - Responsive design supporting multi-device access with friendly operation interface
- ⚙️ **Configuration Deployment** - Unified configuration management through YAML files with online system settings modification
- 🚀 **Production Ready** - Support PM2 and Nginx production deployment with optimized performance and stability
- ✨ **File Categorization Filtering** - Multi-dimensional filtering by application, OS, architecture, and version type
- 🛠️ **System Settings Management** - Dynamic configuration of website information, upload and download limits through web interface
- 📊 **Version Information Monitoring** - Real-time display of project version, runtime environment, startup time, and operation mode

## Project Structure

- `server.ts`: Backend Express server handling file uploads, downloads, and API requests
- `index.html`: Frontend application entry file
- `src/main.tsx`: React application main entry
- `src/App.tsx`: Main application interface and routing configuration React component
- `src/components/`: Directory containing various reusable React components
- `src/pages/`: Directory containing main page components
- `src/routes/`: Backend Express route handler functions directory
- `src/utils/`: Utility functions directory containing configuration reading, event bus, etc.
- `src/styles/`: Styles files directory
- `uploads/`: Uploaded files will be stored in this directory
- `data/`: Stores application information (`apps.json`) and file metadata (`file-metadata.json`)
- `config.yaml`: **Configuration file containing server port, admin account, website info, upload and download limits (must be configured)**
- `vite.config.ts`: Vite configuration file for frontend building and development server
- `docs/`: Deployment documentation directory containing detailed deployment guides

## Development Environment Setup

Please ensure you have Node.js and npm installed.

## Install Dependencies

Run the following command in the project root directory to install all dependencies:

```bash
npm install
```

## Configuration Setup

Before running the project, please copy from `config.yaml.example` to `config.yaml`, then configure the `config.yaml` file. All system configurations are managed in this file:

```yaml
# Server port configuration
server:
  backend_port: 4009
  frontend_port: 3009
  frontend_url: https://your-domain.com  # Frontend access URL for generating download links, etc.
  backend_url: https://your-domain.com  # Backend API access URL for frontend API requests

# Website information configuration
website:
  domain: https://your-domain.com # Website domain for generating complete download links
  title: ColorFlag Distribution Platform # Website title
  description: Provides developers with convenient application package upload, management, and distribution services # Website description

# File upload limit configuration
upload:
  max_file_size: 5120 # Maximum file size in MB
  allowed_extensions:
    - .exe
    - .msi
    - .dmg
    - .pkg
    - .deb
    - .rpm
    - .appimage
    - .apk
    - .ipa
    - .hap
    - .zip
    - .tar.gz
    - .7z
  max_files_per_app: 10000 # Maximum file count allowed per application

# File download configuration
download:
  speed_limit_kbps: 0 # Download speed limit in KB/s, 0 means no limit

# Admin account configuration
admin:
  username: your_admin_username # Please replace with your admin username
  password: your_admin_password # Please replace with your admin password
  sessionDuration: 30 # Login validity period in days

# JWT authentication configuration
jwt:
  secret: your_jwt_secret_key_here # Please replace with your JWT key, be sure to change to a complex and secure string!

# Geolocation configuration
geolocation:
  enabled: true # Whether to enable IP geolocation query function
  api_provider: ipapi # Geolocation API provider: ipapi, ipstack, ipgeolocation, ip2location
  api_key: '' # API key (ipapi is free, no key needed, others require)
  cache_duration: 86400 # Geolocation cache duration in seconds (default 24 hours, i.e., 86400 seconds)
```

**⚠️ Important: Before running the project, you must configure the `config.yaml` file. All critical configurations (including ports, admin account, JWT key) are managed in this file.**

**Important Notes**:
- ✅ **Frontend and backend ports are completely read from the `config.yaml` file, no hard-coded ports in code**
- ✅ **Frontend automatically forwards API requests to backend port through Vite proxy**
- ✅ **Production and development environments use relative paths uniformly**
- ✅ **Modify configuration by updating config file or through settings page, no code changes needed**
- ❌ **If config file is missing, format is wrong, or critical configuration items are missing, server will refuse to start**

## Run Project

Recommend using the following command to start both backend server and frontend development server:

```bash
npm run dev
```

This will start both backend server and frontend application, ports are read from configuration file.

You can also start backend or frontend separately:

1.  **Start backend server:**

```bash
npm start
```

2.  **Start frontend development server:**

```bash
npm run frontend-dev
```

## Feature Description

- **User Login:** Developers need to use the admin account configured in `config.yaml` to login to use the platform. Session validity period is configured days (default 30 days).
- **Application Management:** Can create, view, and manage applications, each application can upload multiple version installer packages.
- **File Upload:** After login, can select application and upload installer packages through upload page. Support configuring max file size, allowed extensions, and max files per application through settings page.
- **File Management:** In "Uploaded Applications" page view, search, and multi-dimensional filter uploaded files by application, OS, architecture, version type. Support copy download links and delete files.
- **File Download:** Provide clean download links, support configuring download speed limit (in MB/s) through settings page.
- **Download Statistics:** Detailed download statistics including file download count, download history, IP geolocation display, etc. Support multi-dimensional filtering by time, file type, etc.
- **Geolocation:** Optional IP geolocation display function, support multiple API providers (IP-API, IPStack, IPGeolocation), intelligent caching reduces API calls.
- **System Settings:** Provide web interface `/settings`, admin can dynamically view and modify website information, file upload limits, download speed limits, and geolocation configuration after login. Configuration changes take effect immediately.
- **Version Information:** Display detailed system version information at bottom of settings page, including project version, Node.js version, frontend/backend framework versions, service startup time, and operation mode (development/production), displayed in 2x4 layout.
- **Dynamic Configuration:** Frontend and backend implement dynamic configuration by reading `config.yaml`, no hard-coding needed.

## Page Navigation

- **/upload**: File upload interface, support creating new applications and selecting existing applications for file upload
- **/apps**: Application management page, view and manage application list
- **/stats**: Download statistics page, view download statistics overview, file statistics, and download history (login required)
- **/settings**: System settings page, manage website, upload, download, and geolocation configuration (login required)
- **/list**: Uploaded files list page, view, filter, and manage files (merged into /apps page)

## Application Management

### Create New Application
1. Click "New Application" button on upload page or application management page
2. Fill in application information:
   - **Application Name**: Used for internal identification, can only contain letters, numbers, underscores, and hyphens
   - **Display Name**: Application name visible to users
   - **Application Description**: Optional, brief description of application functionality
3. Click "Create Application" to complete creation

### Application Data Storage
- Application information stored in `data/apps.json` file
- Support application CRUD operations
- Each application contains unique ID, name, display name, description, and creation time
- File metadata stored in `data/file-metadata.json` file, containing original filename, system filename, belonging application, platform information, upload time, etc.

## Notes

- Please ensure using strong passwords in production environment and change regularly.
- Recommend using HTTPS protocol in production environment.
- **All critical configurations are managed in `config.yaml` or modified through settings page.**

## Project Deployment

For detailed deployment guide, please refer to: [Deployment Documentation](docs/deployment.md)