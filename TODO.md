# 需求一

## 需求简述

Digit的高亮和选择，需要绑定到候选数，如果删除候选数，则高亮和选择的状态也删除。现在绑定到格子中，无法绑定到候选数中。需要改动 SudokuCanvas，以及一系列关于高亮、选择Digit的Commands。

## 技术实现方案

### 1. 数据模型调整

- `Candidate` 类型已有 `isSelected` 和 `isHighlighted` 字段，无需修改类型定义
- 需要修改 `subCandidate` 和 `subCandidates` 函数，在删除候选数时自动清理高亮和选择状态

### 2. SudokuCanvas 渲染调整

- 修改 `drawCornerCandidates` 函数，为候选数添加高亮/选择状态渲染
- 候选数高亮：背景色 + 边框
- 候选数选择：更强的边框或特殊标记

### 3. Commands 重构

- 修改 `setHighlightedDigit` / `addHighlightedDigit` 等函数，设置对应候选数的 `isHighlighted` 为 true
- 修改 `setSelectedDigit` / `addSelectedDigit` 等函数，设置对应候选数的 `isSelected` 为 true
- 修改 `clearAllHighlighted` / `clearAllSelected`，清理候选数级别状态

### 4. 需要修改的文件

1. `src/lib/SudokuEngine.ts`
   - `subCandidate()` - 删除候选数时清理高亮/选择
   - `subCandidates()` - 批量删除时清理

2. `src/components/sudoku/SudokuCanvas.tsx`
   - `drawCornerCandidates()` - 添加高亮/选择渲染

3. `src/lib/commands/highlightCommands.ts`
   - 修改 `setHighlightedDigit` / `addHighlightedDigit` 等的调用方式

4. `src/lib/commands/selectCommands.ts`
   - 修改 `setSelectedDigit` / `addSelectedDigit` 等的调用方式

## 边界情况处理

- 删除候选数时自动清理状态 ✅
- 候选数高亮与格子高亮的优先级：格子颜色 > 候选数高亮 > 候选数选择
- 向后兼容：Cell 级别的 `isSelected` / `isHighlighted` 保留用于其他用途

## 当前状态

**进行中**：
- [ ] 修改 `subCandidate`/`subCandidates` 自动清理状态
- [ ] 修改 `SudokuCanvas` 渲染候选数级别高亮/选择
- [ ] 重构 `highlightCommands` 支持候选数级别操作
- [ ] 重构 `selectCommands` 支持候选数级别操作
