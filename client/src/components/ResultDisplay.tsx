import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface ResultDisplayProps {
  imagePreview: string;
  result?: RecognitionResult;
  isLoading?: boolean;
  error?: string;
}

export default function ResultDisplay({
  imagePreview,
  result,
  isLoading,
  error,
}: ResultDisplayProps) {
  return (
    <div className="w-full space-y-4">
      {/* 图片预览 */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">图片预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg overflow-hidden bg-black/20">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="预览"
                className="w-full h-auto max-h-96 object-contain"
              />
            )}
            {!imagePreview && !isLoading && (
              <div className="w-full h-96 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">还未上传图片</p>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-2" />
                  <p className="text-sm text-foreground">识别中...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 结果展示 */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">识别失败</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !isLoading && (
        <div className="space-y-4">
          {/* 人数统计 */}
          <Card className="border-accent/30 bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                识别结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-accent/10 p-4">
                  <p className="text-sm text-muted-foreground mb-1">检测人数</p>
                  <p className="text-3xl font-bold text-accent">
                    {result.totalPeople}
                  </p>
                </div>
                <div className="rounded-lg bg-accent/10 p-4">
                  <p className="text-sm text-muted-foreground mb-1">平均置信度</p>
                  <p className="text-3xl font-bold text-accent">
                    {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 处理信息 */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">处理耗时</span>
                  <span className="font-medium text-foreground">
                    {result.processingTime.toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">检测框数</span>
                  <span className="font-medium text-foreground">
                    {result.detections.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 详细检测信息 */}
          {result.detections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">检测详情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {result.detections.map((detection) => (
                    <div
                      key={detection.id}
                      className="flex justify-between items-center p-2 rounded bg-secondary/50 text-sm"
                    >
                      <span className="text-muted-foreground">
                        检测 #{detection.id}
                      </span>
                      <span className="text-accent font-medium">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!result && !isLoading && !error && (
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground text-sm">
              上传图片后，识别结果将显示在此
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
