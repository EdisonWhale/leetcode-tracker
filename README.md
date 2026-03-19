# leetcode-tracker

一个基于 Next.js 的 LeetCode 刷题工作台，用来把题库、每日计划、复习节奏和学习洞察放到同一个界面里。项目当前的产品名是 `LeetPlan OS`，定位是一个偏 Notion / dashboard 风格的面试准备工作区，而不是单纯的刷题列表。

## 项目预览

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Problems

![Problems](docs/screenshots/problems.png)

### Plan Board

![Plan Board](docs/screenshots/plan.png)

## 核心功能

- 每日工作台：集中展示今日完成数、到期复习数、今日建议新题数和完成率。
- 截止日期排期：根据 `planDeadline` 自动把未完成题目分配到每天，并动态计算每日建议负载。
- 题库视图：支持按状态、难度、主题筛选题目，保留 `Start`、`Plan`、`Review`、`Details` 等下一步动作。
- 复习工作流：完成题目后自动生成下一次复习日期，支持 `Again / Hard / Good / Easy` 评分和 `Snooze`。
- 洞察面板：展示 completion rate、review pressure、topic backlog、近几天排期等学习信号。
- 设置面板：可调整截止日期、默认 snooze 天数、单次 review session 大小。
- 本地持久化：学习进度和设置直接写入本地 JSON 文件，无需数据库。

## 页面路由

- `/`：Dashboard，总览当天的学习优先级。
- `/plan`：截止日期计划板，查看并微调每日题目负载。
- `/problems`：题库页，统一搜索、筛选和操作题目。
- `/review`：复习队列与专注复习流程。
- `/insights`：学习洞察页，查看 topic pressure 和近期安排。

## 技术栈

- Next.js 16 + App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest
- 文件级 JSON 持久化 API（`app/api/*` + `data/*.json`）

## 项目结构

```text
.
├── app/
│   ├── api/
│   │   ├── progress/route.ts
│   │   └── settings/route.ts
│   ├── insights/page.tsx
│   ├── plan/page.tsx
│   ├── problems/page.tsx
│   ├── review/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard-view.tsx
│   ├── insights-view.tsx
│   ├── plan-view.tsx
│   ├── problems-view.tsx
│   ├── review-view.tsx
│   ├── settings-panel.tsx
│   ├── study-workspace.tsx
│   └── workspace-shell.tsx
├── data/
│   ├── problems.ts
│   ├── progress.json
│   └── settings.json
├── docs/screenshots/
├── lib/
│   ├── dates.ts
│   └── study.ts
└── tests/
```

## 数据说明

- `data/problems.ts`：内置题库，目前包含 `182` 道题。
- `data/progress.json`：每道题的学习状态、完成记录、复习间隔、笔记和 session 历史。
- `data/settings.json`：截止日期、默认 snooze 时长、复习 session 大小等设置。

这意味着项目开箱即可运行，但目前是单用户、本地文件存储模式，不包含登录、云同步或多人协作。

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

默认访问 [http://localhost:3000](http://localhost:3000)。

## 可用脚本

```bash
npm run dev    # 本地开发
npm run build  # 生产构建
npm run start  # 启动生产环境
npm run lint   # ESLint
npm run test   # Vitest
```

## 当前项目形态

从代码结构来看，这个项目已经不是脚手架初始页，而是一个完整的前端产品原型：

- `StudyWorkspace` 作为统一状态入口，负责加载进度、设置、通知权限和页面切换。
- `lib/study.ts` 承担了核心领域逻辑，包括进度归一化、间隔复习规则、截止日期分配和洞察数据计算。
- `app/api/progress` 与 `app/api/settings` 提供最小可用后端接口，把前端操作落盘到本地数据文件。
- 测试覆盖了学习逻辑与关键 UI 约束，说明项目已经开始进入可维护状态，而不是纯展示稿。

## 后续可扩展方向

- 接入数据库和用户系统，支持多端同步。
- 增加拖拽式排期，替代当前的 earlier / later 调整方式。
- 接入 LeetCode / Notion / 日历同步能力。
- 增加更细粒度的统计维度，例如按周 streak、按题型 mastery 曲线等。
