# Halcon 人数识别系统

一个基于 **Spring Boot** 后端和 **React/Vue** 前端的工业视觉人数识别 Web 应用。该系统支持上传图片，通过 Halcon 或 OpenCV 进行人体检测，并返回识别结果。

## 项目概述

本项目是工业视觉课程设计的完整解决方案，包含以下核心功能：

- **图片上传**：支持拖拽或点击上传，支持常见图片格式（JPG、PNG、BMP 等）
- **人数识别**：使用 Halcon 或 OpenCV 进行人体检测
- **结果展示**：显示检测到的人数、置信度、检测框详情等
- **实时反馈**：提供加载状态、错误提示等用户反馈

## 项目结构

```
halcon-person-counter/
├── client/                          # React 前端项目
│   ├── public/                      # 静态资源
│   ├── src/
│   │   ├── components/              # React 组件
│   │   │   ├── ImageUploader.tsx    # 图片上传组件
│   │   │   └── ResultDisplay.tsx    # 结果展示组件
│   │   ├── pages/
│   │   │   └── Home.tsx             # 主页面
│   │   ├── App.tsx                  # 应用主组件
│   │   ├── main.tsx                 # 应用入口
│   │   └── index.css                # 全局样式
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                         # Spring Boot 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/halcon/
│   │   │   │   ├── PersonCounterApplication.java    # 应用主类
│   │   │   │   ├── controller/
│   │   │   │   │   └── RecognitionController.java   # REST 控制器
│   │   │   │   ├── service/
│   │   │   │   │   ├── RecognitionService.java      # 服务接口
│   │   │   │   │   └── impl/
│   │   │   │   │       └── OpenCVRecognitionService.java  # OpenCV 实现
│   │   │   │   └── dto/
│   │   │   │       ├── RecognitionResultDTO.java    # 结果 DTO
│   │   │   │       └── ApiResponse.java             # API 响应包装
│   │   │   └── resources/
│   │   │       └── application.yml                  # 应用配置
│   │   └── test/                    # 单元测试
│   ├── pom.xml                      # Maven 配置
│   ├── HALCON_INTEGRATION.md        # Halcon 集成指南
│   ├── halcon_person_detection.hdev # Halcon HDevelop 代码
│   └── halcon_recognition.py        # Python Halcon 脚本
│
├── README.md                        # 项目文档
└── ideas.md                         # 设计方案文档
```

## 技术栈

### 前端
- **框架**：React 19 + TypeScript
- **UI 组件**：shadcn/ui + Tailwind CSS 4
- **样式**：深色工业科技主题
- **字体**：Poppins (标题) + Inter (正文)
- **动画**：Framer Motion

### 后端
- **框架**：Spring Boot 3.2.0
- **语言**：Java 17
- **图像处理**：OpenCV 4.8.0（可替换为 Halcon）
- **构建工具**：Maven
- **日志**：SLF4J + Logback

### 可选集成
- **Halcon**：MVTec 工业视觉库（需要许可证）
- **Python**：用于调用 Halcon 脚本

## 快速开始

### 前置要求

- Node.js 18+ 和 pnpm
- Java 17+
- Maven 3.6+
- （可选）Halcon 21.05+

### 前端开发

```bash
cd client

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

前端应用将在 `http://localhost:3000` 启动。

### 后端开发

```bash
cd backend

# 编译项目
mvn clean compile

# 运行单元测试
mvn test

# 启动应用
mvn spring-boot:run

# 构建 JAR 包
mvn clean package
```

后端服务将在 `http://localhost:8080` 启动。

## API 文档

### 人数识别接口

**请求**
```
POST /api/recognize
Content-Type: multipart/form-data

参数：
  - image: 图片文件（必需）
```

**响应**
```json
{
  "totalPeople": 5,
  "confidence": 0.92,
  "detections": [
    {
      "id": 1,
      "x": 100,
      "y": 150,
      "width": 80,
      "height": 200,
      "confidence": 0.95
    }
  ],
  "processingTime": 0.35
}
```

### 健康检查接口

**请求**
```
GET /api/health
```

**响应**
```json
{
  "code": 0,
  "message": "success",
  "data": "Halcon Person Counter Service is running"
}
```

