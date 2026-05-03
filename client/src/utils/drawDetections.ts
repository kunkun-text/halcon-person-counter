/**
 * 在 Canvas 上绘制人体检测框
 */

interface Detection {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface DrawOptions {
  boxColor?: string;
  boxWidth?: number;
  textColor?: string;
  textSize?: number;
  showId?: boolean;
  showConfidence?: boolean;
}

const DEFAULT_OPTIONS: DrawOptions = {
  boxColor: '#00D9FF', // 青色
  boxWidth: 2,
  textColor: '#00D9FF',
  textSize: 14,
  showId: true,
  showConfidence: true,
};

/**
 * 在图片上绘制检测框
 * @param imageUrl 图片 URL
 * @param detections 检测结果数组
 * @param options 绘制选项
 * @returns 返回包含绘制结果的 Canvas 元素
 */
export async function drawDetectionsOnImage(
  imageUrl: string,
  detections: Detection[],
  options: DrawOptions = {}
): Promise<HTMLCanvasElement> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // 绘制原图
      ctx.drawImage(img, 0, 0);

      // 绘制检测框
      detections.forEach((detection) => {
        // 绘制矩形框
        ctx.strokeStyle = opts.boxColor!;
        ctx.lineWidth = opts.boxWidth!;
        ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);

        // 绘制标签背景
        const label = buildLabel(detection, opts);
        const labelWidth = ctx.measureText(label).width + 10;
        const labelHeight = opts.textSize! + 6;

        ctx.fillStyle = opts.boxColor!;
        ctx.fillRect(
          detection.x,
          Math.max(0, detection.y - labelHeight - 4),
          labelWidth,
          labelHeight
        );

        // 绘制标签文字
        ctx.fillStyle = '#000000';
        ctx.font = `${opts.textSize}px Arial, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(
          label,
          detection.x + 5,
          Math.max(opts.textSize! / 2, detection.y - 8)
        );
      });

      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

/**
 * 将 Canvas 转换为图片 URL
 */
export function canvasToImageUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * 下载带有检测框的图片
 */
export function downloadDetectionImage(
  canvas: HTMLCanvasElement,
  filename: string = 'detection-result.jpg'
): void {
  const link = document.createElement('a');
  link.href = canvasToImageUrl(canvas);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 构建标签文本
 */
function buildLabel(detection: Detection, options: DrawOptions): string {
  const parts: string[] = [];

  if (options.showId) {
    parts.push(`#${detection.id}`);
  }

  if (options.showConfidence) {
    const confidence = (detection.confidence * 100).toFixed(0);
    parts.push(`${confidence}%`);
  }

  return parts.join(' ');
}

/**
 * 获取检测统计信息
 */
export function getDetectionStats(detections: Detection[]) {
  if (detections.length === 0) {
    return {
      totalPeople: 0,
      avgConfidence: 0,
      minConfidence: 0,
      maxConfidence: 0,
    };
  }

  const confidences = detections.map((d) => d.confidence);
  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  return {
    totalPeople: detections.length,
    avgConfidence: parseFloat(avgConfidence.toFixed(3)),
    minConfidence: parseFloat(Math.min(...confidences).toFixed(3)),
    maxConfidence: parseFloat(Math.max(...confidences).toFixed(3)),
  };
}
