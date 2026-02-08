export type CellColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
export type CandidateColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface CellPosition {
  row: number; // 0-8
  col: number; // 0-8
  box: number; // 0-8
}

export function getBoxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

export function getBoxRange(box: number): CellPosition[] {
  const range: CellPosition[] = [];
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

export function isInBox(box: number, row: number, col: number): boolean {
  return getBoxIndex(row, col) === box;
}

// 不包含自身的相关格子
export function getRelatedRange(row: number, col: number): CellPosition[] {
  const range: CellPosition[] = [];
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

export interface Candidate {
  digit: Digit;
  color?: CandidateColor;
}

export interface Cell {
  position: CellPosition;

  // 值相关
  digit?: Digit;
  isGiven: boolean; // 是否是题目给定的数字

  // 候选数相关
  cornerCandidates?: Candidate[]; // 角注候选数

  // 高亮和颜色
  color?: CellColor; // 单元格背景色
  isSelected?: boolean; // 是否被选中
  isHighlighted?: boolean; // 是否高亮
  isSameValue?: boolean; // 是否与选中格相同值
  isRelated?: boolean; // 是否与选中格同行/列/宫

  // 错误状态
  hasConflict?: boolean; // 是否有冲突
  conflictWith?: CellPosition[]; // 冲突的单元格位置
}

export interface LinkEndpoint {
  position: CellPosition;
  digit: Digit; // 如果是候选数链，指定候选数
}

export interface Link {
  from: LinkEndpoint;
  to: LinkEndpoint;
  isStrong: boolean; // true = 强链，false = 弱链
  color?: string; // 可选的自定义颜色
}

export interface SuperLinkEndpoint {
  positions: CellPosition[];
  digit: Digit; // 如果是候选数链，指定候选数
}

export interface SuperLink {
  from: SuperLinkEndpoint;
  to: SuperLinkEndpoint;
  isStrong: boolean; // true = 强链，false = 弱链
  color?: string; // 可选的自定义颜色
}

export interface SudokuSchema {
  // 81个格子的渲染状态
  cells: Cell[][];

  // 链（强弱链可视化）
  links: Link[];

  superLinks: SuperLink[];
}

function abstractSet(
  schema: SudokuSchema,
  cond: (cell: Cell) => boolean,
  checkTrue: (cell: Cell) => boolean,
  newTrue: (cell: Cell) => Cell,
  newFalse: (cell: Cell) => Cell
) {
  return {
    ...schema,
    cells: schema.cells.map((row) =>
      row.map((cell) => {
        if (cond(cell)) {
          if (!checkTrue(cell)) {
            return newTrue(cell);
          }
        } else if (checkTrue(cell)) {
          return newFalse(cell);
        }
        return cell;
      })
    ),
  };
}

function abstractAdd(
  schema: SudokuSchema,
  cond: (cell: Cell) => boolean,
  checkTrue: (cell: Cell) => boolean,
  newTrue: (cell: Cell) => Cell
) {
  return {
    ...schema,
    cells: schema.cells.map((row) =>
      row.map((cell) => {
        if (cond(cell) && !checkTrue(cell)) {
          return newTrue(cell);
        }
        return cell;
      })
    ),
  };
}

function abstractSetHighlighted(schema: SudokuSchema, cond: (cell: Cell) => boolean): SudokuSchema {
  const checkTrue = (cell: Cell) => cell.isHighlighted;
  const newTrue = (cell: Cell) => ({ ...cell, isHighlighted: true });
  const newFalse = (cell: Cell) => ({ ...cell, isHighlighted: false });
  return abstractSet(schema, cond, checkTrue, newTrue, newFalse);
}

function abstractAddHighlighted(schema: SudokuSchema, cond: (cell: Cell) => boolean): SudokuSchema {
  const checkTrue = (cell: Cell) => cell.isHighlighted;
  const newTrue = (cell: Cell) => ({ ...cell, isHighlighted: true });
  return abstractAdd(schema, cond, checkTrue, newTrue);
}

function abstractSubHighlighted(schema: SudokuSchema, cond: (cell: Cell) => boolean): SudokuSchema {
  const checkTrue = (cell: Cell) => cell.isHighlighted;
  const newFalse = (cell: Cell) => ({ ...cell, isHighlighted: false });
  return abstractSet(schema, cond, checkTrue, newFalse, newFalse);
}

export function clearAllHighlighted(schema: SudokuSchema): SudokuSchema {
  const cond = (cell: Cell) => true;
  return abstractSubHighlighted(schema, cond);
}

export function setHighlightedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) =>
    cell.digit === digit || cell.cornerCandidates.some((c) => c.digit === digit);
  return abstractSetHighlighted(schema, cond);
}
export function addHighlightedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) =>
    cell.digit === digit || cell.cornerCandidates.some((c) => c.digit === digit);
  return abstractAddHighlighted(schema, cond);
}
export function subHighlightedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) =>
    cell.digit === digit || cell.cornerCandidates.some((c) => c.digit === digit);
  return abstractSubHighlighted(schema, cond);
}
export function setHighlightedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.digit) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractSetHighlighted(schema, cond);
}
export function addHighlightedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.digit) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractAddHighlighted(schema, cond);
}
export function subHighlightedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.digit) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractSubHighlighted(schema, cond);
}

