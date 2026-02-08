/**
 * 数独题目生成器：先生成一个合法满盘，再挖空并保证唯一解。
 */
import type { Digit } from '@/types/sudoku';
import { countSolutions, type Grid } from '@/lib/sudokuSolver';
import type { SudokuRenderSchema } from '@/types/sudoku';
import { createEmptyRenderSchema } from '@/types/sudoku';

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getBoxOrder(): { row: number; col: number }[] {
  const order: { row: number; col: number }[] = [];
  for (let box = 0; box < 9; box++) {
    const br = Math.floor(box / 3) * 3;
    const bc = (box % 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        order.push({ row: r, col: c });
      }
    }
  }
  return order;
}

/**
 * 生成一个随机的合法满盘（9x9 全填满且符合数独规则）。
 */
export function generateFullGrid(): Grid {
  const grid: Grid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null));
  const order = getBoxOrder();

  function canPlace(row: number, col: number, d: Digit): boolean {
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

  function fillBox(boxIndex: number): boolean {
    if (boxIndex === 9) return true;
    const start = boxIndex * 9;
    const positions = order.slice(start, start + 9);
    const digits = shuffle(DIGITS);

    function tryPosition(posIdx: number): boolean {
      if (posIdx === 9) return fillBox(boxIndex + 1);
      const { row, col } = positions[posIdx];
      for (const d of digits) {
        if (!canPlace(row, col, d)) continue;
        grid[row][col] = d;
        if (tryPosition(posIdx + 1)) return true;
        grid[row][col] = null;
      }
      return false;
    }
    return tryPosition(0);
  }

  fillBox(0);
  return grid as Grid;
}
/**
 * 在保证唯一解的前提下，从满盘里挖掉尽可能多的数字，直到剩余提示数不少于 minClues。
 * 返回的 grid 中非空即为题目提示。
 */
export function generatePuzzleFromFull(fullGrid: Grid, minClues: number = 25): Grid {
  const grid = fullGrid.map((row) => row.map((v) => v));
  const positions: { row: number; col: number }[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) positions.push({ row: r, col: c });
  }
  shuffle(positions);

  for (const { row, col } of positions) {
    const currentClues = grid.flat().filter((v) => v != null && v !== 0).length;
    if (currentClues <= minClues) break;

    const saved = grid[row][col];
    grid[row][col] = null;
    if (countSolutions(grid, 2) !== 1) {
      grid[row][col] = saved;
    }
  }
  return grid;
}

/**
 * 生成一道有唯一解的数独题目，目标提示数约在 minClues 以上。
 */
export function generatePuzzle(minClues: number = 25): Grid {
  const full = generateFullGrid();
  return generatePuzzleFromFull(full, minClues);
}

/**
 * 将 9x9 题目网格转为 SudokuRenderSchema（空位为 null，有数字的设为 isGiven: true）。
 */
export function gridToRenderSchema(grid: Grid): SudokuRenderSchema {
  const schema = createEmptyRenderSchema();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v != null && v !== 0) {
        schema.cells[r][c] = {
          ...schema.cells[r][c],
          value: v as Digit,
          isGiven: true,
        };
      }
    }
  }
  return schema;
}
