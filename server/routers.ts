import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { recognitionRouter } from "./routers/recognition";
import type { Express } from "express";
import multer from "multer";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  recognition: recognitionRouter,
});

export type AppRouter = typeof appRouter;

/**
 * 注册 REST API 路由用于兼容旧的前端代码
 * 前端可以通过 POST /api/recognize 上传图片
 */
export function registerRecognitionAPI(app: Express) {
  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/recognize", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      // 调用 tRPC 路由
      const caller = appRouter.createCaller({ user: null, req, res });
      const result = await caller.recognition.recognize({
        image: req.file.buffer,
        imageName: req.file.originalname,
      });

      res.json(result.data);
    } catch (error) {
      console.error("[API] Recognition error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Recognition failed",
      });
    }
  });
}
