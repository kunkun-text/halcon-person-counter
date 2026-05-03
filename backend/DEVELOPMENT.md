# Spring Boot 后端开发指南

本文档说明如何开发和部署 Spring Boot 后端服务。

## 项目结构

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/halcon/
│   │   │   ├── PersonCounterApplication.java        # 应用主类
│   │   │   ├── controller/
│   │   │   │   └── RecognitionController.java       # REST 控制器
│   │   │   ├── service/
│   │   │   │   ├── RecognitionService.java          # 服务接口
│   │   │   │   └── impl/
│   │   │   │       └── OpenCVRecognitionService.java # OpenCV 实现
│   │   │   ├── dto/
│   │   │   │   ├── RecognitionResultDTO.java        # 结果 DTO
│   │   │   │   └── ApiResponse.java                 # API 响应包装
│   │   │   └── exception/
│   │   │       └── GlobalExceptionHandler.java      # 全局异常处理
│   │   └── resources/
│   │       └── application.yml                      # 应用配置
│   └── test/
│       └── java/com/halcon/
│           └── RecognitionControllerTest.java       # 控制器测试
├── pom.xml                                          # Maven 配置
├── Dockerfile                                       # Docker 配置
└── DEVELOPMENT.md                                   # 本文件
```

## 环境要求

- Java 17+
- Maven 3.6+
- OpenCV 4.8.0（可选，如果使用 OpenCV 识别）
- Halcon 21.05+（可选，如果使用 Halcon 识别）

## 本地开发

### 1. 克隆项目

```bash
git clone <repository-url>
cd halcon-person-counter/backend
```

### 2. 安装依赖

```bash
mvn clean install
```

### 3. 启动开发服务器

```bash
mvn spring-boot:run
```

应用将在 `http://localhost:8080` 启动。

### 4. 测试 API

```bash
# 健康检查
curl http://localhost:8080/api/health

# 上传图片进行识别
curl -X POST -F "image=@test.jpg" http://localhost:8080/api/recognize
```

## 项目配置

### application.yml

主要配置项：

```yaml
server:
  port: 8080                          # 服务器端口
  servlet:
    context-path: /                   # 上下文路径

spring:
  application:
    name: halcon-person-counter       # 应用名称
  servlet:
    multipart:
      max-file-size: 50MB             # 最大上传文件大小
      max-request-size: 50MB          # 最大请求大小

logging:
  level:
    root: INFO
    com.halcon: DEBUG                 # Halcon 包日志级别
  file:
    name: logs/halcon-person-counter.log  # 日志文件路径
```

## 代码结构说明

### Controller 层

`RecognitionController` 处理 HTTP 请求：

```java
@PostMapping(value = "/recognize")
public ResponseEntity<RecognitionResultDTO> recognize(
        @RequestParam("image") MultipartFile image) {
    // 调用服务进行识别
    RecognitionResultDTO result = recognitionService.recognizePeople(image);
    return ResponseEntity.ok(result);
}
```

### Service 层

`RecognitionService` 定义业务逻辑接口，`OpenCVRecognitionService` 提供具体实现：

```java
@Service
public class OpenCVRecognitionService implements RecognitionService {
    @Override
    public RecognitionResultDTO recognizePeople(MultipartFile imageFile) throws Exception {
        // 图像处理和人体检测逻辑
    }
}
```

### DTO 层

`RecognitionResultDTO` 定义数据传输对象：

```java
@Data
public class RecognitionResultDTO {
    private int totalPeople;           // 检测到的人数
    private double confidence;         // 平均置信度
    private List<DetectionDTO> detections;  // 检测框列表
    private double processingTime;     // 处理耗时
}
```

## 开发工作流

### 1. 添加新的识别算法

如果要添加新的识别算法（例如 Halcon），按以下步骤：

1. 创建新的服务实现类：
   ```java
   @Service
   public class HalconRecognitionService implements RecognitionService {
       @Override
       public RecognitionResultDTO recognizePeople(MultipartFile imageFile) throws Exception {
           // Halcon 识别逻辑
       }
   }
   ```