## 设计理念

### 视觉设计

采用**现代工业科技风格**，强调精确性、专业性和可靠性：

- **色彩方案**：深蓝背景 + 青色强调色 + 浅灰文字
- **布局**：非对称设计，左侧上传区 + 右侧结果展示
- **排版**：Poppins Bold 用于标题，Inter Regular 用于正文
- **动画**：流畅的过渡效果和加载动画

### 用户体验

- **即时反馈**：操作立即显示视觉反馈
- **清晰状态**：通过颜色和图标表示加载、成功、错误状态
- **易用性**：支持拖拽上传，减少操作步骤

## Halcon 集成

### 集成方案

项目提供了三种 Halcon 集成方案：

1. **直接调用 Halcon DLL**（Windows）
   - 在 Spring Boot 中直接调用 Halcon Java API
   - 需要 Halcon 许可证和 Windows 环境

2. **通过 Python 脚本调用**（推荐）
   - 在 Spring Boot 中调用 Python 脚本
   - 支持跨平台，灵活性高

3. **使用 OpenCV**（当前实现）
   - 不需要许可证
   - 跨平台支持
   - 精度可能不如 Halcon

### 切换识别引擎

详见 `backend/HALCON_INTEGRATION.md` 文档。

## 配置说明

### 前端配置

编辑 `client/src/index.css` 修改主题色：

```css
:root {
  --primary: oklch(0.623 0.214 259.815);  /* 青色 */
  --background: oklch(0.141 0.005 285.823);  /* 深蓝 */
  --foreground: oklch(0.95 0.01 65);  /* 浅灰 */
}
```

### 后端配置

编辑 `backend/src/main/resources/application.yml` 修改服务器配置：

```yaml
server:
  port: 8080  # 服务器端口
  servlet:
    context-path: /  # 上下文路径

spring:
  servlet:
    multipart:
      max-file-size: 50MB  # 最大上传文件大小
```

## 部署指南

### 前端部署

```bash
cd client
pnpm build

# 使用 Nginx 部署
# 将 dist 目录内容复制到 Nginx 根目录
```

### 后端部署

```bash
cd backend
mvn clean package

# 运行 JAR 包
java -jar target/person-counter-1.0.0.jar

# 或使用 Docker
docker build -t halcon-person-counter .
docker run -p 8080:8080 halcon-person-counter
```

## 测试

### 前端测试

```bash
cd client
pnpm check  # TypeScript 类型检查
```

### 后端测试

```bash
cd backend
mvn test
```

### API 测试

```bash
# 使用 curl
curl -X POST -F "image=@test.jpg" http://localhost:8080/api/recognize

# 使用 Python
import requests
with open('test.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post('http://localhost:8080/api/recognize', files=files)
    print(response.json())
```

## 性能优化

### 前端优化

- 使用 Vite 进行快速构建和 HMR
- 图片懒加载
- 代码分割和动态导入

### 后端优化

- 图像预处理（缩放、裁剪）
- 多线程处理
- 缓存机制
- GPU 加速（如果可用）

## 常见问题

**Q: 如何提高识别精度？**

A: 
- 使用高质量的输入图像
- 调整检测参数（见 `OpenCVRecognitionService`）
- 使用 Halcon 而不是 OpenCV
- 对输入图像进行预处理

**Q: 如何处理大文件上传？**

A: 修改 `application.yml` 中的 `max-file-size` 配置。

**Q: 如何实现实时视频流处理？**

A: 
- 使用 WebSocket 实现实时通信
- 在后端使用多线程处理视频帧
- 实现帧缓冲机制

**Q: 如何获取 Halcon 许可证？**

A: 访问 [MVTec 官方网站](https://www.mvtec.com/products/halcon) 申请许可证。

## 许可证

本项目仅供教学和研究使用。

## 参考资源

- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [React 官方文档](https://react.dev)
- [OpenCV 文档](https://docs.opencv.org)
- [Halcon 官方文档](https://www.mvtec.com/products/halcon)
- [Tailwind CSS 文档](https://tailwindcss.com)

## 支持

如有问题或建议，请提交 Issue 或 Pull Request。

---

**最后更新**：2026 年 5 月 3 日

**版本**：1.0.0