export function setHighlightedRow(schema: SudokuSchema, row: number): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row;
  return abstractSetHighlighted(schema, cond);
}
export function addHighlightedRow(schema: SudokuSchema, row: number): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row;
  return abstractAddHighlighted(schema, cond);
}
export function subHighlightedRow(schema: SudokuSchema, row: number): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row;
  return abstractSubHighlighted(schema, cond);
}

export function setHighlightedRows(schema: SudokuSchema, rows: number[]): SudokuSchema {
  const cond = (cell: Cell) => rows.some((r) => r === cell.position.row);
  return abstractSetHighlighted(schema, cond);
}

export function addHighlightedRows(schema: SudokuSchema, rows: number[]): SudokuSchema {
  const cond = (cell: Cell) => rows.some((r) => r === cell.position.row);
  return abstractAddHighlighted(schema, cond);
}

export function subHighlightedRows(schema: SudokuSchema, rows: number[]): SudokuSchema {
  const cond = (cell: Cell) => rows.some((r) => r === cell.position.row);
  return abstractSubHighlighted(schema, cond);
}

export function setHighlightedCol(schema: SudokuSchema, col: number): SudokuSchema {
  const cond = (cell: Cell) => col === cell.position.col;
  return abstractSetHighlighted(schema, cond);
}

export function addHighlightedCol(schema: SudokuSchema, col: number): SudokuSchema {
  const cond = (cell: Cell) => col === cell.position.col;
  return abstractAddHighlighted(schema, cond);
}
export function subHighlightedCol(schema: SudokuSchema, col: number): SudokuSchema {
  const cond = (cell: Cell) => col === cell.position.col;
  return abstractSubHighlighted(schema, cond);
}

export function setHighlightedCols(schema: SudokuSchema, cols: number[]): SudokuSchema {
  const cond = (cell: Cell) => cols.some((c) => c === cell.position.col);
  return abstractSetHighlighted(schema, cond);
}

export function addHighlightedCols(schema: SudokuSchema, cols: number[]): SudokuSchema {
  const cond = (cell: Cell) => cols.some((c) => c === cell.position.col);
  return abstractAddHighlighted(schema, cond);
}
export function subHighlightedCols(schema: SudokuSchema, cols: number[]): SudokuSchema {
  const cond = (cell: Cell) => cols.some((c) => c === cell.position.col);
  return abstractSubHighlighted(schema, cond);
}

export function setHighlightedBox(schema: SudokuSchema, box: number): SudokuSchema {
  const cond = (cell: Cell) => box === cell.position.box;
  return abstractSetHighlighted(schema, cond);
}

export function addHighlightedBox(schema: SudokuSchema, box: number): SudokuSchema {
  const cond = (cell: Cell) => box === cell.position.box;
  return abstractAddHighlighted(schema, cond);
}
export function subHighlightedBox(schema: SudokuSchema, box: number): SudokuSchema {
  const cond = (cell: Cell) => box === cell.position.box;
  return abstractSubHighlighted(schema, cond);
}

export function setHighlightedBoxes(schema: SudokuSchema, boxes: number[]): SudokuSchema {
  const cond = (cell: Cell) => boxes.some((b) => b === cell.position.box);
  return abstractSetHighlighted(schema, cond);
}

export function addHighlightedBoxes(schema: SudokuSchema, boxes: number[]): SudokuSchema {
  const cond = (cell: Cell) => boxes.some((b) => b === cell.position.box);
  return abstractAddHighlighted(schema, cond);
}

export function subHighlightedBoxes(schema: SudokuSchema, boxes: number[]): SudokuSchema {
  const cond = (cell: Cell) => boxes.some((b) => b === cell.position.box);
  return abstractSubHighlighted(schema, cond);
}

export function setHighlightedXY(schema: SudokuSchema): SudokuSchema {
  const cond = (cell: Cell) => cell.cornerCandidates && cell.cornerCandidates.length === 2;
  return abstractSetHighlighted(schema, cond);
}

export function addHighlightedXY(schema: SudokuSchema): SudokuSchema {
  const cond = (cell: Cell) => cell.cornerCandidates && cell.cornerCandidates.length === 2;
  return abstractAddHighlighted(schema, cond);
}

function abstractSetSelected(schema: SudokuSchema, cond: (cell: Cell) => boolean): SudokuSchema {
  const checkState = (cell: Cell) => cell.isSelected;
  const newTrue = (cell: Cell) => ({ ...cell, isSelected: true });
  const newFalse = (cell: Cell) => ({ ...cell, isSelected: false });
  return abstractSet(schema, cond, checkState, newTrue, newFalse);
}

function abstractAddSelected(schema: SudokuSchema, cond: (cell: Cell) => boolean): SudokuSchema {
  const checkState = (cell: Cell) => cell.isSelected;
  const newTrue = (cell: Cell) => ({ ...cell, isSelected: true });
  return abstractAdd(schema, cond, checkState, newTrue);
}

