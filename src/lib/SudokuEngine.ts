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
  backgroundColor?: CellColor; // 单元格背景色
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
  candidate?: Digit; // 如果是候选数链，指定候选数
}

export interface ChainLink {
  from: LinkEndpoint;
  to: LinkEndpoint;
  isStrong: boolean; // true = 强链，false = 弱链
  color?: string; // 可选的自定义颜色
}

export interface SuperLinkEndpoint {
  position: CellPosition;
  candidates?: Digit[]; // 如果是候选数链，指定候选数
}

export interface SuperChainLink {
  from: SuperLinkEndpoint;
  to: SuperLinkEndpoint;
  isStrong: boolean; // true = 强链，false = 弱链
  color?: string; // 可选的自定义颜色
}

export interface SudokuSchema {
  // 81个格子的渲染状态
  cells: Cell[][];

  // 链（强弱链可视化）
  links: ChainLink[];

  superLinks: SuperChainLink[];
}

export function setHighlightedDigit(schema: SudokuSchema, digit: Digit): SudokuSchema {
  return {
    ...schema,
    cells: schema.cells.map((row) =>
      row.map((cell) => {
        if (cell.value === digit || (cell.cornerCandidates.some((c) => c.digit === digit))) {
          if (!cell.isHighlighted) {
            return { ...cell, isHighlighted: true };
          }
        } else if (cell.isHighlighted) {
          return { ...cell, isHighlighted: false };
        }
        return cell;
      })
    ),
  };
}

export function setHighlightedRow(schema: SudokuSchema, targetRow: number): SudokuSchema {
  return {
    ...schema,
    cells: schema.cells.map((row) =>
      row.map((cell) => {
        if (cell.position.row === targetRow) {
          if (!cell.isHighlighted) {
            return { ...cell, isHighlighted: true };
          }
        } else if (cell.isHighlighted) {
          return { ...cell, isHighlighted: false };
        }
        return cell;
      })
    ),
  };
}

export function setHighlightedCol(schema: SudokuSchema, targetCol: number): SudokuSchema {
  return {
    ...schema,
    cells: schema.cells.map((row) =>
      row.map((cell) => {
        if (cell.position.row === targetCol) {
          if (!cell.isHighlighted) {
            return { ...cell, isHighlighted: true };
          }
        } else if (cell.isHighlighted) {
          return { ...cell, isHighlighted: false };
        }
        return cell;
      })
    ),
  };
}

export function setHighlightedBox(schema: SudokuSchema, box: number): SudokuSchema {
  return {
    ...schema,
    cells: schema.cells.map((row) =>
      row.map((cell) => {
        if (cell.position.box == box) {
          if (!cell.isHighlighted) {
            return { ...cell, isHighlighted: true };
          }
        } else if (cell.isHighlighted) {
          return { ...cell, isHighlighted: false };
        }
        return cell;
      })
    ),
  };
}

export function setHighlightedXY(schema: SudokuSchema): SudokuSchema {
  return {
    ...schema,
    cells: schema.cells.map((row) =>
      row.map((cell) => {
        if (cell.cornerCandidates && cell.cornerCandidates.length == 2) {
          if (!cell.isHighlighted) {
            return { ...cell, isHighlighted: true };
          }
        } else if (cell.isHighlighted) {
          return { ...cell, isHighlighted: false };
        }
        return cell;
      })
    ),
  };
}

export function setSelectedCells(schema: SudokuSchema, cells: CellPosition[]): SudokuSchema {
  return {
    ...schema,
    cells: schema.cells.map((row) =>
      row.map((cell) => {
        if (cell.isSelected) {
          if 
          return { ...cell, isSelected: false };
        }
        if (cells.some((c) => c.row === cell.position.row && c.col === cell.position.col)) {
          return { ...cell, isSelected: true };
        }
        if (!cells.some((c) => c.row === cell.position.row && c))
      })
    )
  }
}