2. 在 `RecognitionController` 中切换服务：
   ```java
   @Autowired
   private HalconRecognitionService recognitionService;
   ```

### 2. 修改 API 响应格式

编辑 `RecognitionResultDTO` 添加新字段：

```java
@Data
public class RecognitionResultDTO {
    private int totalPeople;
    private double confidence;
    private List<DetectionDTO> detections;
    private double processingTime;
    private String algorithmVersion;  // 新字段
}
```

### 3. 添加错误处理

创建全局异常处理器：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
            IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
    }
}
```

## 测试

### 单元测试

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=RecognitionControllerTest

# 运行特定测试方法
mvn test -Dtest=RecognitionControllerTest#testRecognize
```

### 集成测试

使用 `@SpringBootTest` 进行集成测试：

```java
@SpringBootTest
public class RecognitionControllerTest {
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void testRecognize() throws Exception {
        // 测试代码
    }
}
```

## 构建和打包

### 构建 JAR 包

```bash
mvn clean package
```

生成的 JAR 文件位于 `target/person-counter-1.0.0.jar`。

### 运行 JAR 包

```bash
java -jar target/person-counter-1.0.0.jar
```

### 使用 Maven 插件运行

```bash
mvn spring-boot:run
```

## Docker 部署

### 构建 Docker 镜像

```bash
docker build -t halcon-person-counter:latest .
```

### 运行 Docker 容器

```bash
docker run -p 8080:8080 halcon-person-counter:latest
```

### 使用 Docker Compose

```bash
cd ..
docker-compose up
```

## 性能优化

### 1. 图像预处理

在 `OpenCVRecognitionService` 中优化图像处理：

```java
// 缩放图像以加快处理
Imgproc.resize(image, image, new Size(640, 480));

// 使用多线程处理
ExecutorService executor = Executors.newFixedThreadPool(4);
```

### 2. 缓存机制

使用 Spring Cache 缓存识别结果：

```java
@Cacheable(value = "recognitionCache", key = "#imageHash")
public RecognitionResultDTO recognizePeople(MultipartFile imageFile) {
    // 识别逻辑
}
```

### 3. 异步处理

使用 `@Async` 进行异步处理：

```java
@Async
public CompletableFuture<RecognitionResultDTO> recognizePeopleAsync(
        MultipartFile imageFile) {
    // 异步识别逻辑
}
```

## 日志管理

### 配置日志级别

在 `application.yml` 中配置：

```yaml
logging:
  level:
    root: INFO
    com.halcon: DEBUG
    org.springframework.web: INFO
```

### 查看日志

```bash
# 实时查看日志
tail -f logs/halcon-person-counter.log

# 搜索特定日志
grep "ERROR" logs/halcon-person-counter.log
```

## 常见问题

**Q: 如何修改服务器端口？**

A: 在 `application.yml` 中修改：
```yaml
server:
  port: 9090
```

**Q: 如何增加最大上传文件大小？**

A: 在 `application.yml` 中修改：
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 100MB
```

**Q: 如何启用 HTTPS？**

A: 生成证书并在 `application.yml` 中配置：
```yaml
server:
  ssl:
    key-store: classpath:keystore.p12
    key-store-password: password
    key-store-type: PKCS12
```

**Q: 如何处理 CORS 跨域请求？**

A: 已在 `PersonCounterApplication` 中配置 CORS，允许所有来源的请求。

## 部署检查清单

- [ ] 修改 `application.yml` 中的配置
- [ ] 构建 JAR 包：`mvn clean package`
- [ ] 测试 API：`curl http://localhost:8080/api/health`
- [ ] 检查日志文件
- [ ] 配置防火墙规则
- [ ] 设置反向代理（Nginx）
- [ ] 启用 HTTPS
- [ ] 配置监控和告警

## 参考资源

- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [Spring MVC 文档](https://spring.io/guides/gs/serving-web-content/)
- [Maven 官方文档](https://maven.apache.org/)
- [Docker 官方文档](https://docs.docker.com/)

---

**最后更新**：2026 年 5 月 3 日
