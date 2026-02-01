export interface CellColor {
  /** 背景颜色 (Hex/RGBA) */
  background?: string;
  /** 数字颜色 */
  digit?: string;
  /** 特定候选数的颜色 { candidate: color } */
  candidates?: Record<number, string>;
}

export interface Cell {
  /** 行索引 (0-8) */
  row: number;
  /** 列索引 (0-8) */
  col: number;
  /** 填入的数字 (1-9)，为空则为 null */
  value: number | null;
  /** 是否为初始题面数字 (不可修改) */
  isGiven?: boolean;
  /** 候选数列表 */
  candidates?: number[];
  /** 单元格相关的颜色配置 */
  colors?: CellColor;
}

export interface LinkNode {
  row: number;
  col: number;
  /** 涉及的数字 */
  digit?: number;
}

export interface Link {
  /** 起点 */
  start: LinkNode;
  /** 终点 */
  end: LinkNode;
  /** 链类型 (强链/弱链) */
  type: 'strong' | 'weak';
  /** 链的颜色 */
  color?: string;
}

export interface SudokuState {
  /** 81个单元格的数据 (按行优先排序) */
  cells: Cell[];
  /** 逻辑链 */
  links?: Link[];
  /** 区域定义 (默认标准数独可省略) */
  regions?: unknown[];
}
