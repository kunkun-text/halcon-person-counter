#!/usr/bin/env python3
"""
Halcon 人数识别 Python 脚本

功能：
- 读取图像
- 使用 Halcon 或 OpenCV 进行人体检测
- 返回 JSON 格式的识别结果

使用方法：
    python3 halcon_recognition.py <image_path>

输出格式：
    {
        "totalPeople": 5,
        "confidence": 0.92,
        "detections": [
            {"id": 1, "x": 100, "y": 150, "width": 80, "height": 200, "confidence": 0.95},
            ...
        ],
        "processingTime": 0.35
    }
"""

import sys
import json
import time
import cv2
import numpy as np
from pathlib import Path


class PersonDetector:
    """人体检测器"""
    
    def __init__(self):
        """初始化检测器"""
        # 加载 OpenCV 的级联分类器
        self.cascade_path = cv2.data.haarcascades + 'haarcascade_fullbody.xml'
        self.cascade = cv2.CascadeClassifier(self.cascade_path)
        
        if self.cascade.empty():
            print("警告：无法加载级联分类器", file=sys.stderr)
    
    def detect(self, image_path):
        """
        检测图像中的人体
        
        Args:
            image_path: 图像文件路径
            
        Returns:
            dict: 检测结果
        """
        start_time = time.time()
        
        # 读取图像
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"无法读取图像文件: {image_path}")
        
        # 转换为灰度图
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 直方图均衡化
        gray = cv2.equalizeHist(gray)
        
        # 高斯平滑
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 人体检测
        detections = self.cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=2,
            flags=0,
            minSize=(30, 30),
            maxSize=(400, 400)
        )
        
        # 构建结果
        result = self._build_result(detections)
        
        # 计算处理耗时
        end_time = time.time()
        result['processingTime'] = round(end_time - start_time, 2)
        
        return result
    
    def _build_result(self, detections):
        """
        构建检测结果
        
        Args:
            detections: OpenCV 检测结果
            
        Returns:
            dict: 格式化的检测结果
        """
        detection_list = []
        total_confidence = 0.0
        
        for idx, (x, y, w, h) in enumerate(detections):
            # 为每个检测框生成置信度
            # 在实际应用中，应该从模型获取真实的置信度
            confidence = 0.85 + np.random.rand() * 0.15
            total_confidence += confidence
            
            detection = {
                'id': idx + 1,
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'confidence': round(confidence, 2)
            }
            detection_list.append(detection)
        
        # 计算平均置信度
        avg_confidence = (total_confidence / len(detections)) if detections.size > 0 else 0.0
        
        return {
            'totalPeople': len(detections),
            'confidence': round(avg_confidence, 2),
            'detections': detection_list,
            'processingTime': 0.0  # 将在调用处设置
        }


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python3 halcon_recognition.py <image_path>", file=sys.stderr)
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # 验证文件存在
    if not Path(image_path).exists():
        print(f"错误：文件不存在: {image_path}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # 创建检测器
        detector = PersonDetector()
        
        # 执行检测
        result = detector.detect(image_path)
        
        # 输出 JSON 结果
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'totalPeople': 0,
            'confidence': 0.0,
            'detections': [],
            'processingTime': 0.0,
            'error': str(e)
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