function abstractSubSelected(schema: SudokuSchema, cond: (cell: Cell) => boolean): SudokuSchema {
  const checkState = (cell: Cell) => cell.isSelected;
  const newFalse = (cell: Cell) => ({ ...cell, isSelected: false });
  return abstractAdd(schema, cond, checkState, newFalse);
}

export function clearAllSelected(schema: SudokuSchema): SudokuSchema {
  const cond = (cell: Cell) => true;
  return abstractSubSelected(schema, cond);
}

export function setSelectedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) => digit === cell.digit;
  return abstractSetSelected(schema, cond);
}

export function addSelectedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) => digit === cell.digit;
  return abstractAddSelected(schema, cond);
}

export function subSelectedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) => digit === cell.digit;
  return abstractSubSelected(schema, cond);
}

export function setSelectedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.digit) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractSetSelected(schema, cond);
}

export function addSelectedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.digit) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractAddSelected(schema, cond);
}

export function subSelectedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.digit) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractSubSelected(schema, cond);
}

export function setSelectedCell(schema: SudokuSchema, cellPosition: CellPosition): SudokuSchema {
  const cond = (cell: Cell) =>
    cellPosition.row === cell.position.row && cellPosition.col === cell.position.col;
  return abstractSetSelected(schema, cond);
}

export function addSelectedCell(schema: SudokuSchema, cellPosition: CellPosition): SudokuSchema {
  const cond = (cell: Cell) =>
    cellPosition.row === cell.position.row && cellPosition.col === cell.position.col;
  return abstractAddSelected(schema, cond);
}

export function subSelectedCell(schema: SudokuSchema, cellPosition: CellPosition): SudokuSchema {
  const cond = (cell: Cell) =>
    cellPosition.row === cell.position.row && cellPosition.col === cell.position.col;
  return abstractSubSelected(schema, cond);
}

export function setSelectedCells(
  schema: SudokuSchema,
  cellPositions: CellPosition[]
): SudokuSchema {
  const cond = (cell: Cell) =>
    cellPositions.some((c) => c.row === cell.position.row && c.col === cell.position.col);
  return abstractSetSelected(schema, cond);
}

export function addSelectedCells(
  schema: SudokuSchema,
  cellPositions: CellPosition[]
): SudokuSchema {
  const cond = (cell: Cell) =>
    cellPositions.some((c) => c.row === cell.position.row && c.col === cell.position.col);
  return abstractAddSelected(schema, cond);
}

export function subSelectedCells(
  schema: SudokuSchema,
  cellPositions: CellPosition[]
): SudokuSchema {
  const cond = (cell: Cell) =>
    cellPositions.some((c) => c.row === cell.position.row && c.col === cell.position.col);
  return abstractSubSelected(schema, cond);
}

export function setSelectedRow(schema: SudokuSchema, row: number): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row;
  return abstractSetSelected(schema, cond);
}

export function addSelectedRow(schema: SudokuSchema, row: number): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row;
  return abstractAddSelected(schema, cond);
}

export function subSelectedRow(schema: SudokuSchema, row: number): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row;
  return abstractSubSelected(schema, cond);
}

export function setSelectedRows(schema: SudokuSchema, rows: number[]): SudokuSchema {
  const cond = (cell: Cell) => rows.some((r) => r === cell.position.row);
  return abstractSetSelected(schema, cond);
}

export function addSelectedRows(schema: SudokuSchema, rows: number[]): SudokuSchema {
  const cond = (cell: Cell) => rows.some((r) => r === cell.position.row);
  return abstractAddSelected(schema, cond);
}

export function subSelectedRows(schema: SudokuSchema, rows: number[]): SudokuSchema {
  const cond = (cell: Cell) => rows.some((r) => r === cell.position.row);
  return abstractSubSelected(schema, cond);
}

export function setSelectedCol(schema: SudokuSchema, col: number): SudokuSchema {
  const cond = (cell: Cell) => col === cell.position.col;
  return abstractSetSelected(schema, cond);
}

export function addSelectedCol(schema: SudokuSchema, col: number): SudokuSchema {
  const cond = (cell: Cell) => col === cell.position.col;
  return abstractAddSelected(schema, cond);
}

export function subSelectedCol(schema: SudokuSchema, col: number): SudokuSchema {
  const cond = (cell: Cell) => col === cell.position.col;
  return abstractSubSelected(schema, cond);
}

export function setSelectedCols(schema: SudokuSchema, cols: number[]): SudokuSchema {
  const cond = (cell: Cell) => cols.some((c) => c === cell.position.col);
  return abstractSetSelected(schema, cond);
}

export function addSelectedCols(schema: SudokuSchema, cols: number[]): SudokuSchema {
  const cond = (cell: Cell) => cols.some((c) => c === cell.position.col);
  return abstractAddSelected(schema, cond);
}

export function subSelectedCols(schema: SudokuSchema, cols: number[]): SudokuSchema {
  const cond = (cell: Cell) => cols.some((c) => c === cell.position.col);
  return abstractSubSelected(schema, cond);
}

