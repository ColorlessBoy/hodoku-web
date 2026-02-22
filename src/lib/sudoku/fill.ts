import { set } from 'date-fns';
import {
  getBoxByIndex,
  getColByIndex,
  getIndexByRowCol,
  getRowByIndex,
  hasCandidate,
  hasDigit,
  removeCandidate,
  setCell,
} from './basic';
import type { Cell } from './types';

// 假设没有冲突, 找到最后一个候选数
export function getLastCandidate(cells: Cell[]): { index: number; digit: number } {
  for (let i = 0; i < 81; i++) {
    const cell = cells[i];
    if (cell.candidates?.length === 1) {
      return { index: i, digit: cell.candidates[0].digit };
    }
  }
  return { index: -1, digit: -1 };
}
export function fillLastCandidateAuto(cells: Cell[]): boolean {
  let changed = false;
  for (let i = 0; i < 81; i++) {
    const { index, digit } = getLastCandidate(cells);
    if (index === -1) {
      break;
    } else {
      setCell(cells, index, digit);
      changed = true;
    }
  }
  return changed;
}

// 假设没有冲突，获取行、列、框内唯一的候选数
export function getLastDigit(cells: Cell[]): { index: number; digit: number } {
  for (const digit of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const rowCntMap = new Map<number, number>();
    const rowIndexMap = new Map<number, number>();
    const colCntMap = new Map<number, number>();
    const colIndexMap = new Map<number, number>();
    const boxCntMap = new Map<number, number>();
    const boxIndexMap = new Map<number, number>();
    for (const cell of cells) {
      if (hasCandidate(cell, digit)) {
        rowCntMap.set(cell.position.row, (rowCntMap.get(cell.position.row) || 0) + 1);
        rowIndexMap.set(cell.position.row, cell.position.index);
        colCntMap.set(cell.position.col, (colCntMap.get(cell.position.col) || 0) + 1);
        colIndexMap.set(cell.position.col, cell.position.index);
        boxCntMap.set(cell.position.box, (boxCntMap.get(cell.position.box) || 0) + 1);
        boxIndexMap.set(cell.position.box, cell.position.index);
      }
    }
    for (const [row, cnt] of rowCntMap) {
      if (cnt === 1) {
        return { index: rowIndexMap.get(row)!, digit };
      }
    }
    for (const [col, cnt] of colCntMap) {
      if (cnt === 1) {
        return { index: colIndexMap.get(col)!, digit };
      }
    }
    for (const [box, cnt] of boxCntMap) {
      if (cnt === 1) {
        return { index: boxIndexMap.get(box)!, digit };
      }
    }
  }
  return { index: -1, digit: -1 };
}
export function fillLastDigitAuto(cells: Cell[]): boolean {
  let changed = false;
  for (let i = 0; i < 81; i++) {
    const { index, digit } = getLastDigit(cells);
    if (index === -1) {
      break;
    } else {
      setCell(cells, index, digit);
      changed = true;
    }
  }
  return changed;
}

// 强大的 fillLast，可以处理以下情况：
// 1. 最后一个候选数(row !== undefined and col !== undefined)
// 2. 行内最后一个候选数 (row !== undefined)
// 3. 列内最后一个候选数 (col !== undefined)
// 4. 框内最后一个候选数 (box !== undefined)
// 5. 行内候选数可能是同个Box的 Grouped Candidate，可以排除 Box 内其他格子的该候选数 (row !== undefined)
// 6. 列内候选数可能是同个Box的 Grouped Candidate，可以排除 Box 内其他格子的该候选数 (col !== undefined)
// 7. 框内候选数可能是同一行或者同一列的 Grouped Candidate，可以排除该行其他格子的该候选数 (box !== undefined)
export function fillLast(
  cells: Cell[],
  digit: number,
  row?: number,
  col?: number,
  box?: number
): boolean {
  if (row === undefined && col === undefined && box === undefined) {
    return false;
  }
  if (row !== undefined && col !== undefined) {
    const index = getIndexByRowCol(row, col);
    const cell = cells[index];
    if (hasCandidate(cell, digit) && cell.candidates?.length === 1) {
      return setCell(cells, index, digit);
    }
  }
  const rowIndexSet = new Set<number>();
  const colIndexSet = new Set<number>();
  const boxIndexSet = new Set<number>();

  for (const cell of cells) {
    if (hasCandidate(cell, digit)) {
      if (cell.position.row === row) {
        rowIndexSet.add(cell.position.index);
      }
      if (cell.position.col === col) {
        colIndexSet.add(cell.position.index);
      }
      if (cell.position.box === box) {
        boxIndexSet.add(cell.position.index);
      }
    }
  }
  if (rowIndexSet.size === 1) {
    const index = Array.from(rowIndexSet)[0];
    return setCell(cells, index, digit);
  }
  if (colIndexSet.size === 1) {
    const index = Array.from(colIndexSet)[0];
    return setCell(cells, index, digit);
  }
  if (boxIndexSet.size === 1) {
    const index = Array.from(boxIndexSet)[0];
    return setCell(cells, index, digit);
  }

  if (rowIndexSet.size === 2 || rowIndexSet.size === 3) {
    // 行内候选数可能是同个Box的 Grouped Candidate，可以排除 Box 内其他格子的该候选数
    const boxSet = new Set(Array.from(rowIndexSet).map((idx) => getBoxByIndex(idx)));
    if (boxSet.size === 1) {
      const box = Array.from(boxSet)[0];
      for (const cell of cells) {
        if (cell.position.box === box && cell.position.row !== row) {
          removeCandidate(cell, digit);
        }
      }
    }
  }
  if (colIndexSet.size === 2 || colIndexSet.size === 3) {
    // 列内候选数可能是同个Box的 Grouped Candidate，可以排除 Box 内其他格子的该候选数
    const boxSet = new Set(Array.from(colIndexSet).map((idx) => getBoxByIndex(idx)));
    if (boxSet.size === 1) {
      const box = Array.from(boxSet)[0];
      for (const cell of cells) {
        if (cell.position.box === box && cell.position.col !== col) {
          removeCandidate(cell, digit);
        }
      }
    }
  }
  if (boxIndexSet.size === 2 || boxIndexSet.size === 3) {
    // 框内候选数可能是同一行或者同一列的 Grouped Candidate，可以排除该行其他格子的该候选数
    const rowSet = new Set(Array.from(boxIndexSet).map((idx) => getRowByIndex(idx)));
    if (rowSet.size === 1) {
      const row = Array.from(rowSet)[0];
      for (const cell of cells) {
        if (cell.position.row === row && cell.position.box !== box) {
          removeCandidate(cell, digit);
        }
      }
    } else {
      const colSet = new Set(Array.from(boxIndexSet).map((idx) => getColByIndex(idx)));
      if (colSet.size === 1) {
        const col = Array.from(colSet)[0];
        for (const cell of cells) {
          if (cell.position.col === col && cell.position.box !== box) {
            removeCandidate(cell, digit);
          }
        }
      }
    }
  }
  return true;
}
