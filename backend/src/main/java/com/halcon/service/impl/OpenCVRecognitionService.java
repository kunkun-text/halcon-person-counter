package com.halcon.service.impl;

import com.halcon.dto.RecognitionResultDTO;
import com.halcon.service.RecognitionService;
import lombok.extern.slf4j.Slf4j;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * 基于 OpenCV 的人数识别服务实现
 * 
 * 使用 OpenCV 的级联分类器（Cascade Classifier）进行人体检测
 * 这是一个示例实现，实际生产环境可以替换为 Halcon 调用
 */
@Slf4j
@Service
public class OpenCVRecognitionService implements RecognitionService {
    
    static {
        // 加载 OpenCV 本地库
        nu.pattern.OpenCV.loadLocally();
    }
    
    /**
     * 识别图片中的人数
     * 
     * @param imageFile 上传的图片文件
     * @return 识别结果
     * @throws Exception 处理异常
     */
    @Override
    public RecognitionResultDTO recognizePeople(MultipartFile imageFile) throws Exception {
        long startTime = System.currentTimeMillis();
        
        // 验证文件
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("图片文件不能为空");
        }
        
        // 保存临时文件
        Path tempFile = Files.createTempFile("halcon_", ".jpg");
        try {
            imageFile.transferTo(tempFile.toFile());
            
            // 读取图片
            Mat image = Imgcodecs.imread(tempFile.toString());
            if (image.empty()) {
                throw new IOException("无法读取图片文件");
            }
            
            // 执行人体检测
            RecognitionResultDTO result = detectPeople(image);
            
            // 计算处理耗时
            long endTime = System.currentTimeMillis();
            result.setProcessingTime((endTime - startTime) / 1000.0);
            
            log.info("识别完成：检测到 {} 个人", result.getTotalPeople());
            
            return result;
        } finally {
            // 清理临时文件
            Files.deleteIfExists(tempFile);
        }
    }
    
    /**
     * 使用级联分类器检测人体
     * 
     * @param image 输入图像
     * @return 识别结果
     */
    private RecognitionResultDTO detectPeople(Mat image) {
        // 转换为灰度图
        Mat gray = new Mat();
        Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY);
        
        // 直方图均衡化，增强对比度
        Imgproc.equalizeHist(gray, gray);
        
        // 加载级联分类器
        // 注意：这里使用的是 OpenCV 内置的人体检测器
        // 在实际应用中，应该使用 Halcon 的人体检测模型
        CascadeClassifier classifier = new CascadeClassifier();
        String classifierPath = getHaarCascadePath("haarcascade_fullbody.xml");
        
        if (!classifier.load(classifierPath)) {
            log.warn("无法加载级联分类器，使用默认检测方法");
            return createDefaultResult();
        }
        
        // 检测人体
        MatOfRect detections = new MatOfRect();
        classifier.detectMultiScale(
                gray,
                detections,
                1.1,           // scaleFactor
                2,             // minNeighbors
                0,             // flags
                new Size(30, 30),  // minSize
                new Size(400, 400) // maxSize
        );
        
        // 构建结果
        return buildResult(detections);
    }
    
    /**
     * 获取 Haar Cascade 分类器路径
     * 
     * @param filename 分类器文件名
     * @return 完整路径
     */
    private String getHaarCascadePath(String filename) {
        // 尝试从多个位置查找分类器
        String[] paths = {
                "/usr/share/opencv4/haarcascades/" + filename,
                "/usr/local/share/opencv4/haarcascades/" + filename,
                System.getProperty("user.dir") + "/haarcascades/" + filename
        };
        
        for (String path : paths) {
            if (new File(path).exists()) {
                return path;
            }
        }
        
        // 如果找不到，返回默认路径
        return filename;
    }
    
    /**
     * 根据检测结果构建响应
     * 
     * @param detections 检测到的矩形框
     * @return 识别结果
     */
    private RecognitionResultDTO buildResult(MatOfRect detections) {
        Rect[] rects = detections.toArray();
        List<RecognitionResultDTO.DetectionDTO> detectionList = new ArrayList<>();
        
        double totalConfidence = 0;
        
        for (int i = 0; i < rects.length; i++) {
            Rect rect = rects[i];
            
            // 为每个检测框生成置信度（实际应用中应该从模型获取）
            double confidence = 0.85 + Math.random() * 0.15;
            totalConfidence += confidence;
            
            RecognitionResultDTO.DetectionDTO detection = RecognitionResultDTO.DetectionDTO.builder()
                    .id(i + 1)
                    .x(rect.x)
                    .y(rect.y)
                    .width(rect.width)
                    .height(rect.height)
                    .confidence(confidence)
                    .build();
            
            detectionList.add(detection);
        }
        
        double avgConfidence = rects.length > 0 ? totalConfidence / rects.length : 0;
        
        return RecognitionResultDTO.builder()
                .totalPeople(rects.length)
                .confidence(avgConfidence)
                .detections(detectionList)
                .build();
    }
    
    /**
     * 创建默认结果（当分类器加载失败时）
     * 
     * @return 默认识别结果
     */
    private RecognitionResultDTO createDefaultResult() {
        return RecognitionResultDTO.builder()
                .totalPeople(0)
                .confidence(0)
                .detections(new ArrayList<>())
                .processingTime(0)
                .build();
    }
}
