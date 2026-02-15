import type { Digit, Cell } from './types';
import { getBoxCells, hasCandidate, hasDigit, setCell } from './basic';
export function fillLastCandidateAuto(cells: Cell[][]): boolean {
  let changed = false;
  for (let i = 0; i < 81; i++) {
    let hasUnique = false;
    for (let j = 0; j < 81; j++) {
      const r = Math.floor(j / 9);
      const c = j % 9;
      if (!cells[r][c].isGiven && cells[r][c].candidates?.length === 1) {
        setCell(cells, r, c, cells[r][c].candidates[0].digit);
        hasUnique = true;
        break;
      }
    }
    if (!hasUnique) {
      break;
    } else {
      changed = true;
    }
  }
  return changed;
}

export function fillLastCandidate(cells: Cell[][], row: number, col: number): boolean {
  const cell = cells[row][col];
  if (cell.isGiven || cell.digit !== undefined || cell.candidates?.length !== 1) {
    return false;
  }
  return setCell(cells, row, col, cell.candidates[0].digit);
}

export function fillLastDigitInRow(cells: Cell[][], row: number, digit: Digit): [boolean, number] {
  let cnt = 0;
  let col = -1;
  for (let c = 0; c < 9; c++) {
    const cell = cells[row][c];
    if (cell.digit === digit) {
      cnt++;
    } else if (hasCandidate(cell, digit)) {
      cnt++;
      col = c;
    }
  }
  if (cnt !== 1 || col === -1) {
    return [false, -1];
  }
  return [setCell(cells, row, col, digit), col];
}

export function fillLastDigitInCol(cells: Cell[][], col: number, digit: Digit): boolean {
  let cnt = 0;
  let row = -1;
  for (let r = 0; r < 9; r++) {
    const cell = cells[r][col];
    if (cell.digit === digit) {
      cnt++;
    } else if (hasCandidate(cell, digit)) {
      cnt++;
      row = r;
    }
  }
  if (cnt !== 1 || row === -1) {
    return false;
  }
  return setCell(cells, row, col, digit);
}

export function fillLastDigitInBox(cells: Cell[][], box: number, digit: Digit): boolean {
  let cnt = 0;
  let row = -1;
  let col = -1;
  for (const cell of getBoxCells(cells, box)) {
    if (cell.digit === digit) {
      cnt++;
    } else if (hasCandidate(cell, digit)) {
      cnt++;
      row = cell.position.row;
      col = cell.position.col;
    }
  }
  if (cnt !== 1 || row === -1 || col === -1) {
    return false;
  }
  return setCell(cells, row, col, digit);
}

// 某个数字集中在行和框的交集区域，可以排除该行和列的并集区域的其他数字
export function groupedDigitInBoxRow(
  cells: Cell[][],
  box: number,
  row: number,
  digit: Digit,
  removeCandidates: boolean = true
): boolean {
  let cnt = 0;
  for (let col = 0; col < 9; col++) {
    const cell = cells[row][col];
    if (cell.position.box !== box) {
      continue;
    }
    if (hasDigit(cell, digit)) {
      cnt++;
    }
  }
  if (cnt !== 2 && cnt !== 3) {
    return false;
  }
  // 检查是否是行内唯一
  let rowCnt = 0;
  for (let col = 0; col < 9; col++) {
    const cell = cells[row][col];
    if (hasDigit(cell, digit)) {
      rowCnt += 1;
    }
  }
  // 检查是否是框内唯一
  let boxCnt = 0;
  for (const cell of getBoxCells(cells, box)) {
    if (hasDigit(cell, digit)) {
      boxCnt += 1;
    }
  }
  if (cnt !== rowCnt && cnt !== boxCnt) {
    // 都不唯一，那就不是 Grouped Digit
    return false;
  }
  if (removeCandidates) {
    if (cnt !== rowCnt) {
      // 框内唯一，那就排除行的其他数字
      for (let col = 0; col < 9; col++) {
        const cell = cells[row][col];
        if (cell.position.box === box) {
          continue;
        }
        if (hasCandidate(cell, digit)) {
          cell.candidates = cell.candidates.filter((c) => c.digit !== digit);
        }
      }
    }
    if (cnt !== boxCnt) {
      for (const cell of getBoxCells(cells, box)) {
        if (cell.position.row === row) {
          continue;
        }
        if (hasCandidate(cell, digit)) {
          cell.candidates = cell.candidates.filter((c) => c.digit !== digit);
        }
      }
    }
  }
  return true;
}

// 某个数字集中在行和框的交集区域，可以排除该行和列的并集区域的其他数字
export function groupedDigitInBoxCol(
  cells: Cell[][],
  box: number,
  col: number,
  digit: Digit,
  removeCandidates: boolean = true
): boolean {
  let cnt = 0;
  for (let row = 0; row < 9; row++) {
    const cell = cells[row][col];
    if (cell.position.box !== box) {
      continue;
    }
    if (hasDigit(cell, digit)) {
      cnt++;
    }
  }
  if (cnt !== 2 && cnt !== 3) {
    return false;
  }
  // 检查是否是列内唯一
  let colCnt = 0;
  for (let row = 0; row < 9; row++) {
    const cell = cells[row][col];
    if (hasDigit(cell, digit)) {
      colCnt += 1;
    }
  }
  // 检查是否是框内唯一
  let boxCnt = 0;
  for (const cell of getBoxCells(cells, box)) {
    if (hasDigit(cell, digit)) {
      boxCnt += 1;
    }
  }
  if (cnt !== colCnt && cnt !== boxCnt) {
    // 都不唯一，那就不是 Grouped Digit
    return false;
  }
  if (removeCandidates) {
    if (cnt !== colCnt) {
      // 框内唯一, 列内不唯一，那就排除列的其他数字
      for (let row = 0; row < 9; row++) {
        const cell = cells[row][col];
        if (cell.position.box === box) {
          continue;
        }
        if (hasCandidate(cell, digit)) {
          cell.candidates = cell.candidates.filter((c) => c.digit !== digit);
        }
      }
    }
    if (cnt !== boxCnt) {
      for (const cell of getBoxCells(cells, box)) {
        if (cell.position.col === col) {
          continue;
        }
        if (hasCandidate(cell, digit)) {
          cell.candidates = cell.candidates.filter((c) => c.digit !== digit);
        }
      }
    }
  }
  return true;
}
