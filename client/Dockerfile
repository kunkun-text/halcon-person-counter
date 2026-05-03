# 构建阶段
FROM node:22-alpine AS builder

WORKDIR /build

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# 运行阶段
FROM node:22-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制构建好的应用
COPY --from=builder /build/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "start"]
