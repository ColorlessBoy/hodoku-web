// Unified Sudoku Rendering Schema

export type CellColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
export type CandidateColor = 1 | 2 | 3 | 4 | 5 | 6 | null;
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface CellPosition {
  row: number; // 0-8
  col: number; // 0-8
}

export interface CandidateInfo {
  digit: Digit;
  color?: CandidateColor;
  eliminated?: boolean; // 是否被消除（显示为删除线）
}

export interface CellRenderState {
  // 值相关
  value: Digit | null;
  isGiven: boolean; // 是否是题目给定的数字

  // 候选数相关
  centerCandidates: CandidateInfo[]; // 中心候选数
  cornerCandidates: CandidateInfo[]; // 角注候选数

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

export interface SudokuRenderSchema {
  // 81个格子的渲染状态
  cells: CellRenderState[][];

  // 链（强弱链可视化）
  links: ChainLink[];

  // 全局状态
  selectedCell: CellPosition | null;
  highlightedDigit: Digit | null;

  // 显示选项
  showConflicts: boolean;
  showRelatedCells: boolean;
  showSameValueHighlight: boolean;
}

// 工具函数类型
export type CellIndex = `${number}-${number}`;

export const getCellIndex = (row: number, col: number): CellIndex => `${row}-${col}`;

export const parseCellIndex = (index: CellIndex): CellPosition => {
  const [row, col] = index.split('-').map(Number);
  return { row, col };
};

export const getBoxIndex = (row: number, col: number): number =>
  Math.floor(row / 3) * 3 + Math.floor(col / 3);

export const areInSameUnit = (pos1: CellPosition, pos2: CellPosition): boolean => {
  return (
    pos1.row === pos2.row ||
    pos1.col === pos2.col ||
    getBoxIndex(pos1.row, pos1.col) === getBoxIndex(pos2.row, pos2.col)
  );
};

// 创建空的渲染状态
export const createEmptyRenderSchema = (): SudokuRenderSchema => ({
  cells: Array.from({ length: 9 }, () =>
    Array.from(
      { length: 9 },
      (): CellRenderState => ({
        value: null,
        isGiven: false,
        centerCandidates: [],
        cornerCandidates: [],
      })
    )
  ),
  links: [],
  selectedCell: null,
  highlightedDigit: null,
  showConflicts: true,
  showRelatedCells: true,
  showSameValueHighlight: true,
});

// 示例数独题目
export const examplePuzzle: (Digit | null)[][] = [
  [5, 3, null, null, 7, null, null, null, null],
  [6, null, null, 1, 9, 5, null, null, null],
  [null, 9, 8, null, null, null, null, 6, null],
  [8, null, null, null, 6, null, null, null, 3],
  [4, null, null, 8, null, 3, null, null, 1],
  [7, null, null, null, 2, null, null, null, 6],
  [null, 6, null, null, null, null, 2, 8, null],
  [null, null, null, 4, 1, 9, null, null, 5],
  [null, null, null, null, 8, null, null, 7, 9],
];
