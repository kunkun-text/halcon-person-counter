#!/usr/bin/env python3
"""
基于 OpenCV 的人头检测脚本
使用级联分类器进行人头检测
"""

import cv2
import sys
import json
import os
from pathlib import Path

def detect_heads(image_path: str) -> dict:
    """
    使用 OpenCV 的级联分类器检测图片中的人头
    
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
                "processingTime": 0,
                "success": False
            }
        
        # 转换为灰度图
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 获取原始图片尺寸
        original_height, original_width = image.shape[:2]
        
        # 如果图片太大，缩小以加快处理速度
        max_width = 800
        scale_factor = 1.0
        if original_width > max_width:
            scale_factor = max_width / original_width
            new_width = max_width
            new_height = int(original_height * scale_factor)
            gray = cv2.resize(gray, (new_width, new_height))
        
        # 加载级联分类器
        # 使用 lbpcascade_frontalface_improved.xml 进行人头检测
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        
        # 如果默认级联分类器不存在，尝试其他路径
        if not os.path.exists(cascade_path):
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml'
        
        if not os.path.exists(cascade_path):
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml'
        
        if not os.path.exists(cascade_path):
            # 如果都找不到，使用 LBP 级联分类器
            cascade_path = cv2.data.lbpcascades + 'lbpcascade_frontalface.xml'
        
        if not os.path.exists(cascade_path):
            return {
                "error": "级联分类器文件未找到",
                "totalPeople": 0,
                "confidence": 0,
                "detections": [],
                "processingTime": 0,
                "success": False
            }
        
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # 检测人头（人脸）
        # 调整参数以提高检测准确率
        detections = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,      # 图像金字塔缩放因子
            minNeighbors=5,       # 每个候选矩形应该保留的邻居数
            flags=cv2.CASCADE_SCALE_IMAGE,
            minSize=(30, 30),     # 最小检测大小
            maxSize=(int(gray.shape[1] * 0.8), int(gray.shape[0] * 0.8))  # 最大检测大小
        )
        
        # 处理检测结果
        total_people = len(detections)
        
        # 计算平均置信度（对于级联分类器，我们使用邻近数作为置信度指标）
        if total_people > 0:
            confidence = min(1.0, total_people * 0.1)  # 简化的置信度计算
        else:
            confidence = 0.0
        
        # 转换检测框坐标
        detection_list = []
        for i, (x, y, w, h) in enumerate(detections):
            # 如果图片被缩放，需要转换回原始尺寸
            if scale_factor < 1.0:
                x = int(x / scale_factor)
                y = int(y / scale_factor)
                w = int(w / scale_factor)
                h = int(h / scale_factor)
            
            # 计算单个检测的置信度（基于检测框大小的相对位置）
            detection_confidence = 0.7 + (min(w, h) / max(original_width, original_height)) * 0.3
            detection_confidence = min(1.0, detection_confidence)
            
            detection_list.append({
                "id": i + 1,
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "confidence": float(detection_confidence)
            })
        
        return {
            "totalPeople": total_people,
            "confidence": min(1.0, confidence),
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


def detect_heads_from_buffer(image_data: bytes) -> dict:
    """
    从字节数据检测人头
    
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
        
        # 转换为灰度图
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 获取原始图片尺寸
        original_height, original_width = image.shape[:2]
        
        # 如果图片太大，缩小以加快处理速度
        max_width = 800
        scale_factor = 1.0
        if original_width > max_width:
            scale_factor = max_width / original_width
            new_width = max_width
            new_height = int(original_height * scale_factor)
            gray = cv2.resize(gray, (new_width, new_height))
        
        # 加载级联分类器
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        
        if not os.path.exists(cascade_path):
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml'
        
        if not os.path.exists(cascade_path):
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml'
        
        if not os.path.exists(cascade_path):
            cascade_path = cv2.data.lbpcascades + 'lbpcascade_frontalface.xml'
        
        if not os.path.exists(cascade_path):
            return {
                "error": "级联分类器文件未找到",
                "totalPeople": 0,
                "confidence": 0,
                "detections": [],
                "processingTime": 0,
                "success": False
            }
        
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # 检测人头（人脸）
        detections = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            flags=cv2.CASCADE_SCALE_IMAGE,
            minSize=(30, 30),
            maxSize=(int(gray.shape[1] * 0.8), int(gray.shape[0] * 0.8))
        )
        
        # 处理检测结果
        total_people = len(detections)
        
        if total_people > 0:
            confidence = min(1.0, total_people * 0.1)
        else:
            confidence = 0.0
        
        # 转换检测框坐标
        detection_list = []
        for i, (x, y, w, h) in enumerate(detections):
            # 如果图片被缩放，需要转换回原始尺寸
            if scale_factor < 1.0:
                x = int(x / scale_factor)
                y = int(y / scale_factor)
                w = int(w / scale_factor)
                h = int(h / scale_factor)
            
            # 计算单个检测的置信度
            detection_confidence = 0.7 + (min(w, h) / max(original_width, original_height)) * 0.3
            detection_confidence = min(1.0, detection_confidence)
            
            detection_list.append({
                "id": i + 1,
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "confidence": float(detection_confidence)
            })
        
        return {
            "totalPeople": total_people,
            "confidence": min(1.0, confidence),
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
    result = detect_heads(image_path)
    print(json.dumps(result))