export function setSelectedBox(schema: SudokuSchema, box: number): SudokuSchema {
  const cond = (cell: Cell) => box === cell.position.box;
  return abstractSetSelected(schema, cond);
}

export function addSelectedBox(schema: SudokuSchema, box: number): SudokuSchema {
  const cond = (cell: Cell) => box === cell.position.box;
  return abstractAddSelected(schema, cond);
}

export function subSelectedBox(schema: SudokuSchema, box: number): SudokuSchema {
  const cond = (cell: Cell) => box === cell.position.box;
  return abstractSubSelected(schema, cond);
}

export function setSelectedBoxes(schema: SudokuSchema, boxes: number[]): SudokuSchema {
  const cond = (cell: Cell) => boxes.some((b) => b === cell.position.box);
  return abstractSetSelected(schema, cond);
}

export function addSelectedBoxes(schema: SudokuSchema, boxes: number[]): SudokuSchema {
  const cond = (cell: Cell) => boxes.some((b) => b === cell.position.box);
  return abstractAddSelected(schema, cond);
}

export function subSelectedBoxes(schema: SudokuSchema, boxes: number[]): SudokuSchema {
  const cond = (cell: Cell) => boxes.some((b) => b === cell.position.box);
  return abstractSubSelected(schema, cond);
}

export function addCellColor(
  schema: SudokuSchema,
  row: number,
  col: number,
  color: CellColor | null
): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row && col === cell.position.col;
  const checkTrue = (cell: Cell) => cell.color === color;
  const newTrue = (cell: Cell) => ({ ...cell, color: color });
  return abstractAdd(schema, cond, checkTrue, newTrue);
}

export function addCandidateColor(
  schema: SudokuSchema,
  row: number,
  col: number,
  digit: Digit,
  color: CandidateColor | null
): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row && col === cell.position.col;
  const checkTrue = (cell: Cell) =>
    cell.cornerCandidates.some((c) => c.digit === digit && c.color === color);
  const newTrue = (cell: Cell) => ({
    ...cell,
    cornerCandidates: cell.cornerCandidates.map((c) =>
      c.digit === digit ? { ...c, color: color } : c
    ),
  });
  return abstractAdd(schema, cond, checkTrue, newTrue);
}

export function addCandidate(
  schema: SudokuSchema,
  digit: Digit,
  row: number,
  col: number
): SudokuSchema {
  const cond = (cell: Cell) => row === cell.position.row && col === cell.position.col;
  const checkTrue = (cell: Cell) => !cell.cornerCandidates.some((c) => c.digit === digit);
  const newTrue = (cell: Cell) => ({
    ...cell,
    cornerCandidates: [
      ...cell.cornerCandidates,
      {
        digit,
      },
    ],
  });
  return abstractAdd(schema, cond, checkTrue, newTrue);
}

export function addCandidates(
  schema: SudokuSchema,
  digit: Digit,
  positions: { row: number; col: number }[]
): SudokuSchema {
  const cond = (cell: Cell) =>
    positions.some(
      (position) => position.row === cell.position.row && position.col === cell.position.col
    );
  const checkTrue = (cell: Cell) => cell.cornerCandidates.some((c) => c.digit === digit);
  const newTrue = (cell: Cell) => ({
    ...cell,
    cornerCandidates: [
      ...cell.cornerCandidates,
      {
        digit,
      },
    ],
  });
  return abstractAdd(schema, cond, checkTrue, newTrue);
}

export function subCandidate(schema: SudokuSchema, digit: Digit, row: number, col: number) {
  const cond = (cell: Cell) => row === cell.position.row && col === cell.position.col;
  const checkTrue = (cell: Cell) => cell.cornerCandidates.some((c) => c.digit === digit);
  const newTrue = (cell: Cell) => ({
    ...cell,
    cornerCandidates: cell.cornerCandidates.filter((c) => c.digit !== digit),
  });
  return abstractAdd(schema, cond, checkTrue, newTrue);
}

export function subCandidates(
  schema: SudokuSchema,
  digit: Digit,
  positions: { row: number; col: number }[]
) {
  const cond = (cell: Cell) =>
    positions.some(
      (position) => position.row === cell.position.row && position.col === cell.position.col
    );
  const checkTrue = (cell: Cell) => cell.cornerCandidates.some((c) => c.digit === digit);
  const newTrue = (cell: Cell) => ({
    ...cell,
    cornerCandidates: cell.cornerCandidates.filter((c) => c.digit !== digit),
  });
  return abstractAdd(schema, cond, checkTrue, newTrue);
}

export function createLink(
  digit: Digit,
  row1: number,
  col1: number,
  row2: number,
  col2: number,
  isStrong: boolean
): Link {
  return {
    from: { position: { row: row1, col: col1, box: getBoxIndex(row1, col1) }, digit: digit },
    to: { position: { row: row2, col: col2, box: getBoxIndex(row2, col2) }, digit: digit },
    isStrong: isStrong,
  };
}

export function getCell(schema: SudokuSchema, position: CellPosition): Cell {
  return schema.cells[position.row][position.col];
}

export function isValidEndpoint(schema: SudokuSchema, point: LinkEndpoint): boolean {
  const cell = getCell(schema, point.position);
  return (cell.cornerCandidates ?? []).some((c) => c.digit === point.digit);
}

