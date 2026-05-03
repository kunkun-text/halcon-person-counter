import { recognitionResults, InsertRecognitionResult } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * 保存识别结果到数据库
 */
export async function saveRecognitionResult(
  result: InsertRecognitionResult
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recognition] Cannot save result: database not available");
    return;
  }

  try {
    await db.insert(recognitionResults).values(result);
  } catch (error) {
    console.error("[Recognition] Failed to save result:", error);
    throw error;
  }
}

/**
 * 获取最近的识别结果
 */
export async function getRecentResults(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Recognition] Cannot get results: database not available");
    return [];
  }

  try {
    const results = await db
      .select()
      .from(recognitionResults)
      .orderBy((t) => t.createdAt)
      .limit(limit);
    return results;
  } catch (error) {
    console.error("[Recognition] Failed to get results:", error);
    throw error;
  }
}
