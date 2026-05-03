import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { saveRecognitionResult, getRecentResults } from "../recognition";
import { storagePut } from "../storage";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 使用 Python OpenCV 进行真实的人体检测
 */
function detectPeopleWithOpenCV(imageBuffer: Buffer): Promise<{
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
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const tempImagePath = join(tmpdir(), `image-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
    
    try {
      // 保存图片到临时文件
      writeFileSync(tempImagePath, imageBuffer);
      
      // 调用 Python 检测脚本
      const pythonProcess = spawn(join(__dirname, "detection_wrapper.sh"), [
        join(__dirname, "detection_advanced.py"),
        tempImagePath
      ]);
      
      let output = "";
      let errorOutput = "";
      
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        try {
          // 清理临时文件
          try {
            unlinkSync(tempImagePath);
          } catch (e) {
            // 忽略删除失败
          }
          
          if (code !== 0) {
            console.error("[Detection] Python error:", errorOutput);
            resolve({
              totalPeople: 0,
              confidence: 0,
              detections: [],
              processingTime: (Date.now() - startTime) / 1000,
            });
            return;
          }
          
          const result = JSON.parse(output);
          result.processingTime = (Date.now() - startTime) / 1000;
          resolve(result);
        } catch (error) {
          console.error("[Detection] Parse error:", error);
          resolve({
            totalPeople: 0,
            confidence: 0,
            detections: [],
            processingTime: (Date.now() - startTime) / 1000,
          });
        }
      });
      
      pythonProcess.on("error", (error) => {
        console.error("[Detection] Process error:", error);
        try {
          unlinkSync(tempImagePath);
        } catch (e) {
          // 忽略删除失败
        }
        resolve({
          totalPeople: 0,
          confidence: 0,
          detections: [],
          processingTime: (Date.now() - startTime) / 1000,
        });
      });
      
      // 设置超时防止进程挂起
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        try {
          unlinkSync(tempImagePath);
        } catch (e) {
          // 忽略删除失败
        }
        resolve({
          totalPeople: 0,
          confidence: 0,
          detections: [],
          processingTime: (Date.now() - startTime) / 1000,
        });
      }, 30000); // 30 秒超时
      
      pythonProcess.on("close", () => {
        clearTimeout(timeout);
      });
    } catch (error) {
      console.error("[Detection] Error:", error, "Script path:", join(__dirname, "detection_yolo.py"));
      try {
        unlinkSync(tempImagePath);
      } catch (e) {
        // 忽略删除失败
      }
      resolve({
        totalPeople: 0,
        confidence: 0,
        detections: [],
        processingTime: (Date.now() - startTime) / 1000,
      });
    }
  });
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
        const recognitionResult = await detectPeopleWithOpenCV(input.image);

        // 2. 上传图片到存储
        const fileKey = `recognition/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        let imageUrl = "";
        try {
          const result = await storagePut(
            fileKey,
            input.image,
            "image/jpeg"
          );
          imageUrl = result.url;
        } catch (error) {
          console.warn("[Recognition] Failed to upload image:", error);
          imageUrl = `file://${fileKey}`; // 备用 URL
        }

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
