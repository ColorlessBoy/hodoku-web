import { getBoxCells } from './basic';
import type { Candidate, Cell } from './types';
export function setCellColor(cell: Cell, color?: number): boolean {
  const changed = cell.color !== color;
  cell.color = color;
  return changed;
}

function setCandidateColor(candidate: Candidate, color?: number): boolean {
  const changed = candidate.color !== color;
  candidate.color = color;
  return changed;
}

export function setCellCandidateColor(cell: Cell, digit: number, color?: number): boolean {
  if (!cell.candidates) {
    return false;
  }
  let changed = false;
  for (const candidate of cell.candidates) {
    if (candidate.digit === digit && setCandidateColor(candidate, color)) {
      changed = true;
    }
  }
  return changed;
}

export function cleanCellColor(cell: Cell): boolean {
  let changed = false;
  if (setCellColor(cell, undefined)) {
    changed = true;
  }
  for (const candidate of cell.candidates) {
    if (setCandidateColor(candidate, undefined)) {
      changed = true;
    }
  }
  return changed;
}

export function cleanAllCellsColor(cells: Cell[]): boolean {
  let changed = false;
  for (const cell of cells) {
    if (cleanCellColor(cell)) {
      changed = true;
    }
  }
  return changed;
}

export function setRowCandidateColor(
  cells: Cell[],
  row: number,
  digit?: number,
  color?: number
): boolean {
  let changed = false;
  for (const cell of cells) {
    if (cell.position.row === row) {
      if (digit === undefined) {
        if (setCellColor(cell, color)) {
          changed = true;
        }
      } else {
        if (setCellCandidateColor(cell, digit, color)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function setColCandidateColor(
  cells: Cell[],
  col: number,
  digit?: number,
  color?: number
): boolean {
  let changed = false;
  for (const cell of cells) {
    if (cell.position.col === col) {
      if (digit === undefined) {
        if (setCellColor(cell, color)) {
          changed = true;
        }
      } else {
        if (setCellCandidateColor(cell, digit, color)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function setBoxCandidateColor(
  cells: Cell[],
  box: number,
  digit?: number,
  color?: number
): boolean {
  let changed = false;
  for (const cell of cells) {
    if (cell.position.box === box) {
      if (digit === undefined) {
        if (setCellColor(cell, color)) {
          changed = true;
        }
      } else {
        if (setCellCandidateColor(cell, digit, color)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}
