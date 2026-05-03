import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ImageUploader from '@/components/ImageUploader';
import ResultDisplay from '@/components/ResultDisplay';
import { RotateCcw } from 'lucide-react';

interface RecognitionResult {
  totalPeople: number;
  confidence: number;
  detections: Array<{
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
  processingTime: number;
}

/**
 * 工业视觉人数识别系统主页面
 * 
 * 设计理念：现代工业科技风格
 * - 深色主题（深蓝背景）
 * - 青色强调色突出交互
 * - 左右布局：上传区 + 结果展示
 * - 流畅动画和即时反馈
 */
export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [result, setResult] = useState<RecognitionResult | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleImageSelect = (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    setResult(undefined);
    setError('');
  };

  const handleRecognize = async () => {
    if (!imageFile) {
      setError('请先选择图片');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      // 调用后端 API
      const response = await fetch('/api/recognize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '识别失败');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '识别过程中出错，请稍后重试'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview('');
    setResult(undefined);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          style={{ animation: 'float 8s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          style={{ animation: 'float 10s ease-in-out infinite reverse' }}
        />
      </div>

      {/* 主内容 */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Halcon 人数识别系统
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  基于工业视觉的智能人数检测
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>工业视觉课程设计</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：上传区域 */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  上传图片
                </h2>
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  isLoading={isLoading}
                />
              </div>

              {/* 操作按钮 */}
              {imagePreview && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleRecognize}
                    disabled={isLoading}
                    className="flex-1"
                    size="lg"
                  >
                    {isLoading ? '识别中...' : '开始识别'}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={isLoading}
                    size="lg"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* 说明信息 */}
              <div className="rounded-lg bg-secondary/30 p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">使用说明</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>支持 JPG、PNG、BMP 等常见图片格式</li>
                  <li>建议图片分辨率不低于 640×480</li>
                  <li>图片中人物越清晰，识别效果越好</li>
                  <li>识别结果包含人数和置信度信息</li>
                </ul>
              </div>
            </div>

            {/* 右侧：结果展示 */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                识别结果
              </h2>
              <ResultDisplay
                imagePreview={imagePreview}
                result={result}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-background/50 mt-16">
          <div className="container py-6 text-center text-xs text-muted-foreground">
            <p>
              © 2026 Halcon 人数识别系统 | 基于 React + Spring Boot + Halcon
            </p>
          </div>
        </footer>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
      `}</style>
    </div>
  );
}
