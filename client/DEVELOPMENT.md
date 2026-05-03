# React 前端开发指南

本文档说明如何开发和部署 React 前端应用。

## 项目结构

```
client/
├── public/                          # 静态资源
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/                  # React 组件
│   │   ├── ui/                      # shadcn/ui 组件
│   │   ├── ImageUploader.tsx        # 图片上传组件
│   │   ├── ResultDisplay.tsx        # 结果展示组件
│   │   └── ErrorBoundary.tsx        # 错误边界
│   ├── pages/                       # 页面组件
│   │   ├── Home.tsx                 # 主页面
│   │   └── NotFound.tsx             # 404 页面
│   ├── contexts/                    # React Context
│   │   └── ThemeContext.tsx         # 主题上下文
│   ├── hooks/                       # 自定义 Hooks
│   ├── lib/                         # 工具函数
│   ├── App.tsx                      # 应用主组件
│   ├── main.tsx                     # 应用入口
│   └── index.css                    # 全局样式
├── package.json                     # 项目依赖
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 配置
└── DEVELOPMENT.md                   # 本文件
```

## 环境要求

- Node.js 18+
- pnpm 10+
- TypeScript 5.6+

## 本地开发

### 1. 克隆项目

```bash
git clone <repository-url>
cd halcon-person-counter/client
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:3000` 启动，支持热模块替换（HMR）。

### 4. 类型检查

```bash
pnpm check
```

### 5. 格式化代码

```bash
pnpm format
```

## 项目配置

### vite.config.ts

主要配置项：

```typescript
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

### tsconfig.json

TypeScript 配置，支持路径别名：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 代码结构说明

### 页面组件

`pages/Home.tsx` 是应用的主页面：

```typescript
export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<RecognitionResult>();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRecognize = async () => {
    // 调用后端 API
    const response = await fetch('/api/recognize', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    setResult(data);
  };
  
  return (
    <div className="min-h-screen">
      {/* 页面内容 */}
    </div>
  );
}
```

### 组件

`components/ImageUploader.tsx` 处理图片上传：

```typescript
interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  isLoading?: boolean;
}

export default function ImageUploader({ onImageSelect, isLoading }: ImageUploaderProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };
  
  return (
    <div onDrop={handleDrop}>
      {/* 上传界面 */}
    </div>
  );
}
```

### 样式

全局样式在 `index.css` 中定义，使用 Tailwind CSS 和 OKLCH 色彩空间：

```css
:root {
  --primary: oklch(0.623 0.214 259.815);      /* 青色 */
  --background: oklch(0.141 0.005 285.823);   /* 深蓝 */
  --foreground: oklch(0.95 0.01 65);          /* 浅灰 */
}

@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', sans-serif;
  }
  
  h1, h2, h3 {
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
  }
}
```

## 开发工作流

### 1. 添加新页面

创建新页面文件 `src/pages/NewPage.tsx`：

```typescript
export default function NewPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">新页面</h1>
    </div>
  );
}
```

在 `App.tsx` 中添加路由：

```typescript
import NewPage from '@/pages/NewPage';

function Router() {
  return (
    <Switch>
      <Route path="/new" component={NewPage} />
    </Switch>
  );
}
```

### 2. 添加新组件

创建新组件 `src/components/NewComponent.tsx`：

```typescript
interface NewComponentProps {
  title: string;
  onAction?: () => void;
}

export default function NewComponent({ title, onAction }: NewComponentProps) {
  return (
    <div className="rounded-lg bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      <button onClick={onAction} className="mt-2">
        操作
      </button>
    </div>
  );
}
```

### 3. 修改主题颜色

编辑 `src/index.css` 中的 CSS 变量：

```css
:root {
  --primary: oklch(0.5 0.2 200);      /* 修改主色 */
  --background: oklch(0.95 0 0);      /* 修改背景 */
  --foreground: oklch(0.2 0 0);       /* 修改文字色 */
}
```

### 4. 使用 shadcn/ui 组件

导入并使用 shadcn/ui 组件：

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>标题</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>点击我</Button>
      </CardContent>
    </Card>
  );
}
```

## API 集成

### 调用后端 API

```typescript
const handleRecognize = async () => {
  try {
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch('/api/recognize', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('识别失败');
    }
    
    const data = await response.json();
    setResult(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 错误处理

```typescript
const handleError = (error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('未知错误');
  }
};
```

## 性能优化

### 1. 代码分割

使用动态导入进行代码分割：

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export default function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 2. 图片优化

使用 WebP 格式和响应式图片：

```typescript
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="描述" />
</picture>
```

### 3. 缓存策略

使用 React Query 或 SWR 进行数据缓存：

```typescript
const { data, isLoading } = useSWR('/api/data', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
});
```

## 测试

### 单元测试

使用 Vitest 进行单元测试：

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/pages/Home';

describe('Home', () => {
  it('应该渲染主页面', () => {
    render(<Home />);
    expect(screen.getByText(/Halcon 人数识别系统/i)).toBeInTheDocument();
  });
});
```

### E2E 测试

使用 Playwright 进行端到端测试：

```typescript
import { test, expect } from '@playwright/test';

test('上传图片并识别', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type="file"]', 'test.jpg');
  await page.click('button:has-text("开始识别")');
  await expect(page.locator('text=检测到')).toBeVisible();
});
```

## 构建和部署

### 构建生产版本

```bash
pnpm build
```

生成的文件位于 `dist/` 目录。

### 预览生产构建

```bash
pnpm preview
```

### 使用 Nginx 部署

```nginx
server {
  listen 80;
  server_name example.com;
  
  root /var/www/halcon-person-counter;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## Docker 部署

### 构建 Docker 镜像

```bash
docker build -t halcon-frontend:latest .
```

### 运行 Docker 容器

```bash
docker run -p 3000:3000 halcon-frontend:latest
```

## 常见问题

**Q: 如何修改 API 端点？**

A: 在 `vite.config.ts` 中修改 proxy 配置：
```typescript
proxy: {
  '/api': {
    target: 'http://api.example.com',
    changeOrigin: true,
  }
}
```

**Q: 如何添加环境变量？**

A: 创建 `.env` 文件：
```
VITE_API_URL=http://localhost:8080
```

在代码中使用：
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

**Q: 如何禁用深色主题？**

A: 在 `App.tsx` 中修改：
```typescript
<ThemeProvider defaultTheme="light">
```

**Q: 如何添加新的 shadcn/ui 组件？**

A: 使用 CLI 命令：
```bash
npx shadcn-ui@latest add button
```

## 参考资源

- [React 官方文档](https://react.dev)
- [TypeScript 官方文档](https://www.typescriptlang.org)
- [Vite 官方文档](https://vitejs.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Wouter 路由库](https://github.com/molefrog/wouter)

---

**最后更新**：2026 年 5 月 3 日
