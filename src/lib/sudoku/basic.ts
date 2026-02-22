import type { Cell, SudokuSchema, Candidate, Position } from './types';

const _PositionObjects = new Array(81).fill(null).map((_, i) => ({
  index: i,
  row: Math.floor(i / 9),
  col: i % 9,
  box: Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3),
}));
if (process.env.NODE_ENV === 'development') {
  console.log('Position objects initialized:', _PositionObjects);
}
export const newPositionByIndex = (index: number): Position => _PositionObjects[index];
export const newPositionByRowCol = (row: number, col: number): Position =>
  _PositionObjects[row * 9 + col];
export const getRowPositions = (row: number): Position[] => {
  return Array.from({ length: 9 }, (_, i) => newPositionByRowCol(row, i));
};
export const getRowCells = (cells: Cell[], row: number): Cell[] => {
  return cells.filter((cell) => cell.position.row === row);
};
export const getColPositions = (col: number): Position[] => {
  return Array.from({ length: 9 }, (_, i) => newPositionByRowCol(i, col));
};
export const getColCells = (cells: Cell[], col: number): Cell[] => {
  return cells.filter((cell) => cell.position.col === col);
};
export const getBoxPositions = (box: number): Position[] => {
  const boxRowStart = Math.floor(box / 3) * 3;
  const boxColStart = (box % 3) * 3;
  return Array.from({ length: 9 }, (_, i) => i).map((i) =>
    newPositionByRowCol(boxRowStart + Math.floor(i / 3), boxColStart + (i % 3))
  );
};
export const getBoxCells = (cells: Cell[], box: number): Cell[] => {
  return cells.filter((cell) => cell.position.box === box);
};
export const isRelatedPositions = (position1: Position, position2: Position): boolean => {
  if (position1.row === position2.row && position1.col === position2.col) {
    return false; // 同一个格子不算相关
  }
  return (
    position1.row === position2.row ||
    position1.col === position2.col ||
    position1.box === position2.box
  );
};
export const isRelatedCells = (cell1: Cell, cell2: Cell): boolean => {
  return isRelatedPositions(cell1.position, cell2.position);
};

export const getRelatedPositions = (position: Position): Position[] => {
  const relatedIndexes = new Set<number>();
  for (let i = 0; i < 9; i++) {
    if (i !== position.row) relatedIndexes.add(i * 9 + position.col);
    if (i !== position.col) relatedIndexes.add(position.row * 9 + i);
  }
  const boxRowStart = Math.floor(position.row / 3) * 3;
  const boxColStart = Math.floor(position.col / 3) * 3;
  for (let r = boxRowStart; r < boxRowStart + 3; r++) {
    for (let c = boxColStart; c < boxColStart + 3; c++) {
      const idx = r * 9 + c;
      if (idx !== position.index) relatedIndexes.add(idx);
    }
  }
  return Array.from(relatedIndexes).map((idx) => _PositionObjects[idx]);
};
export function getRelatedCells(cells: Cell[], index: number): Cell[] {
  return getRelatedPositions(newPositionByIndex(index)).map((pos) => cells[pos.index]);
}
export function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({
    ...cell,
    candidates: cell.candidates?.map((c) => ({ ...c })) || undefined,
  }));
}

export function hasCandidate(cell: Cell, digit: number): boolean {
  if (cell.candidates?.some((c) => c.digit === digit)) {
    return true;
  }
  return false;
}
// 如果传入 digit，检查 cell 是否有这个 digit 作为候选数或者已经设置的数值
// 如果不传入 digit，检查 cell 是否已经设置了数值
export function hasDigit(cell: Cell, digit?: number): boolean {
  if (digit === undefined) {
    if (cell.digit === undefined || cell.digit === null || cell.digit < 1 || cell.digit > 9) {
      return false;
    }
    return true;
  }
  if (cell.digit === digit) {
    return true;
  }
  return hasCandidate(cell, digit);
}

export function createNewSchema(digits: number[]): SudokuSchema | null {
  if (digits.length !== 81) {
    return null;
  }
  const cells: Cell[] = [];
  for (const digit of digits) {
    cells.push({
      position: newPositionByIndex(cells.length),
      digit: digit === 0 ? undefined : digit,
      isGiven: digit !== 0,
    });
  }
  fillAllCandidates(cells);
  return {
    cells,
    links: [],
  };
}

/**
 * 深度复制 SudokuSchema
 */

export function cloneSchema(schema: SudokuSchema): SudokuSchema {
  return {
    cells: schema.cells.map(
      (cell): Cell => ({
        ...cell,
        position: { ...cell.position },
        candidates: cell.candidates ? cell.candidates.map((c) => ({ ...c })) : undefined,
      })
    ),
    links: schema.links?.map((link) => ({ ...link })),
  };
}

export function restartSchema(schema: SudokuSchema): SudokuSchema {
  const cells = cloneCells(schema.cells);
  for (let i = 0; i < 81; i++) {
    if (cells[i].isGiven) {
      cells[i] = { position: cells[i].position, digit: cells[i].digit, isGiven: true };
    } else {
      cells[i] = { position: cells[i].position };
    }
  }
  fillAllCandidates(cells);
  return { ...schema, cells };
}

export function fillAllCandidates(cells: Cell[]) {
  for (let i = 0; i < 81; i++) {
    fillCandidates(cells, i);
  }
}
export function fillCandidates(cells: Cell[], index: number) {
  const relatedDigits = new Set(
    getRelatedCells(cells, index)
      .filter((cell) => hasDigit(cell))
      .map((cell) => cell.digit)
  );
  if (hasDigit(cells[index])) {
    if (relatedDigits.has(cells[index].digit)) {
      cells[index].hasConflict = true;
      return;
    }
  }
  const candidates: Candidate[] = [];
  for (let i = 1; i <= 9; i++) {
    if (relatedDigits.has(i)) {
      continue;
    }
    candidates.push({ digit: i });
  }
  cells[index].candidates = candidates;
}
export function removeCandidate(cell: Cell, digit: number) {
  cell.candidates = cell.candidates?.filter((c) => c.digit !== digit);
}

export function removeCandidates(cell: Cell, digits: number[]) {
  cell.candidates = cell.candidates?.filter((c) => !digits.includes(c.digit));
}

// 设置数值并且移除冲突的后续数
// 不安全，做题的时候，请不要直接使用它
export function setCell(cells: Cell[], index: number, digit: number): boolean {
  if (cells[index].isGiven || cells[index].digit) {
    return false;
  }
  let hasConflict = false;
  for (const cell of getRelatedCells(cells, index)) {
    if (cell.digit === digit) {
      cells[index].hasConflict = true;
      hasConflict = true;
    } else if (cell.candidates) {
      cell.candidates = cell.candidates?.filter((c) => c.digit !== digit);
    }
  }
  cells[index].candidates = null;
  cells[index].digit = digit;
  cells[index].hasConflict = hasConflict;
  return true;
}

export function getIndexByRowCol(row: number, col: number): number {
  return row * 9 + col;
}

export function getRowByIndex(index: number): number {
  return Math.floor(index / 9);
}

export function getColByIndex(index: number): number {
  return index % 9;
}

export function getBoxByIndex(index: number): number {
  return Math.floor(index / 27) * 3 + Math.floor((index % 9) / 3);
}
