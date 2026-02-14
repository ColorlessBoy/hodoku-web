import { getBoxCells, getBoxIndex, hasCandidate } from './basic';
import { checkSelected } from './select';
import type { Candidate, Cell, Digit } from './types';

export function checkHighlighted(cell: Cell, highlighted: boolean = true): boolean {
  let isTrue = false;
  if (cell.isHighlighted === true) {
    isTrue = true;
  }
  if (cell.candidates !== undefined) {
    for (const c of cell.candidates) {
      if (c.isHighlighted === true) {
        isTrue = true;
      }
    }
  }
  if (isTrue === true) {
    return highlighted;
  }
  return !highlighted;
}
function setCandidatesHighlighted(
  candidates: Candidate[] | undefined,
  highlighted: boolean = true,
  digit?: Digit
): boolean {
  if (candidates === undefined) {
    return false;
  }
  let changed = false;
  for (const c of candidates) {
    if (c.digit === digit) {
      c.isHighlighted = highlighted;
      if (c.isHighlighted !== highlighted) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setCellHighlighted(
  cell: Cell,
  highlighted: boolean = true,
  digit?: Digit
): boolean {
  const changed = checkHighlighted(cell, highlighted);
  if (digit === undefined) {
    // 只针对单元格的设置
    cell.isHighlighted = highlighted;
    // 针对没有数的格子
    if (cell.candidates) {
      for (const c of cell.candidates) {
        c.isHighlighted = undefined;
      }
    }
  }
  // 针对有数的格子
  if (cell.digit === digit) {
    cell.isHighlighted = highlighted;
    // 没有候选数，所以不用处理
  } else {
    if (hasCandidate(cell, digit)) {
      // 针对命中的候选数的格子
      setCandidatesHighlighted(cell.candidates, highlighted, digit);
      // 候选数设置了 Highlighted 后，消去 Cell 的 Highlighted 状态
      cell.isHighlighted = undefined;
    }
  }
  return changed;
}

function setAllCellsHighlighted(cells: Cell[][], highlighted: boolean = true): boolean {
  let changed = false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = cells[r][c];
      if (setCellHighlighted(cell, highlighted)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function cleanCellHighlighted(cell: Cell): boolean {
  return setCellHighlighted(cell, false);
}

export function cleanAllCellsHighlighted(cells: Cell[][]): boolean {
  return setAllCellsHighlighted(cells, false);
}

export function setDigitHighlighted(
  cells: Cell[][],
  digit: Digit,
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (!(cell.digit === digit || hasCandidate(cell, digit))) {
          if (setCellHighlighted(cell, !highlighted)) {
            changed = true;
          }
        }
      }
    }
  } else {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (setCellHighlighted(cell, highlighted, digit)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function setRowHighlighted(
  cells: Cell[][],
  row: number,
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      if (r === row) continue;
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (let c = 0; c < 9; c++) {
      const cell = cells[row][c];
      if (setCellHighlighted(cell, highlighted)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setColHighlighted(
  cells: Cell[][],
  col: number,
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (c === col) continue;
        const cell = cells[r][c];
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (let row = 0; row < 9; row++) {
      const cell = cells[row][col];
      if (setCellHighlighted(cell, highlighted)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setBoxHighlighted(
  cells: Cell[][],
  box: number,
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (getBoxIndex(r, c) === box) continue;
        const cell = cells[r][c];
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (const cell of getBoxCells(cells, box)) {
      if (setCellHighlighted(cell, highlighted)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setXYHighlighted(
  cells: Cell[][],
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (cell.candidates?.length !== 2) {
          if (setCellHighlighted(cell, !highlighted)) {
            changed = true;
          }
        }
      }
    }
  } else {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (cell.candidates?.length === 2) {
          if (setCellHighlighted(cell, highlighted)) {
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}

export function highlightSelected(cells: Cell[][]): boolean {
  let changed = false;
  cleanAllCellsHighlighted(cells);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = cells[r][c];
      if (checkSelected(cell, true)) {
        if (setCellHighlighted(cell, true)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}