export function isInSameUnit(pos1: CellPosition, pos2: CellPosition): boolean {
  return pos1.row === pos2.row || pos1.col === pos2.col || pos1.box === pos2.box;
}

export function checkWeakLink(schema: SudokuSchema, link: Link): boolean {
  const { from, to } = link;
  if (!isValidEndpoint(schema, from) || !isValidEndpoint(schema, to)) {
    return false;
  }
  if (from.digit != to.digit) {
    // 异数链
    if (from.position === to.position) {
      return true;
    }
    return false;
  }
  // 同数链
  if (from.position.row === to.position.row && from.position.col === to.position.col) {
    return false;
  }
  if (!isInSameUnit(from.position, to.position)) {
    return false;
  }
  return true; // 只要在同一个作用区块，就可以组成弱链
}

export function checkStrongLink(schema: SudokuSchema, link: Link): boolean {
  if (!checkWeakLink(schema, link)) {
    return false; // 强链一定先是弱链
  }
  const { from, to } = link;
  if (from.digit != to.digit) {
    // 异数链
    const cell = getCell(schema, from.position);
    if ((cell.cornerCandidates ?? []).length === 2) {
      return true;
    }
    return false;
  }
  // 同数链
  if (from.position.row === to.position.row) {
    // 验证同行
    const cnt = schema.cells[from.position.row].filter((cell) =>
      (cell.cornerCandidates ?? []).some((c) => c.digit === from.digit)
    ).length;
    if (cnt === 2) {
      return true;
    }
  }
  if (from.position.col === to.position.col) {
    // 验证同列
    const cnt = schema.cells.filter((row) =>
      (row[from.position.col].cornerCandidates ?? []).some((c) => c.digit === from.digit)
    ).length;
    if (cnt === 2) {
      return true;
    }
  }
  if (from.position.box === to.position.box) {
    const cnt = getBoxRange(from.position.box).filter((position) => {
      const cell = getCell(schema, position);
      return (cell.cornerCandidates ?? []).some((c) => c.digit === from.digit);
    }).length;
    if (cnt === 2) {
      return true;
    }
  }
  return false;
}

export function setDigit(cells: Cell[][], row: number, col: number, digit: Digit) {
  getRelatedRange(row, col).forEach(({ row, col }) => {
    if (cells[row][col].cornerCandidates) {
      cells[row][col].cornerCandidates = cells[row][col].cornerCandidates.filter(
        (c) => c.digit !== digit
      );
    }
  });
  cells[row][col] = {
    ...cells[row][col],
    cornerCandidates: null,
    digit: digit,
  };
}

