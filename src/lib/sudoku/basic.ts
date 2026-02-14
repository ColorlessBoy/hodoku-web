import type { Position, Cell, SudokuSchema, Candidate, Digit } from './types';
export function getBoxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}
export function getBoxRange(box: number): Position[] {
  const range: Position[] = [];
  const boxRow = Math.floor(box / 3);
  const boxCol = Math.floor(box % 3);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      range.push({
        row: boxRow * 3 + row,
        col: boxCol * 3 + col,
        box,
      });
    }
  }
  return range;
}

export function getBoxCells(cell: Cell[][], box: number): Cell[] {
  return getBoxRange(box).map((pos) => cell[pos.row][pos.col]);
}

export function isInBox(box: number, row: number, col: number): boolean {
  return getBoxIndex(row, col) === box;
}

// 不包含自身的相关格子
export function getRelatedPositions(row: number, col: number): Position[] {
  const range: Position[] = [];
  for (let i = 0; i < 9; i++) {
    if (i == row) continue;
    range.push({ row: i, col, box: getBoxIndex(i, col) });
  }
  for (let i = 0; i < 9; i++) {
    if (i == col) continue;
    range.push({ row, col: i, box: getBoxIndex(row, i) });
  }
  getBoxRange(getBoxIndex(row, col)).forEach((position) => {
    if (row !== position.row && col !== position.col) {
      range.push(position);
    }
  });
  return range;
}
export function getRelatedCells(cells: Cell[][], row: number, col: number): Cell[] {
  return getRelatedPositions(row, col).map((pos) => cells[pos.row][pos.col]);
}

export function cloneCells(cells: Cell[][]): Cell[][] {
  return cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      candidates: cell.candidates?.map((c) => ({ ...c })) || undefined,
    }))
  );
}

export function hasCandidate(cell: Cell, digit: Digit): boolean {
  if (cell.candidates?.some((c) => c.digit === digit)) {
    return true;
  }
  return false;
}

export function hasDigit(cell: Cell, digit: Digit): boolean {
  if (cell.digit === digit) {
    return true;
  }
  return hasCandidate(cell, digit);
}

export function createNewSchema(nums: number[][]): SudokuSchema | null {
  if (nums.length !== 9) {
    return null;
  }
  // Check all rows have 9 columns
  for (let i = 0; i < 9; i++) {
    if (!nums[i] || nums[i].length !== 9) {
      return null;
    }
  }
  const cells: Cell[][] = [];

  for (let i = 0; i < 9; i++) {
    cells.push([]);
    for (let j = 0; j < 9; j++) {
      if (nums[i][j] !== 0) {
        cells[i].push({
          position: { row: i, col: j, box: getBoxIndex(i, j) },
          digit: nums[i][j] as Digit,
          isGiven: true,
        });
      } else {
        cells[i].push({
          position: { row: i, col: j, box: getBoxIndex(i, j) },
          isGiven: false,
        });
      }
    }
  }
  fillAllCandidates(cells);
  return {
    cells,
    links: [],
    superLinks: [],
  };
}

/**
 * 深度复制 SudokuSchema
 */

export function cloneSchema(schema: SudokuSchema): SudokuSchema {
  return {
    cells: schema.cells.map((row) =>
      row.map(
        (cell): Cell => ({
          ...cell,
          position: { ...cell.position },
          candidates: cell.candidates ? cell.candidates.map((c) => ({ ...c })) : undefined,
        })
      )
    ),
    links: schema.links?.map((link) => ({ ...link })),
    superLinks: schema.superLinks?.map((link) => ({ ...link })),
  };
}

export function restartSchema(schema: SudokuSchema): SudokuSchema {
  const cells = cloneCells(schema.cells);
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (cells[i][j].isGiven) {
        cells[i][j] = { position: cells[i][j].position, digit: cells[i][j].digit, isGiven: true };
      } else {
        cells[i][j] = { position: cells[i][j].position };
      }
    }
  }
  fillAllCandidates(cells);
  return { ...schema, cells };
}

export function fillAllCandidates(cells: Cell[][]) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      fillCandidates(cells, i, j);
    }
  }
}

export function fillCandidates(cells: Cell[][], row: number, col: number) {
  if (
    cells[row][col].isGiven ||
    cells[row][col].digit ||
    (cells[row][col].candidates && cells[row][col].candidates.length > 0)
  ) {
    return;
  }
  const digits: Digit[] = [];
  for (const cell of getRelatedCells(cells, row, col)) {
    if (cell.digit) {
      digits.push(cell.digit);
    }
  }
  const candidates: Candidate[] = [];
  for (let i = 1; i <= 9; i++) {
    if (digits.includes(i as Digit)) {
      continue;
    }
    candidates.push({ digit: i as Digit });
  }
  cells[row][col].candidates = candidates;
}

// 设置数值并且移除冲突的后续数
// 不安全，做题的时候，请不要直接使用它
export function setCell(cells: Cell[][], row: number, col: number, digit: Digit): boolean {
  if (cells[row][col].isGiven || cells[row][col].digit) {
    return false;
  }
  let hasConflict = false;
  for (const cell of getRelatedCells(cells, row, col)) {
    if (cell.digit === digit) {
      cells[row][col].hasConflict = true;
      hasConflict = true;
    } else if (cell.candidates) {
      cell.candidates = cell.candidates?.filter((c) => c.digit !== digit);
    }
  }
  cells[row][col].candidates = null;
  cells[row][col].digit = digit;
  cells[row][col].hasConflict = hasConflict;
  return true;
}

export function removeCandidate(cells: Cell[][], row: number, col: number, digit: Digit): boolean {
  if (!cells[row][col].candidates || !hasCandidate(cells[row][col], digit)) {
    return false;
  }
  cells[row][col].candidates = cells[row][col].candidates?.filter((c) => c.digit !== digit);
  return true;
}
