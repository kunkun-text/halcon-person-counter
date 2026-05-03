import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import {
  drawDetectionsOnImage,
  canvasToImageUrl,
  downloadDetectionImage,
  getDetectionStats,
} from '@/utils/drawDetections';

interface Detection {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface DetectionViewerProps {
  imageUrl: string;
  detections: Detection[];
  isLoading?: boolean;
}

/**
 * 检测结果查看器
 * 在原图上绘制检测框，显示人体位置和置信度
 */
export default function DetectionViewer({
  imageUrl,
  detections,
  isLoading = false,
}: DetectionViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnImageUrl, setDrawnImageUrl] = useState<string>('');
  const [stats, setStats] = useState({
    totalPeople: 0,
    avgConfidence: 0,
    minConfidence: 0,
    maxConfidence: 0,
  });

  // 绘制检测框
  useEffect(() => {
    if (!imageUrl || detections.length === 0 || isLoading) {
      return;
    }

    const drawDetections = async () => {
      try {
        setIsDrawing(true);
        const canvas = await drawDetectionsOnImage(imageUrl, detections, {
          boxColor: '#00D9FF',
          boxWidth: 2,
          textSize: 14,
          showId: true,
          showConfidence: true,
        });

        // 设置 canvas 到 DOM
        if (canvasRef.current?.parentNode) {
          canvasRef.current.parentNode.replaceChild(canvas, canvasRef.current);
        }

        // 获取图片 URL 用于显示
        const url = canvasToImageUrl(canvas);
        setDrawnImageUrl(url);

        // 计算统计信息
        const detectionStats = getDetectionStats(detections);
        setStats(detectionStats);
      } catch (error) {
        console.error('Failed to draw detections:', error);
      } finally {
        setIsDrawing(false);
      }
    };

    drawDetections();
  }, [imageUrl, detections, isLoading]);

  const handleDownload = () => {
    if (drawnImageUrl) {
      const link = document.createElement('a');
      link.href = drawnImageUrl;
      link.download = `detection-result-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRedraw = async () => {
    if (!imageUrl || detections.length === 0) return;

    try {
      setIsDrawing(true);
      const canvas = await drawDetectionsOnImage(imageUrl, detections, {
        boxColor: '#00D9FF',
        boxWidth: 2,
        textSize: 14,
        showId: true,
        showConfidence: true,
      });

      const url = canvasToImageUrl(canvas);
      setDrawnImageUrl(url);
    } catch (error) {
      console.error('Failed to redraw:', error);
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 检测结果统计 */}
      {detections.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {stats.totalPeople}
            </div>
            <div className="text-xs text-muted-foreground">识别人数</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent">
              {(stats.avgConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">平均置信度</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-accent">
              {(stats.minConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">最低置信度</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-accent">
              {(stats.maxConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">最高置信度</div>
          </div>
        </div>
      )}

      {/* 检测结果图片 */}
      <div className="relative bg-secondary/20 rounded-lg overflow-hidden border border-border/50">
        {isLoading || isDrawing ? (
          <div className="flex items-center justify-center h-96 bg-secondary/30">
            <div className="text-center space-y-2">
              <div className="animate-spin">
                <RefreshCw className="h-8 w-8 text-accent mx-auto" />
              </div>
              <p className="text-sm text-muted-foreground">
                {isLoading ? '识别中...' : '绘制中...'}
              </p>
            </div>
          </div>
        ) : drawnImageUrl ? (
          <img
            src={drawnImageUrl}
            alt="Detection result"
            className="w-full h-auto"
          />
        ) : (
          <div className="flex items-center justify-center h-96 bg-secondary/30">
            <p className="text-sm text-muted-foreground">
              {detections.length === 0 ? '无检测结果' : '加载中...'}
            </p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {detections.length > 0 && drawnImageUrl && (
        <div className="flex gap-2">
          <Button
            onClick={handleRedraw}
            variant="outline"
            size="sm"
            disabled={isDrawing}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重新绘制
          </Button>
          <Button
            onClick={handleDownload}
            size="sm"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            下载结果
          </Button>
        </div>
      )}

      {/* 检测详情 */}
      {detections.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground">
            检测详情 ({detections.length} 个人体)
          </p>
          <div className="space-y-1">
            {detections.map((detection) => (
              <div
                key={detection.id}
                className="text-xs p-2 bg-secondary/30 rounded flex justify-between items-center"
              >
                <span className="text-foreground">
                  人体 #{detection.id}
                </span>
                <span className="text-accent">
                  {(detection.confidence * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
