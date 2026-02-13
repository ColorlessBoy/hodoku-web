
import type { Digit, Cell } from "./types";
import { getBoxCells, hasCandidate, setCell } from "./basic";
export function fillUniqueCandidateAuto(cells: Cell[][]): boolean {
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

export function fillUniqueCandidate(cells: Cell[][], row: number, col: number): boolean {
  const cell = cells[row][col];
  if (cell.isGiven || cell.digit !== undefined || cell.candidates?.length !== 1) {
    return false;
  }
  return setCell(cells, row, col, cell.candidates[0].digit);
}

export function fillLastDigitInRow(cells: Cell[][], row: number, digit: Digit): boolean {
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
    return false;
  }
  return setCell(cells, row, col, digit);
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
