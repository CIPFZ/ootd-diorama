# OOTD 立体日记 —— 本地桌面原型

> 每天拍一张,把今天的穿搭变成立体 OOTD,并自动收藏和分享。

本仓库当前实现**本地桌面原型的第一阶段**:跑通「导入照片 → 质量检查 → 异步生成任务 → 3D 结果查看器」核心闭环。产品需求见 [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md),技术方案见 [`docs/DESKTOP_PROTOTYPE_TECH_STACK.md`](docs/DESKTOP_PROTOTYPE_TECH_STACK.md)。

## 目录结构

```
ootd-diorama/
  apps/
    desktop-web/            # React + TS + Vite + Three.js 前端
  services/
    reconstruction-api/     # FastAPI 后端(mock 阶段,真实建模就绪后替换 worker)
  packages/                 # 预留(asset-schema 等共享契约)
  docs/                     # 需求与技术文档
```

## 当前状态

- **前端**:Vite + React + TypeScript + Three.js(@react-three/fiber + drei)+ Zustand + TanStack Query。
- **后端**:FastAPI mock 骨架,内存任务存储 + 模拟阶段推进的 worker,返回一个演示 GLB。
- **尚未接入**:真实 GPU 建模管线(人物检测/分割/人体拟合/穿衣表面重建等)。

GPU 建模服务就绪后,只需替换 `services/reconstruction-api/app/mock/worker.py` 的 `run_task` 实现,路由与前端无需改动。

## 运行

### 1. 后端(FastAPI)

```bash
cd services/reconstruction-api
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

验证:`curl http://127.0.0.1:8000/api/health` 返回 `{"status":"ok"}`。

### 2. 前端(Vite)

```bash
cd apps/desktop-web
npm install
npm run dev
```

浏览器打开 Vite 提示的地址(默认 http://localhost:5173)。前端已配置代理,`/api` 与 `/assets` 会转发到 `localhost:8000`。

### 3. 生成演示资产(可选)

演示 GLB 与预览图已随仓库提交。如需重新生成(在前端目录下):

```bash
cd apps/desktop-web
node scripts/generate-demo-assets.mjs
```

输出到 `services/reconstruction-api/assets/`(该目录中的产物默认被 `.gitignore` 忽略)。

## 走通核心闭环

1. 打开前端首页,选择或拖入一张全身照片。
2. 前端本地做质量检查(格式 / 大小 / 分辨率 / 能否解码)。
3. 点击「开始生成」,进入任务进度页,观察阶段逐段推进(不显示虚假百分比)。
4. 成功后自动进入结果页:拖动/缩放/双击回正 3D 模型,左右转角被限制在 ±60°。
5. 「对照原图」切换原图与模型并排;「保存预览图」导出静态图。

**调试**:顶栏勾选「实验模式」后,首页会出现「模拟生成失败」开关(验证失败与重试),结果页会显示处理指标(面数 / 贴图 / GLB 大小 / 各阶段耗时)。

## 契约

前端 `apps/desktop-web/src/api/types.ts` 与后端 `services/reconstruction-api/app/schemas.py` 保持一致的 `Task / Stage / TaskResult` 契约。任务状态采用「顶层终态 + 内部阶段」两层:

- 顶层状态:`pending` / `processing` / `succeeded` / `failed` / `cancelled`
- 处理阶段:`preprocessing` → `analyzing` → `fitting_body` → `reconstructing_surface` → `texturing` → `optimizing`
