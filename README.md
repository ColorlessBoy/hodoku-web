# Hodoku Web Migration

## 简介 (Introduction)
本项目旨在将经典的 Java GUI 数独软件 [Hodoku](https://github.com/pseudoq/hodoku) 迁移为现代化的 Web 前端应用。

## 技术栈 (Tech Stack)
- **Build Tool**: Vite
- **Framework**: React
- **Language**: JavaScript (ES6+) / (建议后续迁移至 TypeScript)
- **Styling**: CSS Modules / Tailwind CSS (Optional)
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
- **Package Manager**: npm

## 快速开始 (Quick Start)

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 运行测试
```bash
npm run test
# 查看覆盖率
npm run test:coverage
```

### 代码检查与格式化
```bash
npm run lint
npm run lint:fix
npm run format
```

## 迁移计划 (Migration Roadmap)

### Phase 1: 项目初始化与基础设施搭建 (Completed)
- [x] 初始化 Vite + React 项目
- [x] 配置 Git 版本控制
- [x] 配置 ESLint 和 Prettier 代码规范
- [x] 配置 Vitest 测试环境

### Phase 2: 核心逻辑迁移 (Core Logic Migration)
Hodoku 的核心在于其强大的数独生成与解题算法。
- **方案 A (推荐)**: 将 Java 核心逻辑重写为 TypeScript/JavaScript 模块。
  - 优点：更易维护，无跨语言调用开销。
  - 缺点：工作量较大。
- **方案 B**: 使用 TeaVM 或 J2CL 将 Java 代码编译为 JavaScript/WASM。
  - 优点：复用现有代码。
  - 缺点：生成的代码难以调试，体积可能较大。

建议优先迁移以下核心模块：
- `Grid` / `Cell` 数据结构
- `SudokuGenerator` (生成器)
- `SudokuSolver` (解题器)
- `HintSystem` (提示系统)

### Phase 3: UI 组件开发 (UI Components)
使用 React 组件重构 Swing 界面。
- **GridComponent**: 数独盘面显示与交互。
- **DigitPad**: 数字输入面板。
- **Candidates**: 候选数显示与标记。
- **Sidebar/Menu**: 游戏设置、难度选择、操作按钮。

### Phase 4: 状态管理与应用集成 (State Management & Integration)
- 使用 React Context 或 Zustand/Redux 管理全局状态（当前盘面、历史记录、配置项）。
- 实现撤销/重做 (Undo/Redo) 功能。
- 实现游戏存档 (Local Storage)。

### Phase 5: 优化与发布 (Optimization & Deployment)
- 性能优化 (Web Workers 处理耗时计算)。
- 响应式设计 (适配移动端)。
- PWA 支持 (离线访问)。
- 部署至 GitHub Pages 或 Vercel/Netlify。

## 目录结构 (Directory Structure)
```
src/
  ├── assets/       # 静态资源
  ├── components/   # UI 组件
  ├── core/         # 数独核心逻辑 (迁移后的算法)
  ├── hooks/        # 自定义 Hooks
  ├── utils/        # 工具函数
  ├── App.jsx       # 主应用组件
  └── main.jsx      # 入口文件
```
