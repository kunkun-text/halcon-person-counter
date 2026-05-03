package com.halcon.service;

import com.halcon.dto.RecognitionResultDTO;
import org.springframework.web.multipart.MultipartFile;

/**
 * 图片识别服务接口
 * 
 * 定义人数识别的核心业务逻辑
 */
public interface RecognitionService {
    
    /**
     * 识别图片中的人数
     * 
     * @param imageFile 上传的图片文件
     * @return 识别结果，包含人数、置信度、检测框等信息
     * @throws Exception 识别过程中的异常
     */
    RecognitionResultDTO recognizePeople(MultipartFile imageFile) throws Exception;
}
