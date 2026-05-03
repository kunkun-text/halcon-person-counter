#!/usr/bin/env python3
"""
基于 YOLO 的人头检测脚本
使用预训练的 YOLO 模型进行高精度人头检测
"""

import cv2
import sys
import json
import os
from pathlib import Path

def detect_heads_yolo(image_path: str) -> dict:
    """
    使用 YOLO 模型检测图片中的人头
    
    Args:
        image_path: 图片文件路径
        
    Returns:
        包含检测结果的字典
    """
    try:
        # 尝试导入 YOLO
        try:
            from ultralytics import YOLO
        except ImportError:
            # 如果 YOLO 未安装，回退到 Haar 级联分类器
            return detect_heads_haar(image_path)
        
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
        
        # 获取原始图片尺寸
        original_height, original_width = image.shape[:2]
        
        # 加载预训练的 YOLO 模型（person 检测）
        # 使用 yolov8n.pt（纳米版本，最快）
        model_path = os.path.expanduser("~/.cache/yolo/yolov8n.pt")
        
        # 如果模型不存在，下载它
        if not os.path.exists(model_path):
            try:
                model = YOLO("yolov8n.pt")
            except Exception as e:
                # 如果下载失败，使用 Haar 级联分类器
                return detect_heads_haar(image_path)
        else:
            model = YOLO(model_path)
        
        # 运行检测
        # conf=0.05 表示最低的置信度阈值，检测最多人
        # iou=0.3 表示最低的 NMS 阈值，最大化减少重复检测
        results = model(image_path, conf=0.05, iou=0.3, classes=0)  # classes=0 表示只检测 person
        
        # 处理检测结果
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
        
        # 计算平均置信度
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return {
            "totalPeople": total_people,
            "confidence": avg_confidence,
            "detections": detections,
            "processingTime": 0,
            "success": True
        }
        
    except Exception as e:
        # 发生错误时回退到 Haar 级联分类器
        return detect_heads_haar(image_path)


def detect_heads_haar(image_path: str) -> dict:
    """
    使用 Haar 级联分类器检测人头（回退方案）
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
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        
        if not os.path.exists(cascade_path):
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml'
        
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
        
        # 检测人头（人脸）- 调整参数以提高检测率
        detections = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,      # 更小的缩放因子，检测更多人
            minNeighbors=3,        # 降低邻近数阈值
            flags=cv2.CASCADE_SCALE_IMAGE,
            minSize=(20, 20),      # 更小的最小检测大小
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
            "error": "Usage: python detection_yolo.py <image_path>",
            "success": False
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = detect_heads_yolo(image_path)
    print(json.dumps(result))
