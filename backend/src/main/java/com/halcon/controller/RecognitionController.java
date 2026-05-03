package com.halcon.controller;

import com.halcon.dto.ApiResponse;
import com.halcon.dto.RecognitionResultDTO;
import com.halcon.service.RecognitionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 人数识别 REST 控制器
 * 
 * 提供以下端点：
 * - POST /api/recognize - 上传图片并进行人数识别
 */
@Slf4j
@RestController
@RequestMapping("/api")
public class RecognitionController {
    
    @Autowired
    private RecognitionService recognitionService;
    
    /**
     * 上传图片并进行人数识别
     * 
     * @param image 上传的图片文件
     * @return 识别结果
     */
    @PostMapping(value = "/recognize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecognitionResultDTO> recognize(
            @RequestParam("image") MultipartFile image) {
        
        try {
            log.info("接收到图片识别请求，文件名: {}, 大小: {} bytes",
                    image.getOriginalFilename(), image.getSize());
            
            // 验证文件
            if (image.isEmpty()) {
                log.warn("上传的文件为空");
                throw new IllegalArgumentException("图片文件不能为空");
            }
            
            // 验证文件类型
            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.warn("上传的文件不是图片类型: {}", contentType);
                throw new IllegalArgumentException("请上传有效的图片文件");
            }
            
            // 调用识别服务
            RecognitionResultDTO result = recognitionService.recognizePeople(image);
            
            log.info("识别完成，检测到 {} 个人，平均置信度: {:.2f}%",
                    result.getTotalPeople(), result.getConfidence() * 100);
            
            return ResponseEntity.ok(result);
            
        } catch (IllegalArgumentException e) {
            log.error("参数验证失败: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("识别过程中出错", e);
            throw new RuntimeException("识别失败: " + e.getMessage());
        }
    }
    
    /**
     * 健康检查端点
     * 
     * @return 健康状态
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(
                ApiResponse.success("Halcon Person Counter Service is running")
        );
    }
}
