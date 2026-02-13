import { getBoxCells, getBoxIndex, hasCandidate } from "./basic";
import { checkSelected } from "./select";
import type { Candidate, Color, Cell, Digit } from "./types";

export function setCellColor(cell: Cell, color?: Color): boolean {
  let changed = cell.color !== color;
  cell.color = color;
  return changed;
}

function setCandidateColor(candidate: Candidate, color?: Color): boolean {
  let changed = candidate.color !== color;
  candidate.color = color;
  return changed;
}

export function setCellCandidateColor(cell: Cell, digit: Digit, color?: Color): boolean {
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

export function cleanAllCellsColor(cells: Cell[][]): boolean {
  let changed = false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = cells[r][c];
      if (cleanCellColor(cell)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setRowCandidateColor(cells: Cell[][], row: number, digit: Digit, color?: Color): boolean {
  let changed = false;
  for (let c = 0; c < 9; c++) {
    const cell = cells[row][c];
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
  return changed;
}

export function setColCandidateColor(cells: Cell[][], col: number, digit: Digit, color?: Color): boolean {
  let changed = false;
  for (let r = 0; r < 9; r++) {
    const cell = cells[r][col];
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
  return changed;
}

export function setBoxCandidateColor(cells: Cell[][], box: number, digit: Digit, color?: Color): boolean {
  let changed = false;
  for (const cell of getBoxCells(cells, box)) {
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
  return changed;
}