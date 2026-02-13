
export type Color = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Position {
  row: number; // 0-8
  col: number; // 0-8
  box: number; // 0-8
}

export interface Candidate {
  digit: Digit;
  color?: Color;
  hasConflict?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

export interface Cell {
  position?: Position;

  // 值相关
  digit?: Digit;
  isGiven?: boolean; // 是否是题目给定的数字

  // 候选数相关
  candidates?: Candidate[]; // 角注候选数

  // 高亮和颜色
  color?: Color; // 单元格背景色
  isSelected?: boolean; // 是否被选中
  isHighlighted?: boolean; // 是否高亮

  // 错误状态
  hasConflict?: boolean; // 是否有冲突
}

export interface LinkEndpoint {
  position: Position;
  digit: Digit; // 如果是候选数链，指定候选数
}

export interface Link {
  from: LinkEndpoint;
  to: LinkEndpoint;
  isStrong: boolean; // true = 强链，false = 弱链
  color?: string; // 可选的自定义颜色
}

export interface SuperLinkEndpoint {
  positions: Position[];
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
