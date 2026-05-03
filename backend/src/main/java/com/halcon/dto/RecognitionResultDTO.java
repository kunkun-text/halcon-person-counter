package com.halcon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * 人数识别结果 DTO
 * 
 * 包含：
 * - 检测到的总人数
 * - 平均置信度
 * - 每个检测框的详细信息
 * - 处理耗时
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecognitionResultDTO {
    
    /**
     * 检测到的总人数
     */
    private int totalPeople;
    
    /**
     * 平均置信度（0-1）
     */
    private double confidence;
    
    /**
     * 检测框列表
     */
    private List<DetectionDTO> detections;
    
    /**
     * 处理耗时（秒）
     */
    private double processingTime;
    
    /**
     * 检测框信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetectionDTO {
        
        /**
         * 检测框 ID
         */
        private int id;
        
        /**
         * 左上角 X 坐标
         */
        private int x;
        
        /**
         * 左上角 Y 坐标
         */
        private int y;
        
        /**
         * 检测框宽度
         */
        private int width;
        
        /**
         * 检测框高度
         */
        private int height;
        
        /**
         * 该检测框的置信度（0-1）
         */
        private double confidence;
    }
}
