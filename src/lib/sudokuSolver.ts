/**
 * 数独求解器：回溯法求唯一解或统计解数。
 * 不依赖渲染 schema，仅基于 9x9 数字网格（空位用 null 或 0 表示）。
 */
import type { Digit } from '@/types/sudoku';
import type { SudokuRenderSchema } from '@/types/sudoku';

export type Grid = (Digit | null)[][];

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function canPlace(grid: Grid, row: number, col: number, d: Digit): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === d) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === d) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === d) return false;
    }
  }
  return true;
}

function gridCopy(grid: Grid): Grid {
  return grid.map((row) => row.map((v) => v));
}

/**
 * 从渲染 schema 得到 9x9 给定数字（空为 null）
 */
export function schemaToGrid(render: SudokuRenderSchema): Grid {
  return render.cells.map((row) =>
    row.map((c) => (c.value != null ? c.value : null))
  );
}

/**
 * 回溯求一个解；若无解返回 null。
 */
export function solveGrid(grid: Grid): Grid | null {
  const g = gridCopy(grid);
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (g[r][c] == null || g[r][c] === 0) empty.push({ row: r, col: c });
    }
  }

  function dfs(idx: number): boolean {
    if (idx === empty.length) return true;
    const { row, col } = empty[idx];
    for (const d of DIGITS) {
      if (!canPlace(g, row, col, d)) continue;
      g[row][col] = d;
      if (dfs(idx + 1)) return true;
      g[row][col] = null;
    }
    return false;
  }

  return dfs(0) ? g : null;
}

/**
 * 统计解的数量，最多统计到 max 个即停止（用于生成唯一解题目）。
 */
export function countSolutions(grid: Grid, max: number = 2): number {
  const g = gridCopy(grid);
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (g[r][c] == null || g[r][c] === 0) empty.push({ row: r, col: c });
    }
  }

  let count = 0;
  function dfs(idx: number): void {
    if (count >= max) return;
    if (idx === empty.length) {
      count++;
      return;
    }
    const { row, col } = empty[idx];
    for (const d of DIGITS) {
      if (!canPlace(g, row, col, d)) continue;
      g[row][col] = d;
      dfs(idx + 1);
      g[row][col] = null;
    }
  }
  dfs(0);
  return count;
}

/**
 * 基于渲染 schema 的便捷接口：只使用 cells 中的 value/isGiven，求解一个解。
 */
export function solve(renderSchema: SudokuRenderSchema): Grid | null {
  const grid = schemaToGrid(renderSchema);
  return solveGrid(grid);
}

/**
 * 判断当前题目是否有唯一解。
 */
export function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(grid, 2) === 1;
}

/**
 * 将解写回渲染 schema：保留原有 isGiven，空位用解填满。
 */
export function applySolutionToSchema(
  schema: SudokuRenderSchema,
  solution: Grid
): SudokuRenderSchema {
  return {
    ...schema,
    cells: schema.cells.map((row, r) =>
      row.map((cell, c) => ({
        ...cell,
        value: (solution[r][c] ?? cell.value) as Digit | null,
      }))
    ),
    links: [], // 求解后清空链便于查看
  };
}
