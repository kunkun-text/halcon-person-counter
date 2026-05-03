# Halcon 集成指南

本文档说明如何将 Halcon 人数识别算法集成到 Spring Boot 后端。

## 方案概述

有两种主要的集成方案：

### 方案 1：直接调用 Halcon DLL（Windows）

如果你在 Windows 环境下运行 Spring Boot，可以直接调用 Halcon 的 Java API。

**步骤：**

1. **安装 Halcon**
   - 从官方网站下载并安装 Halcon（需要许可证）
   - 记录安装路径，例如 `C:\Program Files\MVTec\HALCON-21.05`

2. **配置 Java 环境**
   - 将 Halcon JAR 文件添加到项目中：
     ```
     <dependency>
         <groupId>com.mvtec</groupId>
         <artifactId>halcon</artifactId>
         <version>21.05</version>
         <scope>system</scope>
         <systemPath>C:\Program Files\MVTec\HALCON-21.05\lib\halcon.jar</systemPath>
     </dependency>
     ```

3. **创建 Halcon 识别服务**
   ```java
   @Service
   public class HalconRecognitionService implements RecognitionService {
       
       static {
           // 加载 Halcon 本地库
           System.loadLibrary("halconcpp");
       }
       
       @Override
       public RecognitionResultDTO recognizePeople(MultipartFile imageFile) throws Exception {
           // 使用 Halcon API 进行人数识别
           // 示例代码见下方
       }
   }
   ```

4. **Halcon HDevelop 代码示例**
   ```halcon
   read_image(Image, 'image.jpg')
   get_image_size(Image, Width, Height)
   
   * 转换为灰度图
   convert_image_type(Image, ImageGray, 'int1')
   
   * 人体检测（使用预训练模型）
   create_trained_classifier('person_detector.tfc', ClassifierHandle)
   classify_image_class_trobj(Image, ClassifierHandle, 0.5, Detections)
   
   * 提取检测结果
   get_region_contour(Detections, Contours)
   count_obj(Detections, NumPeople)
   ```

### 方案 2：通过 Python 脚本调用 Halcon（推荐）

如果你在 Linux/Mac 或不想直接依赖 Halcon DLL，可以通过 Python 脚本调用 Halcon。

**步骤：**

1. **安装 Halcon 和 Python 支持**
   ```bash
   # 在 Linux 上
   sudo apt-get install halcon
   pip install halcon
   ```

2. **创建 Python 脚本** (`halcon_recognition.py`)
   ```python
   import sys
   import json
   from halcon import *
   
   def recognize_people(image_path):
       """使用 Halcon 识别图片中的人数"""
       
       # 读取图像
       image = read_image(image_path)
       
       # 获取图像大小
       width, height = get_image_size(image)
       
       # 转换为灰度图
       gray = convert_image_type(image, 'int1')
       
       # 人体检测
       detections = detect_people(gray)
       
       # 构建结果
       result = {
           'totalPeople': len(detections),
           'confidence': calculate_confidence(detections),
           'detections': detections,
           'processingTime': 0.0
       }
       
       return result
   
   if __name__ == '__main__':
       image_path = sys.argv[1]
       result = recognize_people(image_path)
       print(json.dumps(result))
   ```

3. **在 Spring Boot 中调用 Python 脚本**
   ```java
   @Service
   public class PythonHalconRecognitionService implements RecognitionService {
       
       @Override
       public RecognitionResultDTO recognizePeople(MultipartFile imageFile) throws Exception {
           // 保存临时文件
           Path tempFile = Files.createTempFile("halcon_", ".jpg");
           imageFile.transferTo(tempFile.toFile());
           
           try {
               // 调用 Python 脚本
               ProcessBuilder pb = new ProcessBuilder(
                   "python3", 
                   "/path/to/halcon_recognition.py",
                   tempFile.toString()
               );
               
               Process process = pb.start();
               BufferedReader reader = new BufferedReader(
                   new InputStreamReader(process.getInputStream())
               );
               
               String output = reader.readLine();
               ObjectMapper mapper = new ObjectMapper();
               RecognitionResultDTO result = mapper.readValue(
                   output, 
                   RecognitionResultDTO.class
               );
               
               return result;
           } finally {
               Files.deleteIfExists(tempFile);
           }
       }
   }
   ```

### 方案 3：使用 OpenCV（当前实现）

当前的 `OpenCVRecognitionService` 使用 OpenCV 进行人体检测。这是一个轻量级的解决方案，不需要 Halcon 许可证。

**优点：**
- 不需要 Halcon 许可证
- 跨平台支持（Windows、Linux、Mac）
- 集成简单

**缺点：**
- 识别精度可能不如 Halcon
- 需要调整参数以获得最佳效果

## 切换识别引擎

要切换识别引擎，只需修改 `RecognitionController` 中的 `@Autowired` 注入：

```java
// 使用 OpenCV
@Autowired
private OpenCVRecognitionService recognitionService;

// 或使用 Halcon
@Autowired
private HalconRecognitionService recognitionService;
```

## Halcon 人体检测算法建议

1. **使用预训练模型**
   - Halcon 提供了预训练的人体检测模型
   - 模型文件通常位于 Halcon 安装目录的 `models` 文件夹

2. **参数调整**
   ```halcon
   * 调整检测灵敏度
   set_system('classification_confidence_threshold', 0.5)
   
   * 调整最小检测框大小
   set_system('min_object_size', 30)
   ```

3. **性能优化**
   - 对图像进行预处理（缩放、裁剪）
   - 使用 GPU 加速（如果可用）
   - 实现多线程处理

## 测试 API

```bash
# 使用 curl 测试
curl -X POST -F "image=@test.jpg" http://localhost:8080/api/recognize

# 使用 Python requests
import requests
with open('test.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post('http://localhost:8080/api/recognize', files=files)
    print(response.json())
```

## 常见问题

**Q: 如何获取 Halcon 许可证？**
A: 访问 MVTec 官方网站申请许可证。学生和教育机构可能有特殊优惠。

**Q: 如何提高识别精度？**
A: 
- 使用高质量的训练数据
- 调整检测参数
- 对输入图像进行预处理
- 使用集成学习方法

**Q: 如何处理实时视频流？**
A: 
- 使用 WebSocket 实现实时通信
- 在后端使用多线程处理视频帧
- 实现帧缓冲机制

## 参考资源

- [Halcon 官方文档](https://www.mvtec.com/products/halcon)
- [OpenCV 人体检测](https://docs.opencv.org/master/d5/d07/tutorial_cascade_classifier.html)
- [Spring Boot 文件上传](https://spring.io/guides/gs/uploading-files/)
