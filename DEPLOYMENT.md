# 部署指南

本文档说明如何部署 Halcon 人数识别系统到生产环境。

## 部署架构

```
┌─────────────────────────────────────────────────────┐
│                   用户浏览器                          │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│                  Nginx 反向代理                      │
│              (负载均衡、静态文件服务)                │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼──────────┐
│  React 前端      │    │  Spring Boot      │
│  (Docker)        │    │  后端 (Docker)    │
└──────────────────┘    └────────┬──────────┘
                                 │
                        ┌────────▼──────────┐
                        │  OpenCV/Halcon    │
                        │  图像处理库       │
                        └───────────────────┘
```

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 或者：
  - Node.js 18+
  - Java 17+
  - Maven 3.6+

## 方案 1：使用 Docker Compose（推荐）

### 1. 准备环境

```bash
# 克隆项目
git clone <repository-url>
cd halcon-person-counter

# 检查 Docker 和 Docker Compose
docker --version
docker-compose --version
```

### 2. 构建镜像

```bash
# 构建所有镜像
docker-compose build

# 或只构建特定服务
docker-compose build backend
docker-compose build frontend
```

### 3. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. 验证部署

```bash
# 检查后端健康状态
curl http://localhost:8080/api/health

# 访问前端应用
open http://localhost:3000
```

### 5. 停止服务

```bash
docker-compose down
```

## 方案 2：本地编译部署

### 后端部署

```bash
cd backend

# 编译项目
mvn clean package

# 运行 JAR 包
java -jar target/person-counter-1.0.0.jar
```

### 前端部署

```bash
cd client

# 安装依赖
pnpm install

# 构建生产版本
pnpm build

# 使用 Nginx 部署
sudo cp -r dist/* /var/www/html/
```

## 方案 3：云服务部署

### 部署到 AWS EC2

```bash
# 1. 启动 EC2 实例（Ubuntu 22.04）
# 2. 连接到实例
ssh -i key.pem ubuntu@instance-ip

# 3. 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. 克隆项目并启动
git clone <repository-url>
cd halcon-person-counter
docker-compose up -d
```

### 部署到 Heroku

```bash
# 1. 安装 Heroku CLI
# 2. 登录
heroku login

# 3. 创建应用
heroku create halcon-person-counter

# 4. 部署
git push heroku main
```

### 部署到 Railway

```bash
# 1. 连接 GitHub 仓库
# 2. 在 Railway 控制面板创建项目
# 3. 选择 Docker Compose 配置
# 4. 自动部署
```

## 配置 Nginx 反向代理

### 安装 Nginx

```bash
sudo apt-get update
sudo apt-get install nginx
```

### 配置文件

编辑 `/etc/nginx/sites-available/halcon`:

```nginx
upstream backend {
    server localhost:8080;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name example.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # 前端静态文件
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 后端 API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 增加超时时间（图像处理可能耗时）
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/halcon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 配置 HTTPS（Let's Encrypt）

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d example.com
```

## 监控和日志

### Docker 日志

```bash
# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 查看最后 100 行日志
docker-compose logs --tail=100 backend
```

### 应用日志

```bash
# 后端日志
tail -f backend/logs/halcon-person-counter.log

# 前端日志（浏览器控制台）
# 打开浏览器开发者工具 (F12) > Console
```

### 性能监控

```bash
# 查看 Docker 资源使用
docker stats

# 查看进程
docker-compose ps
```

## 备份和恢复

### 备份数据

```bash
# 备份 Docker 卷
docker run --rm -v halcon_data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/halcon-backup.tar.gz -C / data

# 备份配置文件
tar czf config-backup.tar.gz backend/src/main/resources/
```

### 恢复数据

```bash
# 恢复 Docker 卷
docker run --rm -v halcon_data:/data -v $(pwd):/backup \
  ubuntu tar xzf /backup/halcon-backup.tar.gz -C /

# 恢复配置文件
tar xzf config-backup.tar.gz
```

## 性能调优

### 后端优化

```yaml
# application.yml
server:
  tomcat:
    threads:
      max: 200
      min-spare: 10
    max-connections: 10000
    
spring:
  servlet:
    multipart:
      max-file-size: 50MB
```

### 前端优化

```bash
# 启用 Gzip 压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### 数据库优化（如果使用）

```bash
# 创建索引
CREATE INDEX idx_image_id ON recognition_results(image_id);
CREATE INDEX idx_created_at ON recognition_results(created_at);
```

## 故障排查

### 后端无法启动

```bash
# 检查日志
docker-compose logs backend

# 检查端口占用
lsof -i :8080

# 检查内存
docker stats
```

### 前端无法加载

```bash
# 检查网络连接
curl http://localhost:3000

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### API 请求超时

```bash
# 增加 Nginx 超时时间
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;

# 增加 Tomcat 超时时间
server.tomcat.connection-timeout=120000
```

## 安全建议

### 1. 启用 HTTPS

```bash
# 使用 Let's Encrypt 获取免费证书
sudo certbot certonly --nginx -d example.com
```

### 2. 配置防火墙

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 设置环境变量

```bash
# 创建 .env 文件
cat > .env << EOF
JAVA_OPTS=-Xmx512m -Xms256m
NODE_ENV=production
EOF
```

### 4. 定期更新

```bash
# 更新 Docker 镜像
docker-compose pull
docker-compose up -d

# 更新系统
sudo apt-get update
sudo apt-get upgrade
```

## 扩展和负载均衡

### 使用 Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker stack deploy -c docker-compose.yml halcon

# 扩展服务
docker service scale halcon_backend=3
```

### 使用 Kubernetes

```bash
# 创建 Deployment
kubectl apply -f k8s/deployment.yaml

# 创建 Service
kubectl apply -f k8s/service.yaml

# 扩展副本
kubectl scale deployment halcon-backend --replicas=3
```

## 检查清单

- [ ] 配置 DNS 记录
- [ ] 获取 SSL 证书
- [ ] 配置 Nginx 反向代理
- [ ] 设置防火墙规则
- [ ] 配置监控和告警
- [ ] 设置备份策略
- [ ] 进行压力测试
- [ ] 文档化部署流程
- [ ] 设置自动化部署（CI/CD）

## 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
- [Spring Boot 部署指南](https://spring.io/guides/gs/spring-boot-docker/)

---

**最后更新**：2026 年 5 月 3 日