export function cloneCells(cells: Cell[][]): Cell[][] {
  return cells.map((row) =>
    row.map((cell) => ({
      ...cell,
    }))
  );
}
export function autofillUniqueCandidates(schema: SudokuSchema): SudokuSchema {
  const cells = cloneCells(schema.cells);
  let changed = false;
  for (let i = 0; i < 81; i++) {
    let hasUnique = false;
    for (let j = 0; j < 81; j++) {
      const r = Math.floor(j / 9);
      const c = j % 9;
      if (!cells[r][c].isGiven && cells[r][c].cornerCandidates.length === 1) {
        setDigit(cells, r, c, cells[r][c].cornerCandidates[0].digit);
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
  if (!changed) {
    return schema;
  }
  return {
    ...schema,
    cells,
  };
}

export function lastDigitRow(schema: SudokuSchema, row: number, digit: Digit): SudokuSchema {
  const cells = cloneCells(schema.cells);
  let cnt = 0;
  let col = -1;
  for (let c = 0; c < 9; c++) {
    const cell = cells[row][c];
    if (cell.digit === digit || (cell.cornerCandidates ?? []).some((c) => c.digit === digit)) {
      cnt++;
      if (cell.digit !== digit) {
        col = c;
      }
    }
  }
  if (cnt !== 1 || col === -1) {
    return schema;
  }
  setDigit(cells, row, col, digit);
  return { ...schema, cells };
}

export function lastDigitCol(schema: SudokuSchema, col: number, digit: Digit): SudokuSchema {
  const cells = cloneCells(schema.cells);
  let cnt = 0;
  let row = -1;
  for (let r = 0; r < 9; r++) {
    const cell = cells[r][col];
    if (cell.digit === digit || (cell.cornerCandidates ?? []).some((c) => c.digit === digit)) {
      cnt++;
      if (cell.digit !== digit) {
        row = r;
      }
    }
  }
  if (cnt !== 1 || row === -1) {
    return schema;
  }
  setDigit(cells, row, col, digit);
  return { ...schema, cells };
}

export function lastDigitBox(schema: SudokuSchema, box: number, digit: Digit): SudokuSchema {
  const cells = cloneCells(schema.cells);
  let cnt = 0;
  let row = -1;
  let col = -1;
  const boxCells = getBoxRange(box);
  for (const { row: r, col: c } of boxCells) {
    const cell = cells[r][c];
    if (cell.digit === digit || (cell.cornerCandidates ?? []).some((c) => c.digit === digit)) {
      cnt++;
      if (cell.digit !== digit) {
        row = r;
        col = c;
      }
    }
  }
  if (cnt !== 1 || row === -1 || col === -1) {
    return schema;
  }
  setDigit(cells, row, col, digit);
  return { ...schema, cells };
}

export function nakedPair(
  schema: SudokuSchema,
  digit1: Digit,
  digit2: Digit,
  position1: { row: number; col: number },
  position2: { row: number; col: number }
) {
  const cells = cloneCells(schema.cells);
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  if (!(cell1.cornerCandidates?.length === 2 && cell2.cornerCandidates.length === 2)) {
    return schema;
  }
  if (
    !(
      cell1.cornerCandidates?.some((c) => c.digit === digit1) &&
      cell1.cornerCandidates?.some((c) => c.digit === digit2) &&
      cell2.cornerCandidates?.some((c) => c.digit === digit1) &&
      cell2.cornerCandidates?.some((c) => c.digit === digit2)
    )
  ) {
    return schema;
  }
  if (cell1.position.row === cell2.position.row) {
    for (let c = 0; c < 9; c++) {
      if (c !== position1.col && c !== position2.col) {
        cells[cell1.position.row][c].cornerCandidates =
          cells[cell1.position.row][c].cornerCandidates?.filter(
            (c) => c.digit !== digit1 && c.digit !== digit2
          ) ?? [];
      }
    }
  }
  if (cell1.position.col === cell2.position.col) {
    for (let r = 0; r < 9; r++) {
      if (r !== position1.row && r !== position2.row) {
        cells[r][cell1.position.col].cornerCandidates =
          cells[r][cell1.position.col].cornerCandidates?.filter(
            (c) => c.digit !== digit1 && c.digit !== digit2
          ) ?? [];
      }
    }
  }
  if (cell1.position.box === cell2.position.box) {
    const boxCells = getBoxRange(cell1.position.box);
    for (const { row, col } of boxCells) {
      if (
        !(row === position1.row && col === position1.col) &&
        !(row === position2.row && col === position2.col)
      ) {
        cells[row][col].cornerCandidates =
          cells[row][col].cornerCandidates?.filter(
            (c) => c.digit !== digit1 && c.digit !== digit2
          ) ?? [];
      }
    }
  }
  return { ...schema, cells };
}

export function nakedPairsRow(schema: SudokuSchema, row: number, digits: Digit[]): SudokuSchema {
  const cells = cloneCells(schema.cells);
  const totalCols = new Set<number>();
  const sepCols = new Map<Digit, Set<number>>();
  for (let c = 0; c < 9; c++) {
    const cell = cells[row][c];
    if (digits.some((d) => d === cell.digit)) {
      return schema;
    }
    for (const d of digits) {
      if (cell.cornerCandidates?.some((c) => c.digit === d)) {
        sepCols.set(d, (sepCols.get(d) ?? new Set<number>()).add(c));
      }
    }
    if (digits.some((d) => cell.cornerCandidates?.some((c) => c.digit === d))) {
      totalCols.add(c);
    }
  }
  if (totalCols.size !== digits.length) {
    return schema;
  }
  for (const [_, cols] of sepCols) {
    if (cols.size === 0) {
      return schema;
    }
  }
  for (const col of totalCols) {
    if (cells[row][col].cornerCandidates?.some((c) => digits.some((d) => d !== c.digit))) {
      // 存在不等于digits的候选数
      return schema;
    }
  }
  for (let c = 0; c < 9; c++) {
    if (totalCols.has(c)) {
      continue;
    }
    cells[row][c].cornerCandidates =
      cells[row][c].cornerCandidates?.filter((c) => !digits.some((d) => d === c.digit)) ?? null;
  }
  return { ...schema, cells };
}

export function hiddenPairsRow(schema: SudokuSchema, row: number, digits: Digit[]): SudokuSchema {
  const cells = cloneCells(schema.cells);
  const totalCols = new Set<number>();
  const sepCols = new Map<Digit, Set<number>>();
  for (let c = 0; c < 9; c++) {
    const cell = cells[row][c];
    if (digits.some((d) => d === cell.digit)) {
      return schema;
    }
    for (const d of digits) {
      if (cell.cornerCandidates?.some((c) => c.digit === d)) {
        sepCols.set(d, (sepCols.get(d) ?? new Set<number>()).add(c));
      }
    }
    if (digits.some((d) => cell.cornerCandidates?.some((c) => c.digit === d))) {
      totalCols.add(c);
    }
  }
  if (totalCols.size !== digits.length) {
    return schema;
  }
  for (const [_, cols] of sepCols) {
    if (cols.size === 0) {
      return schema;
    }
  }
  for (const col of totalCols) {
    cells[row][col].cornerCandidates = cells[row][col].cornerCandidates?.filter(
      (c) => !digits.some((d) => d === c.digit)
    );
  }
  return { ...schema, cells };
}

export function nakedPairsCol(schema: SudokuSchema, col: number, digits: Digit[]): SudokuSchema {
  const cells = cloneCells(schema.cells);
  const totalRows = new Set<number>();
  const sepRows = new Map<Digit, Set<number>>();
  for (let r = 0; r < 9; r++) {
    const cell = cells[r][col];
    if (digits.some((d) => d === cell.digit)) {
      return schema;
    }
    for (const d of digits) {
      if (cell.cornerCandidates?.some((c) => c.digit === d)) {
        sepRows.set(d, (sepRows.get(d) ?? new Set<number>()).add(r));
      }
    }
    if (digits.some((d) => cell.cornerCandidates?.some((c) => c.digit === d))) {
      totalRows.add(r);
    }
  }
  if (totalRows.size !== digits.length) {
    return schema;
  }
  for (const [_, rows] of sepRows) {
    if (rows.size === 0) {
      return schema;
    }
  }
  for (const row of totalRows) {
    if (cells[row][col].cornerCandidates?.some((c) => digits.some((d) => d !== c.digit))) {
      // 存在不等于digits的候选数
      return schema;
    }
  }
  for (let r = 0; r < 9; r++) {
    if (totalRows.has(r)) {
      continue;
    }
    cells[r][col].cornerCandidates =
      cells[r][col].cornerCandidates?.filter((c) => !digits.some((d) => d === c.digit)) ?? null;
  }
  return { ...schema, cells };
}

export function hiddenPairsCol(schema: SudokuSchema, col: number, digits: Digit[]): SudokuSchema {
  const cells = cloneCells(schema.cells);
  const totalRows = new Set<number>();
  const sepRows = new Map<Digit, Set<number>>();
  for (let r = 0; r < 9; r++) {
    const cell = cells[r][col];
    if (digits.some((d) => d === cell.digit)) {
      return schema;
    }
    for (const d of digits) {
      if (cell.cornerCandidates?.some((c) => c.digit === d)) {
        sepRows.set(d, (sepRows.get(d) ?? new Set<number>()).add(r));
      }
    }
    if (digits.some((d) => cell.cornerCandidates?.some((c) => c.digit === d))) {
      totalRows.add(r);
    }
  }
  if (totalRows.size !== digits.length) {
    return schema;
  }
  for (const [digit, rows] of sepRows) {
    if (rows.size === 0) {
      return schema;
    }
  }
  for (const row of totalRows) {
    cells[row][col].cornerCandidates = cells[row][col].cornerCandidates?.filter(
      (c) => !digits.some((d) => d === c.digit)
    );
  }
  return { ...schema, cells };
}

export function nakedPairsBox(schema: SudokuSchema, box: number, digits: Digit[]): SudokuSchema {
  const cells = cloneCells(schema.cells);
  const totalPositions = new Set<CellPosition>();
  const sepPositions = new Map<Digit, Set<CellPosition>>();
  const boxPositions = getBoxRange(box);
  for (const digit of digits) {
    for (const position of boxPositions) {
      const cell = cells[position.row][position.col];
      if (cell.cornerCandidates?.some((c) => c.digit === digit)) {
        sepPositions.set(digit, (sepPositions.get(digit) ?? new Set<CellPosition>()).add(position));
        totalPositions.add(position);
      }
    }
  }
  if (totalPositions.size !== digits.length) {
    return schema;
  }
  for (const [_, positions] of sepPositions) {
    if (positions.size === 0) {
      return schema;
    }
  }
  for (const position of totalPositions) {
    if (
      cells[position.row][position.col].cornerCandidates?.some((c) =>
        digits.some((d) => d !== c.digit)
      )
    ) {
      // 存在不等于digits的候选数
      return schema;
    }
  }

  for (const position of boxPositions) {
    if (totalPositions.has(position)) {
      continue;
    }
    cells[position.row][position.col].cornerCandidates =
      cells[position.row][position.col].cornerCandidates?.filter(
        (c) => !digits.some((d) => d === c.digit)
      ) ?? null;
  }
  return { ...schema, cells };
}

export function hiddenPairsBox(schema: SudokuSchema, box: number, digits: Digit[]): SudokuSchema {
  const cells = cloneCells(schema.cells);
  const totalCells = new Set<CellPosition>();
  const sepCells = new Map<Digit, Set<CellPosition>>();
  for (const position of getBoxRange(box)) {
    const cell = cells[position.row][position.col];
    if (digits.some((d) => d === cell.digit)) {
      return schema;
    }
  }
  for (const digit of digits) {
    for (const position of getBoxRange(box)) {
      const cell = cells[position.row][position.col];
      if (cell.cornerCandidates?.some((c) => c.digit === digit)) {
        sepCells.set(digit, (sepCells.get(digit) ?? new Set<CellPosition>()).add(position));
        totalCells.add(position);
      }
    }
  }
  if (totalCells.size !== digits.length) {
    return schema;
  }
  for (const [_, cells] of sepCells) {
    if (cells.size === 0) {
      return schema;
    }
  }
  for (const cell of totalCells) {
    cells[cell.row][cell.col].cornerCandidates = cells[cell.row][cell.col].cornerCandidates?.filter(
      (c) => !digits.some((d) => d === c.digit)
    );
  }
  return { ...schema, cells };
}

export function setGroupCandidatesRow(
  schema: SudokuSchema,
  digit: Digit,
  positions: CellPosition[]
): SudokuSchema {
  if (positions.length < 2) {
    return schema;
  }
  const position = positions[0];
  if (!positions.every((p) => p.row === position.row)) {
    return schema;
  }
  if (
    !positions.every((p) => getCell(schema, p).cornerCandidates?.some((c) => c.digit === digit))
  ) {
    return schema;
  }
  const cells = cloneCells(schema.cells);
  for (let c = 0; c < 9; c++) {
    const cell = cells[position.row][c];
    if (positions.some((p) => p.col === c)) {
      continue;
    }
    if (cell.cornerCandidates?.some((c) => c.digit === digit)) {
      cell.cornerCandidates = cell.cornerCandidates?.filter((c) => c.digit !== digit);
    }
  }
  return { ...schema, cells };
}

export function checkGroupCandidatesRow(
  schema: SudokuSchema,
  digit: Digit,
  positions: CellPosition[]
): boolean {
  if (positions.length < 2) {
    return false;
  }
  const position = positions[0];
  if (!positions.every((p) => p.row === position.row)) {
    return false;
  }
  if (
    !positions.every((p) => getCell(schema, p).cornerCandidates?.some((c) => c.digit === digit))
  ) {
    return false;
  }
  for (let c = 0; c < 9; c++) {
    if (positions.some((p) => position.col === c)) {
      continue;
    }
    if (
      schema.cells[position.row][c].digit === digit ||
      schema.cells[position.row][c].cornerCandidates?.some((c) => c.digit === digit)
    ) {
      return false;
    }
  }
  return true;
}

export function setGroupCandidatesCol(
  schema: SudokuSchema,
  digit: Digit,
  positions: CellPosition[]
): SudokuSchema {
  if (positions.length < 2) {
    return schema;
  }
  const position = positions[0];
  if (!positions.every((p) => p.col === position.col)) {
    return schema;
  }
  if (
    !positions.every((p) => getCell(schema, p).cornerCandidates?.some((c) => c.digit === digit))
  ) {
    return schema;
  }
  const cells = cloneCells(schema.cells);
  for (let r = 0; r < 9; r++) {
    const cell = cells[r][position.col];
    if (positions.some((p) => p.row === r)) {
      continue;
    }
    if (cell.cornerCandidates?.some((c) => c.digit === digit)) {
      cell.cornerCandidates = cell.cornerCandidates?.filter((c) => c.digit !== digit);
    }
  }
  return { ...schema, cells };
}

export function checkGroupCandidatesCol(
  schema: SudokuSchema,
  digit: Digit,
  positions: CellPosition[]
) {
  if (positions.length < 2) {
    return false;
  }
  const position = positions[0];
  if (!positions.every((p) => p.col === position.col)) {
    return false;
  }
  if (
    !positions.every((p) => getCell(schema, p).cornerCandidates?.some((c) => c.digit === digit))
  ) {
    return false;
  }
  for (let r = 0; r < 9; r++) {
    if (positions.some((p) => position.row === r)) {
      continue;
    }
    if (
      schema.cells[r][position.col].digit === digit ||
      schema.cells[r][position.col].cornerCandidates?.some((c) => c.digit === digit)
    ) {
      return false;
    }
  }
  return true;
}

export function setGroupCandidatesBox(
  schema: SudokuSchema,
  digit: Digit,
  positions: CellPosition[]
): SudokuSchema {
  if (positions.length < 2) {
    return schema;
  }
  const position = positions[0];
  if (!positions.every((p) => p.box === position.box)) {
    return schema;
  }
  if (
    !positions.every((p) => getCell(schema, p).cornerCandidates?.some((c) => c.digit === digit))
  ) {
    return schema;
  }
  const cells = cloneCells(schema.cells);
  const boxPositions = getBoxRange(position.box);
  for (const position of boxPositions) {
    if (positions.some((p) => p.row === position.row && p.col === position.col)) {
      continue;
    }
    if (cells[position.row][position.col].cornerCandidates?.some((c) => c.digit === digit)) {
      cells[position.row][position.col].cornerCandidates = cells[position.row][
        position.col
      ].cornerCandidates?.filter((c) => c.digit !== digit);
    }
  }
  return { ...schema, cells };
}

export function checkGroupCandidatesBox(
  schema: SudokuSchema,
  digit: Digit,
  positions: CellPosition[]
): boolean {
  if (positions.length < 2) {
    return false;
  }
  const position = positions[0];
  if (!positions.every((p) => p.box === position.box)) {
    return false;
  }
  if (
    !positions.every((p) => getCell(schema, p).cornerCandidates?.some((c) => c.digit === digit))
  ) {
    return false;
  }
  const boxRange = getBoxRange(position.box);
  for (const position of boxRange) {
    if (positions.some((p) => position.row === p.row && position.col === p.col)) {
      continue;
    }
    const cell = getCell(schema, position);
    if (cell.digit === digit || cell.cornerCandidates?.some((c) => c.digit === digit)) {
      return false;
    }
  }
  return true;
}
