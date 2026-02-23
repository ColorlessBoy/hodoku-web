export interface Position {
  index: number;
  row: number;
  col: number;
  box: number;
}

export interface Candidate {
  digit: number;
  color?: number;
  hasConflict?: boolean;
  isSelected?: boolean;
  isRemoved?: boolean; // 是否被标记为删除（用在某些解题技巧中,或者 intermediate 状态）
  isHighlighted?: boolean;
}

export interface Cell {
  position: Position;

  // 值相关
  digit?: number;
  isGiven?: boolean; // 是否是题目给定的数字

  // 候选数相关
  candidates?: Candidate[]; // 角注候选数

  // 高亮和颜色
  color?: number; // 单元格背景色
  isSelected?: boolean; // 是否被选中
  isHighlighted?: boolean; // 是否高亮

  // 错误状态
  hasConflict?: boolean; // 是否有冲突

  // 是否刚刚设置数字（用在某些解题技巧中,或者 intermediate 状态）
  isJustSet?: boolean;
}

export interface LinkNode {
  digit: number; // 如果是候选数链，指定候选数，(entry candidate if node is ALS, AUR...)
  positions: Position[];
}

export interface Link {
  from: LinkNode;
  to: LinkNode;
  isStrong: boolean; // true = 强链，false = 弱链
  type: 'normal' | 'als' | 'aur'; // 链的类型，默认为 normal
  color?: string; // 可选的自定义颜色
  auxiliaryPositions?: Position[] | undefined; // 辅助格子，用于 als 和 aur 链
}

export interface SudokuSchema {
  // 81个格子的渲染状态
  cells: Cell[];
  links: Link[];
}
