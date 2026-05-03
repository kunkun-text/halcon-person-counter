#!/usr/bin/env python3
"""
高级人头检测脚本 - 包含图片预处理和多种检测方法
"""

import cv2
import sys
import json
import os
import numpy as np
from pathlib import Path

def preprocess_image(image):
    """
    对图片进行预处理以提高检测效果
    """
    # 1. 直方图均衡化
    if len(image.shape) == 3:
        # 转换为 HSV 色彩空间
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        # 对 V 通道进行直方图均衡化
        hsv[:, :, 2] = cv2.equalizeHist(hsv[:, :, 2])
        image = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    # 2. 对比度增强 (CLAHE)
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    return image

def detect_heads_advanced(image_path: str) -> dict:
    """
    使用高级方法检测人头
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
        
        original_height, original_width = image.shape[:2]
        
        # 首先尝试使用 YOLO
        try:
            from ultralytics import YOLO
            
            # 预处理图片
            processed_image = preprocess_image(image.copy())
            
            # 保存预处理后的图片到临时文件
            temp_path = "/tmp/processed_image.jpg"
            cv2.imwrite(temp_path, processed_image)
            
            # 加载 YOLO 模型
            try:
                model = YOLO("yolov8n.pt")
            except:
                model = YOLO("yolov8n.pt", verbose=False)
            
            # 运行检测（使用非常低的阈值）
            results = model(temp_path, conf=0.05, iou=0.3, classes=0, verbose=False)
            
            detections = []
            total_people = 0
            confidences = []
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    
                    x = int(x1)
                    y = int(y1)
                    width = int(x2 - x1)
                    height = int(y2 - y1)
                    
                    detections.append({
                        "id": total_people + 1,
                        "x": x,
                        "y": y,
                        "width": width,
                        "height": height,
                        "confidence": confidence
                    })
                    
                    confidences.append(confidence)
                    total_people += 1
            
            # 如果 YOLO 检测到了人，返回结果
            if total_people > 0:
                avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
                
                # 清理临时文件
                try:
                    os.remove(temp_path)
                except:
                    pass
                
                return {
                    "totalPeople": total_people,
                    "confidence": avg_confidence,
                    "detections": detections,
                    "processingTime": 0,
                    "success": True
                }
        
        except Exception as e:
            pass
        
        # 如果 YOLO 失败或未安装，使用 Haar 级联分类器
        return detect_heads_haar_advanced(image, original_width, original_height)
        
    except Exception as e:
        return {
            "error": str(e),
            "totalPeople": 0,
            "confidence": 0,
            "detections": [],
            "processingTime": 0,
            "success": False
        }


def detect_heads_haar_advanced(image, original_width, original_height) -> dict:
    """
    使用改进的 Haar 级联分类器检测人头
    """
    try:
        # 预处理图片
        processed_image = preprocess_image(image.copy())
        
        # 转换为灰度图
        gray = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
        
        # 缩放处理
        max_width = 1200
        scale_factor = 1.0
        if original_width > max_width:
            scale_factor = max_width / original_width
            new_width = max_width
            new_height = int(original_height * scale_factor)
            gray = cv2.resize(gray, (new_width, new_height))
        
        # 加载级联分类器
        cascade_paths = [
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
            cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml',
            cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml',
            cv2.data.lbpcascades + 'lbpcascade_frontalface.xml'
        ]
        
        all_detections = []
        
        # 尝试多个级联分类器
        for cascade_path in cascade_paths:
            if not os.path.exists(cascade_path):
                continue
            
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            # 使用不同的参数进行多次检测
            for scale_factor_val in [1.02, 1.05, 1.1]:
                for min_neighbors in [1, 2, 3]:
                    detections = face_cascade.detectMultiScale(
                        gray,
                        scaleFactor=scale_factor_val,
                        minNeighbors=min_neighbors,
                        flags=cv2.CASCADE_SCALE_IMAGE,
                        minSize=(15, 15),
                        maxSize=(int(gray.shape[1] * 0.9), int(gray.shape[0] * 0.9))
                    )
                    
                    all_detections.extend(detections)
        
        # 去重和合并检测结果
        if len(all_detections) > 0:
            all_detections = np.array(all_detections)
            
            # 使用 NMS 去除重叠的检测框
            unique_detections = []
            used = set()
            
            for i, (x1, y1, w1, h1) in enumerate(all_detections):
                if i in used:
                    continue
                
                unique_detections.append((x1, y1, w1, h1))
                used.add(i)
                
                # 标记重叠的检测框
                for j, (x2, y2, w2, h2) in enumerate(all_detections):
                    if j <= i or j in used:
                        continue
                    
                    # 计算 IoU
                    x_overlap = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
                    y_overlap = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
                    overlap_area = x_overlap * y_overlap
                    
                    area1 = w1 * h1
                    area2 = w2 * h2
                    union_area = area1 + area2 - overlap_area
                    
                    iou = overlap_area / union_area if union_area > 0 else 0
                    
                    if iou > 0.3:
                        used.add(j)
            
            total_people = len(unique_detections)
            detection_list = []
            
            for i, (x, y, w, h) in enumerate(unique_detections):
                # 转换回原始尺寸
                if scale_factor < 1.0:
                    x = int(x / scale_factor)
                    y = int(y / scale_factor)
                    w = int(w / scale_factor)
                    h = int(h / scale_factor)
                
                detection_confidence = 0.6 + (min(w, h) / max(original_width, original_height)) * 0.4
                detection_confidence = min(1.0, detection_confidence)
                
                detection_list.append({
                    "id": i + 1,
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h),
                    "confidence": float(detection_confidence)
                })
            
            avg_confidence = min(1.0, total_people * 0.05)
            
            return {
                "totalPeople": total_people,
                "confidence": avg_confidence,
                "detections": detection_list,
                "processingTime": 0,
                "success": True
            }
        
        return {
            "totalPeople": 0,
            "confidence": 0,
            "detections": [],
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
            "error": "Usage: python detection_advanced.py <image_path>",
            "success": False
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = detect_heads_advanced(image_path)
    print(json.dumps(result))
