import { getBoxCells, getBoxIndex, hasCandidate } from './basic';
import { checkHighlighted } from './highlight';
import type { Candidate, Cell, Digit } from './types';

export function checkSelected(cell: Cell, selected: boolean = true): boolean {
  let isTrue = false;
  if (cell.isSelected === true) {
    isTrue = true;
  }
  if (cell.candidates !== undefined) {
    for (const c of cell.candidates) {
      if (c.isSelected === true) {
        isTrue = true;
      }
    }
  }
  if (isTrue === true) {
    return selected;
  }
  return !selected;
}

// 1. 设置候选数字的选中状态：setCandidatesSelected(candidates, true, digit)
// 2. 设置候选数字的不选中状态：setCandidatesSelected(candidates, false, digit)
// 3. 设置所有候选数字的选中状态：setCandidatesSelected(candidates, true)
// 4. 设置所有候选数字的不选中状态：setCandidatesSelected(candidates, false)
function setCandidatesSelected(
  candidates: Candidate[] | undefined,
  selected: boolean,
  digit?: Digit
): boolean {
  if (candidates === undefined) {
    return false;
  }
  let changed = false;
  for (const c of candidates) {
    if (c.digit === digit && c.isSelected !== selected) {
      c.isSelected = selected;
      changed = true;
    }
  }
  return changed;
}

export function setCellSelected(cell: Cell, selected: boolean = true, digit?: Digit): boolean {
  const changed = !checkSelected(cell, selected);
  if (digit === undefined) {
    // 只针对单元格的设置
    cell.isSelected = selected;
    if (cell.candidates) {
      for (const c of cell.candidates) {
        // 消去候选数的 Selected 状态
        c.isSelected = undefined;
      }
    }
  }
  // 针对有数的格子
  if (cell.digit === digit) {
    cell.isSelected = selected;
    // 没有候选数，所以不用处理
  } else {
    if (hasCandidate(cell, digit)) {
      // 针对命中的候选数的格子
      setCandidatesSelected(cell.candidates, selected, digit);
      // 候选数设置了 Selected 后，消去 Cell 的 Selected 状态
      cell.isSelected = undefined;
    }
  }
  return changed;
}

function setAllCellsSelected(cells: Cell[][], selected: boolean): boolean {
  let changed = false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = cells[r][c];
      if (setCellSelected(cell, selected)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function cleanCellSelected(cell: Cell): boolean {
  return setCellSelected(cell, false);
}

export function cleanAllCellsSelected(cells: Cell[][]): boolean {
  return setAllCellsSelected(cells, false);
}

export function setDigitSelected(
  cells: Cell[][],
  digit: Digit,
  selected: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (!(cell.digit === digit || hasCandidate(cell, digit))) {
          if (setCellSelected(cell, !selected)) {
            changed = true;
          }
        }
      }
    }
  } else {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (setCellSelected(cell, selected, digit)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function setRowSelected(
  cells: Cell[][],
  row: number,
  selected: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      if (r === row) continue;
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (setCellSelected(cell, !selected)) {
          changed = true;
        }
      }
    }
  } else {
    for (let c = 0; c < 9; c++) {
      const cell = cells[row][c];
      if (setCellSelected(cell, selected)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setColSelected(
  cells: Cell[][],
  col: number,
  selected: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (c === col) continue;
        const cell = cells[r][c];
        if (setCellSelected(cell, !selected)) {
          changed = true;
        }
      }
    }
  } else {
    for (let row = 0; row < 9; row++) {
      const cell = cells[row][col];
      if (setCellSelected(cell, selected)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setBoxSelected(
  cells: Cell[][],
  box: number,
  selected: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (getBoxIndex(r, c) === box) continue;
        const cell = cells[r][c];
        if (setCellSelected(cell, !selected)) {
          changed = true;
        }
      }
    }
  } else {
    for (const cell of getBoxCells(cells, box)) {
      if (setCellSelected(cell, selected)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setXYSelected(
  cells: Cell[][],
  selected: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (!(cell.candidates?.length === 2)) {
          if (setCellSelected(cell, !selected)) {
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
          console.log(`setXYSelected: ${r}, ${c}`);
          if (setCellSelected(cell, selected)) {
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}

export function selectHighlighted(cells: Cell[][]): boolean {
  let changed = false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = cells[r][c];
      if (checkHighlighted(cell, true)) {
        if (setCellSelected(cell, true)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}
