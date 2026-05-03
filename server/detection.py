#!/usr/bin/env python3
"""
基于 OpenCV 的人体检测脚本
使用 HOG（Histogram of Oriented Gradients）特征和 SVM 分类器进行人体检测
"""

import cv2
import sys
import json
import base64
from pathlib import Path

def detect_people(image_path: str) -> dict:
    """
    使用 OpenCV 的 HOG 人体检测器检测图片中的人
    
    Args:
        image_path: 图片文件路径
        
    Returns:
        包含检测结果的字典
    """
    try:
        # 读取图片
        image = cv2.imread(image_path)
        if image is None:
            return {
                "error": "无法读取图片文件",
                "totalPeople": 0,
                "confidence": 0,
                "detections": [],
                "processingTime": 0
            }
        
        # 获取原始图片尺寸
        original_height, original_width = image.shape[:2]
        
        # 如果图片太大，缩小以加快处理速度
        max_width = 800
        if original_width > max_width:
            scale = max_width / original_width
            new_width = max_width
            new_height = int(original_height * scale)
            image = cv2.resize(image, (new_width, new_height))
        
        # 初始化 HOG 人体检测器
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        
        # 检测人体
        detections, weights = hog.detectMultiScale(
            image,
            winStride=(8, 8),
            padding=(16, 16),
            scale=1.05,
            useMeanshiftGrouping=True
        )
        
        # 处理检测结果
        total_people = len(detections)
        
        # 计算平均置信度（权重）
        if len(weights) > 0:
            confidence = float(min(1.0, sum(weights) / len(weights)))
        else:
            confidence = 0.0
        
        # 转换检测框坐标
        detection_list = []
        for i, (x, y, w, h) in enumerate(detections):
            # 如果图片被缩放，需要转换回原始尺寸
            if original_width > max_width:
                scale_factor = original_width / image.shape[1]
                x = int(x * scale_factor)
                y = int(y * scale_factor)
                w = int(w * scale_factor)
                h = int(h * scale_factor)
            
            detection_list.append({
                "id": i + 1,
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "confidence": float(weights[i]) if i < len(weights) else 0.8
            })
        
        return {
            "totalPeople": total_people,
            "confidence": confidence,
            "detections": detection_list,
            "processingTime": 0,  # 实际时间由 Node.js 计算
            "success": True
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "totalPeople": 0,
            "confidence": 0,
            "detections": [],
            "processingTime": 0,
            "success": False
        }


def detect_people_from_buffer(image_data: bytes) -> dict:
    """
    从字节数据检测人体
    
    Args:
        image_data: 图片的字节数据
        
    Returns:
        包含检测结果的字典
    """
    try:
        import numpy as np
        
        # 将字节数据转换为 numpy 数组
        nparr = np.frombuffer(image_data, np.uint8)
        
        # 解码图片
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            return {
                "error": "无法解码图片",
                "totalPeople": 0,
                "confidence": 0,
                "detections": [],
                "processingTime": 0,
                "success": False
            }
        
        # 获取原始图片尺寸
        original_height, original_width = image.shape[:2]
        
        # 如果图片太大，缩小以加快处理速度
        max_width = 800
        if original_width > max_width:
            scale = max_width / original_width
            new_width = max_width
            new_height = int(original_height * scale)
            image = cv2.resize(image, (new_width, new_height))
        
        # 初始化 HOG 人体检测器
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        
        # 检测人体
        detections, weights = hog.detectMultiScale(
            image,
            winStride=(8, 8),
            padding=(16, 16),
            scale=1.05,
            useMeanshiftGrouping=True
        )
        
        # 处理检测结果
        total_people = len(detections)
        
        # 计算平均置信度
        if len(weights) > 0:
            confidence = float(min(1.0, sum(weights) / len(weights)))
        else:
            confidence = 0.0
        
        # 转换检测框坐标
        detection_list = []
        for i, (x, y, w, h) in enumerate(detections):
            # 如果图片被缩放，需要转换回原始尺寸
            if original_width > max_width:
                scale_factor = original_width / image.shape[1]
                x = int(x * scale_factor)
                y = int(y * scale_factor)
                w = int(w * scale_factor)
                h = int(h * scale_factor)
            
            detection_list.append({
                "id": i + 1,
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "confidence": float(weights[i]) if i < len(weights) else 0.8
            })
        
        return {
            "totalPeople": total_people,
            "confidence": confidence,
            "detections": detection_list,
            "processingTime": 0,
            "success": True
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "totalPeople": 0,
            "confidence": 0,
            "detections": [],
            "processingTime": 0,
            "success": False
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python detection.py <image_path>",
            "success": False
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = detect_people(image_path)
    print(json.dumps(result))
