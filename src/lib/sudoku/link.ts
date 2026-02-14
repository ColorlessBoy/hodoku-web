import { getBoxCells, hasCandidate, hasDigit } from './basic';
import { Cell, Digit, Position } from './types';

export function isStrongLink(
  cells: Cell[][],
  position1: Position,
  digit1: Digit,
  position2: Position,
  digit2: Digit
): boolean {
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  if (!hasCandidate(cell1, digit1) || !hasCandidate(cell2, digit2)) {
    return false;
  }
  if (digit1 !== digit2) {
    // 异数链
    if (cell1 === cell2 && cell1.candidates.length === 2) {
      // 前面验证过两个数都在cell的candidates中，所以这里一定是两个不同的数
      return true;
    }
    return false;
  }
  // 同数链
  if (position1.row === position2.row && position1.col === position2.col) {
    // 自己和自己不成链
    return false;
  }
  if (position1.row === position2.row) {
    // 可以尝试是否在同一行内成强链
    const row = position1.row;
    let cnt = 0;
    for (let c = 0; c < 9; c++) {
      const cell = cells[row][c];
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === 2) {
      return true;
    }
  }
  if (position1.col === position2.col) {
    // 可以尝试是否在同一列内成强链
    const col = position1.col;
    let cnt = 0;
    for (let r = 0; r < 9; r++) {
      const cell = cells[r][col];
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === 2) {
      return true;
    }
  }
  if (position1.box === position2.box) {
    // 可以尝试是否在同一宫内成强链
    const box = position1.box;
    let cnt = 0;
    for (const cell of getBoxCells(cells, box)) {
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === 2) {
      return true;
    }
  }
  return false;
}
