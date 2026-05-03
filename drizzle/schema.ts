import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 人数识别结果表
 * 存储每次图片识别的结果
 */
export const recognitionResults = mysqlTable("recognition_results", {
  id: int("id").autoincrement().primaryKey(),
  // 识别结果
  totalPeople: int("totalPeople").notNull(),
  confidence: float("confidence").notNull(), // 0-1 之间的置信度
  detections: json("detections").notNull(), // 检测框详情 JSON 数组
  processingTime: float("processingTime").notNull(), // 处理耗时（秒）
  // 图片信息
  imageUrl: text("imageUrl").notNull(), // 存储的图片 URL
  imageKey: varchar("imageKey", { length: 255 }).notNull(), // S3 存储 key
  imageName: varchar("imageName", { length: 255 }),
  imageSize: int("imageSize"), // 图片大小（字节）
  // 元数据
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecognitionResult = typeof recognitionResults.$inferSelect;
export type InsertRecognitionResult = typeof recognitionResults.$inferInsert;