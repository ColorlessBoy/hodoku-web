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
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      range.push({
        row: box * 3 + row,
        col: box * 3 + col,
        box,
      });
    }
  }
  return range;
}

export function isInBox(box: number, row: number, col: number): boolean {
  return getBoxIndex(row, col) === box;
}

export interface Candidate {
  digit: Digit;
  color?: CandidateColor;
}

export interface Cell {
  position: CellPosition;

  // 值相关
  value: Digit | null;
  isGiven: boolean; // 是否是题目给定的数字

  // 候选数相关
  cornerCandidates: Candidate[]; // 角注候选数

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
    cell.value === digit || cell.cornerCandidates.some((c) => c.digit === digit);
  return abstractSetHighlighted(schema, cond);
}
export function addHighlightedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) =>
    cell.value === digit || cell.cornerCandidates.some((c) => c.digit === digit);
  return abstractAddHighlighted(schema, cond);
}
export function subHighlightedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) =>
    cell.value === digit || cell.cornerCandidates.some((c) => c.digit === digit);
  return abstractSubHighlighted(schema, cond);
}
export function setHighlightedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.value) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractSetHighlighted(schema, cond);
}
export function addHighlightedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.value) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractAddHighlighted(schema, cond);
}
export function subHighlightedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.value) ||
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
  const cond = (cell: Cell) => digit === cell.value;
  return abstractSetSelected(schema, cond);
}

export function addSelectedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) => digit === cell.value;
  return abstractAddSelected(schema, cond);
}

export function subSelectedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  const cond = (cell: Cell) => digit === cell.value;
  return abstractSubSelected(schema, cond);
}

export function setSelectedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.value) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractSetSelected(schema, cond);
}

export function addSelectedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.value) ||
    digits.some((d) => cell.cornerCandidates.some((c) => c.digit === d));
  return abstractAddSelected(schema, cond);
}

export function subSelectedDigits(schema: SudokuSchema, digits: Digit[]): SudokuSchema {
  const cond = (cell: Cell) =>
    digits.some((d) => d == cell.value) ||
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
  return cell.cornerCandidates.some((c) => c.digit === point.digit);
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
    if (cell.cornerCandidates && cell.cornerCandidates.length == 2) {
      return true;
    }
    return false;
  }
  // 同数链
  if (from.position.row === to.position.row) {
    // 验证同行
    const cnt = schema.cells[from.position.row].filter((cell) =>
      cell.cornerCandidates.some((c) => c.digit === from.digit)
    ).length;
    if (cnt === 2) {
      return true;
    }
  }
  if (from.position.col === to.position.col) {
    // 验证同列
    const cnt = schema.cells.filter((row) => {
      row[from.position.col].cornerCandidates.some((c) => c.digit === from.digit);
    }).length;
    if (cnt === 2) {
      return true;
    }
  }
  if (from.position.box === to.position.box) {
    const cnt = getBoxRange(from.position.box).filter((position) => {
      const cell = getCell(schema, position);
      return cell.cornerCandidates.some((c) => c.digit === from.digit);
    }).length;
    if (cnt === 2) {
      return true;
    }
  }
  return false;
}
