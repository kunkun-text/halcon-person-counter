import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { saveRecognitionResult, getRecentResults } from "../recognition";
import { storagePut } from "../storage";

/**
 * 简单的人数识别实现
 * 基于图片分析的模拟识别（实际应用中应使用 OpenCV 或 Halcon）
 */
function detectPeople(imageBuffer: Buffer): {
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
} {
  const startTime = Date.now();

  // 模拟识别逻辑：基于图片大小生成随机检测结果
  // 实际应用中应使用 OpenCV 或 Halcon 进行真实的人体检测
  const imageSize = imageBuffer.length;
  const baseCount = Math.floor(imageSize / 100000); // 每 100KB 大约 1 个人
  const totalPeople = Math.max(1, baseCount + Math.floor(Math.random() * 3));
  const confidence = 0.75 + Math.random() * 0.2; // 75-95% 置信度

  // 生成模拟的检测框
  const detections = Array.from({ length: totalPeople }, (_, i) => ({
    id: i + 1,
    x: Math.floor(Math.random() * 300),
    y: Math.floor(Math.random() * 300),
    width: 50 + Math.floor(Math.random() * 100),
    height: 100 + Math.floor(Math.random() * 150),
    confidence: 0.7 + Math.random() * 0.25,
  }));

  const processingTime = (Date.now() - startTime) / 1000;

  return {
    totalPeople,
    confidence,
    detections,
    processingTime,
  };
}

export const recognitionRouter = router({
  /**
   * 上传图片并进行人数识别
   */
  recognize: publicProcedure
    .input(
      z.object({
        image: z.instanceof(Buffer).describe("图片文件内容"),
        imageName: z.string().optional().describe("图片文件名"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 1. 进行人数识别
        const recognitionResult = detectPeople(input.image);

        // 2. 上传图片到存储
        const fileKey = `recognition/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const { url: imageUrl } = await storagePut(
          fileKey,
          input.image,
          "image/jpeg"
        );

        // 3. 保存结果到数据库
        await saveRecognitionResult({
          totalPeople: recognitionResult.totalPeople,
          confidence: recognitionResult.confidence,
          detections: recognitionResult.detections,
          processingTime: recognitionResult.processingTime,
          imageUrl,
          imageKey: fileKey,
          imageName: input.imageName,
          imageSize: input.image.length,
        });

        // 4. 返回识别结果
        return {
          success: true,
          data: recognitionResult,
        };
      } catch (error) {
        console.error("[Recognition] Error:", error);
        throw new Error(
          error instanceof Error ? error.message : "识别失败，请稍后重试"
        );
      }
    }),

  /**
   * 获取最近的识别结果
   */
  getRecent: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = await getRecentResults(input.limit);
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        console.error("[Recognition] Error getting results:", error);
        throw new Error("获取识别结果失败");
      }
    }),
});
