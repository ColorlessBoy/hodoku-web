export type CellColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
export type CandidateColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface CellPosition {
  row: number; // 0-8
  col: number; // 0-8
}

export interface Candidate {
  digit: Digit;
  color?: CandidateColor;
  eliminated?: boolean;
}

export interface Cell {
  position: CellPosition;

  // 值相关
  value: Digit | null;
  isGiven: boolean; // 是否是题目给定的数字
  
  // 候选数相关
  centerCandidates: Candidate[]; // 中心候选数
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


export function setHighlightedDigit(schema: SudokuSchema, digit: Digit) : SudokuSchema { 
return { ...schema, 
        cells: schema.cells.map((row) => row.map((cell) => {
            if (cell.value === digit && !cell.isHighlighted) {
                return { ...cell, isHighlighted: true };
            }
            if (cell.value !== digit && cell.isHighlighted) {
                return { ...cell, isHighlighted: false };
            }
            return cell;
        }))}
}

export function setHighlightedRow(schema: SudokuSchema, targetRow: number) : SudokuSchema {
    return { 
        ...schema, 
            cells: schema.cells.map((row) => row.map((cell) => {
                if (cell.position.row === targetRow && !cell.isHighlighted) {
                    return { ...cell, isHighlighted: true };
                }
                if (cell.position.row !== targetRow && cell.isHighlighted) {
                    return { ...cell, isHighlighted: false };
                }
                return cell;
            }))
        }
    }

