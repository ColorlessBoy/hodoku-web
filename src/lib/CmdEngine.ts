/**
 * CmdEngine - 命令解析引擎
 * 函数式设计：纯函数，无副作用，返回新的 schema 或错误信息
 *
 * 命令格式说明：
 * - s 115 327 781 - 设置格子值 (set)
 * - c 11 32 78 - 清除格子 (clear)
 * - k r1c1 [3] / k 11 [3] - 切换候选数 (candidate)
 * - h 1-9/off - 高亮数字
 * - H 1-9 - 高亮行 (hr)
 * - V 1-9 - 高亮列 (hc)
 * - B 1-9 - 高亮宫 (hb)
 * - cc r1c1 1-8 / cc 11 1-8 - 单元格颜色
 * - kc r1c1 5 1-6 / kc 11 5 1-6 - 候选数颜色
 * - lk r1c1:5 r2c2:5 strong|weak / lks 115 225 - 添加链
 * - lkc - 清除链
 * - auto - 自动填充
 * - last r|c|b 1-9 1-9 - 最后一位
 * - np r1c1:5 r2c2:6 / np 115 226 - 裸对
 */

import type {
  SudokuSchema,
  CellPosition,
  Digit,
  CellColor,
  CandidateColor,
  Link,
} from '@/types/sudoku';
import {
  getBoxIndex,
  addCellColor,
  addCandidateColor,
  setHighlightedDigit,
  setHighlightedRow,
  setHighlightedCol,
  setHighlightedBox,
  clearAllHighlighted,
  setSelectedCell,
  lastDigitRow,
  lastDigitCol,
  lastDigitBox,
  nakedPair,
  cloneCells,
  createLink,
  getRelatedRange,
  setDigit,
} from '@/types/sudoku';
import { validateLink, validateSet, validateClear } from '@/lib/sudokuOperator';
import { solve, applySolutionToSchema } from '@/lib/sudokuSolver';
import { generatePuzzle, gridToSchema } from '@/lib/sudokuGenerator';
import { cloneSchema } from '@/lib/schemaAdapter';
import {
  fillCandidatesInplace,
  setSelectRowInplace,
  setSelectCellInplace,
  unsetCellInplace,
  setHighlightedRows,
  setHighlightedCols,
  setHighlightedBoxes,
  setHighlightedDigits,
  addHighlightedCols,
  addHighlightedRows,
  addHighlightedBoxes,
  addHighlightedCells,
  addHighlightedCellInplace,
  addHighlightedDigits,
  clearAllHighlightedInplace,
  joinHighlightedRows,
  joinHighlightedCols,
  joinHighlightedBoxes,
  joinHighlightedDigits,
  setHighlightedXY,
  addHighlightedXY,
  joinHighlightedXY,
  clearAllSelectedInplace,
  setSelectedCellInplace,
  autofillUniqueCandidate,
  fillUniqueCandidateInplace,
  fillUniqueRowInplace,
  fillUniqueColInplace,
  setSelectColInplace,
  setSelectBoxInplace,
  fillUniqueBoxInplace,
  createNewSchema,
  setHighlightedDigitInplace,
  addHighlightedDigitInplace,
  setSelectedRow,
  setSelectedDigit,
  setSelectedDigitInplace,
  joinSelectedDigit,
  joinSelectedDigitInplace,
  setSelectedRows,
  addSelectedRows,
  joinSelectedRows,
  setSelectedCols,
  addSelectedCols,
  joinSelectedCols,
  setSelectedBoxes,
  addSelectedBoxes,
  joinSelectedBoxes,
  clearAllSelected,
} from './SudokuEngine';
import { i } from 'node_modules/vite/dist/node/chunks/moduleRunnerTransport';

// ============================================================================
// 类型定义
// ============================================================================

/** 命令执行结果 */
export type CmdResult =
  | { type: 'ok'; schema: SudokuSchema }
  | { type: 'error'; msg: string }
  | { type: 'noop' }; // 无操作（如 undo/redo 由外部处理）

/** 位置+数字解析结果 */
export type PosDigit = { row?: number; col?: number; box?: number; digit?: Digit };

/** 命令处理器 */
export type CmdHandler = (
  schema: SudokuSchema,
  args: string[],
  flags?: Record<string, boolean>
) => CmdResult;

// ============================================================================
// 工具函数
// ============================================================================

const clampRC = (n: number): number => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number): number => clampRC(n) - 1;

const toCellPosition = (pos: PosDigit): CellPosition | null => {
  if (pos.row !== undefined && pos.col !== undefined) {
    return { row: pos.row, col: pos.col, box: getBoxIndex(pos.row, pos.col) };
  }
  return null;
};

/** 解析 115 格式的位置+数字 */
export function parsePosDigit(token: string): PosDigit | null {
  const t = token.trim().toLowerCase();

  // 格式: r1c1 (行1-9, 列1-9)
  if (t.length > 0) {
    const row = t.length > 0 ? toZeroIdx(Number(t[0])) : undefined;
    const col = t.length > 1 ? toZeroIdx(Number(t[1])) : undefined;
    const box = t.length > 1 ? getBoxIndex(row, col) : undefined;
    const digit = t.length > 2 ? (clampRC(Number(t[2])) as Digit) : undefined;
    return { row, col, box, digit };
  }

  return null;
}

export function parseRowDigit(token: string): PosDigit | null {
  const t = token.trim().toLowerCase();

  if (t.length > 0) {
    const row = t.length > 0 ? toZeroIdx(Number(t[0])) : undefined;
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { row, col: undefined, digit };
  }
}

export function parseColDigit(token: string): PosDigit | null {
  const t = token.trim().toLowerCase();

  if (t.length > 0) {
    const col = t.length > 0 ? toZeroIdx(Number(t[0])) : undefined;
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { row: undefined, col, digit };
  }
}

export function parseBoxDigit(token: string): PosDigit | null {
  const t = token.trim().toLowerCase();

  if (t.length > 0) {
    const box = t.length > 0 ? toZeroIdx(Number(t[0])) : undefined;
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { row: undefined, col: undefined, box, digit };
  }
}

/** 创建成功的结果 */
const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });

/** 创建错误结果 */
const err = (msg: string): CmdResult => ({ type: 'error', msg });

/** 创建无操作结果 */
const noop = (): CmdResult => ({ type: 'noop' });

// ============================================================================
// 命令处理器
// ============================================================================

/** set - 设置格子值，如果没有输入完整，则自动改成 Select 操作 */
const cmdSet: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: s 115 327 781');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!(pos && pos.row !== undefined)) {
      return err('用法: set 115 327 781');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else if (!pos.digit) {
      setSelectCellInplace(newCells, pos.row, pos.col);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else {
      setDigit(newCells, pos.row, pos.col, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdUnset: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: unset 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: c 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else {
      unsetCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

/** h - 高亮行 */
const cmdAddHighlightRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hra 1 3 7');
  }
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedRows(schema, rows));
};

const cmdSetHighlightRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hrs 1 3 7');
  }
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedRows(schema, rows));
};

const cmdJoinHighlightRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hrj 1 3 7');
  }
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedRows(schema, rows));
};
const cmdAddHighlightCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hca 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedCols(schema, cols));
};

const cmdSetHighlightCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hcs 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedCols(schema, cols));
};
const cmdJoinHighlightCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hcj 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedCols(schema, cols));
};
const cmdAddHighlightBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hba 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedBoxes(schema, boxes));
};
const cmdSetHighlightBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hbs 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedBoxes(schema, boxes));
};
const cmdJoinHighlightBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hbj 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedBoxes(schema, boxes));
};
const cmdAddHighlightCells: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: ha 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: ha 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else if (!pos.digit) {
      setSelectCellInplace(newCells, pos.row, pos.col);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else {
      addHighlightedCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};
const cmdSetHighlightCells: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hs 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  clearAllHighlightedInplace(newCells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: hs 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else if (!pos.digit) {
      setSelectCellInplace(newCells, pos.row, pos.col);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else {
      addHighlightedCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdAddHighlightDigits: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hda 1 3 7');
  }
  const digits = args.map((arg) => clampRC(Number(arg)) as Digit);
  return ok(addHighlightedDigits(schema, digits));
};

const cmdSetHighlightDigits: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hds 1 3 7');
  }
  const digits = args.map((arg) => clampRC(Number(arg)) as Digit);
  return ok(setHighlightedDigits(schema, digits));
};
const cmdJoinHighlightDigits: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hdj 1 3 7');
  }
  const digits = args.map((arg) => clampRC(Number(arg)) as Digit);
  return ok(joinHighlightedDigits(schema, digits));
};
const cmdSetHighlightXY: CmdHandler = (schema, args) => {
  return ok(setHighlightedXY(schema));
};
const cmdAddHighlightXY: CmdHandler = (schema, args) => {
  return ok(addHighlightedXY(schema));
};
const cmdJoinHighlightXY: CmdHandler = (schema, args) => {
  return ok(joinHighlightedXY(schema));
};

const cmdUnHighlightAll: CmdHandler = (schema, args) => {
  return ok(clearAllHighlighted(schema));
};

/** s select - 选择格子 */
const cmdAddSelectCells: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sa 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  clearAllSelectedInplace(newCells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: sa 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else if (!pos.digit) {
      setSelectCellInplace(newCells, pos.row, pos.col);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else {
      setSelectedCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};
const cmdSetSelectCells: CmdHandler = (schema, args) => {
  console.log('cmdSetSelectCells-args', args);
  if (args.length === 0) {
    return err('用法: ss 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  clearAllSelectedInplace(newCells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    console.log('cmdSetSelectCells-pos', pos);
    if (!pos || pos.row === undefined) {
      return err('用法: ss 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else if (!pos.digit) {
      setSelectCellInplace(newCells, pos.row, pos.col);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else {
      setSelectedCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdSetSelectRows: CmdHandler = (schema, args) => { 
  if (args.length === 0) {
    return err('用法: srs 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedRows(schema, cols));
};

const cmdAddSelectRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sra 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedRows(schema, cols));
};

const cmdJoinSelectRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: srj 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedRows(schema, cols));
};

const cmdSetSelectCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: scs 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedCols(schema, cols));
};

const cmdAddSelectCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sca 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedCols(schema, cols));
};
const cmdJoinSelectCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: scj 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedCols(schema, cols));
};

const cmdSetSelectBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sb 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedBoxes(schema, boxes));
};
const cmdAddSelectBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sba 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedBoxes(schema, boxes));
};
const cmdJoinSelectBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sbj 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedBoxes(schema, boxes));
};

const cmdUnSelectAll: CmdHandler = (schema) => {
  return ok(clearAllSelected(schema));
};
const cmdAutoFillUniqueCandidate: CmdHandler = (schema) => {
  const result = autofillUniqueCandidate(schema);
  if (result === schema) {
    return err('没有可自动填充的格子');
  }
  return ok(result);
};

const cmdFillUniqueCandidate: CmdHandler = (schema, args) => {
  console.log('cmdFillUniqueCandidate-args', args)
  if (args.length === 0) {
    return err('用法: fuc 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    console.log('cmdFillUniqueCandidate-pos', pos)
    if (!pos || pos.row === undefined) {
      return err('用法: fuc 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
    } else {
      fillUniqueCandidateInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
}

const cmdFillUniqueRow: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: fur 12 23 88');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parseRowDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: fur 11 32 78');
    } else if (!pos.digit) {
      setSelectRowInplace(newCells, pos.row);
      break;
    } else {
      fillUniqueRowInplace(newCells, pos.row, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
}

const cmdFillUniqueCol: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: fuc 12 23 88');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parseColDigit(arg);
    if (!pos || pos.col === undefined) {
      return err('用法: fuc 11 32 78');
    } else if (!pos.digit) {
      setSelectColInplace(newCells, pos.col);
      break;
    } else {
      fillUniqueColInplace(newCells, pos.col, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
}

const cmdFillUniqueBox: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: fub 12 23 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parseBoxDigit(arg);
    if (!pos || pos.box === undefined) {
      return err('用法: fub 11 32 78');
    } else if (!pos.digit) {
      setSelectBoxInplace(newCells, pos.box);
      break;
    } else {
      fillUniqueBoxInplace(newCells, pos.box, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
}

/** new - 生成新题目 */
const cmdNew: CmdHandler = (_schema, args) => {
  const nums: number[][] = [];

  if (args.length < 1 || args[0].length < 81) {
    return err('用法: new 123456789123456789123456789123456789123456789123456789123456789123456789123456789');
  }
  const arg = args[0];

  for (let i = 0; i < 9; i++) {
    nums.push([])
    for (let j = 0; j < 9; j++) {
      const idx = i * 9 + j; 
      nums[i].push(Number(arg[idx]));
    }
  }
  return ok(createNewSchema(nums));
};

// ============================================================================
// 命令注册表
// ============================================================================

const commandRegistry: Map<string, CmdHandler> = new Map();

/** 注册命令 */
function register(name: string, handler: CmdHandler): void {
  commandRegistry.set(name.toLowerCase(), handler);
}

/** 初始化命令注册表 */
function initRegistry(): void {
  // 基础操作
  register('set', cmdSet); // set 
  register('unset', cmdUnset); // unset 
  register('hra', cmdAddHighlightRows); // highlight rows
  register('hr', cmdSetHighlightRows); // set highlight rows
  register('hrs', cmdSetHighlightRows); // set highlight rows
  register('hrj', cmdJoinHighlightRows); // join highlight rows
  register('hca', cmdAddHighlightCols); // highlight cols
  register('hc', cmdSetHighlightCols); // set highlight cols
  register('hcs', cmdSetHighlightCols); // set highlight cols
  register('hcj', cmdJoinHighlightCols); // join highlight cols
  register('hba', cmdAddHighlightBoxes); // highlight boxes
  register('hb', cmdSetHighlightBoxes); // set highlight boxes
  register('hbs', cmdSetHighlightBoxes); // set highlight boxes
  register('hbj', cmdJoinHighlightBoxes); // join highlight boxes
  register('hda', cmdAddHighlightDigits); // highlight digits
  register('h', cmdSetHighlightDigits); // set highlight digits
  register('hd', cmdSetHighlightDigits); // set highlight digits
  register('hds', cmdSetHighlightDigits); // set highlight digits
  register('hdj', cmdJoinHighlightDigits); // join highlight digits
  register('ha', cmdAddHighlightCells); // highlight cells
  register('hs', cmdSetHighlightCells); // set highlight cells
  register('hxy', cmdSetHighlightXY); // set highlight xy
  register('hxys', cmdSetHighlightXY); // set highlight xy
  register('hxya', cmdAddHighlightXY); // add highlight xy
  register('hxyj', cmdJoinHighlightXY); // join highlight xy
  register('uh', cmdUnHighlightAll); // unhighlight all
  register('s', cmdSetSelectCells); // set select cells
  register('ss', cmdSetSelectCells); // set select cells
  register('sa', cmdAddSelectCells); // add select cells
  register('sr', cmdSetSelectRows);
  register('srs', cmdSetSelectRows);
  register('sra', cmdAddSelectRows);
  register('srj', cmdJoinSelectRows);
  register('sc', cmdSetSelectCols);
  register('scs', cmdSetSelectCols);
  register('scc', cmdAddSelectCols);
  register('scj', cmdJoinSelectCols);
  register('sb', cmdSetSelectBoxes);
  register('sbs', cmdSetSelectBoxes);
  register('sba', cmdAddSelectBoxes);
  register('sbj', cmdJoinSelectBoxes);
  register('us', cmdUnSelectAll);


  register('fu', cmdFillUniqueCandidate);
  register('fur', cmdFillUniqueRow);
  register('fuc', cmdFillUniqueCol);
  register('fub', cmdFillUniqueBox);

  register('autofuc', cmdAutoFillUniqueCandidate);

  register('new', cmdNew);
  // undo/redo 标记为 noop，由外部处理
  register('u', () => noop());
  register('undo', () => noop());
  register('r', () => noop());
  register('redo', () => noop());
}

// 初始化
initRegistry();

// ============================================================================
// 主入口
// ============================================================================

/**
 * 执行单条命令
 * @param schema 当前数独状态
 * @param command 命令字符串
 * @returns 执行结果
 */
export function executeCommand(schema: SudokuSchema, command: string): CmdResult {
  const s = command.trim();
  if (!s) return err('空命令');

  const parts = s.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const handler = commandRegistry.get(cmd);
  if (!handler) {
    return err(`未知命令: ${cmd}`);
  }

  try {
    const schema2 = handler(schema, args);
    console.log(cmd, schema2)
    return schema2
  } catch (e) {
    return err(`执行错误: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 批量执行命令（分号分隔）
 * @param schema 当前数独状态
 * @param commands 命令字符串（可多命令，分号分隔）
 * @returns 执行结果和最终 schema
 */
export function executeCommands(
  schema: SudokuSchema,
  commands: string
): { result: CmdResult; finalSchema: SudokuSchema } {
  const cmds = commands
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  let currentSchema = schema;
  let lastResult: CmdResult = { type: 'noop' };

  for (const cmd of cmds) {
    lastResult = executeCommand(currentSchema, cmd);

    if (lastResult.type === 'error') {
      break;
    }

    if (lastResult.type === 'ok') {
      currentSchema = lastResult.schema;
    }
    // noop 不改变 schema
  }

  return {
    result: lastResult,
    finalSchema: currentSchema,
  };
}

/**
 * 获取命令列表（用于帮助/自动补全）
 * @returns 命令名称列表
 */
export function getCommandList(): string[] {
  return Array.from(commandRegistry.keys()).sort();
}

/**
 * 检查命令是否存在
 * @param name 命令名称
 * @returns 是否存在
 */
export function hasCommand(name: string): boolean {
  return commandRegistry.has(name.toLowerCase());
}

// ============================================================================
// 导出类型和工具函数（已在定义处导出）
// ============================================================================

// parsePos, parsePosDigit 和类型 Pos, PosDigit 已在定义处通过 export 关键字导出
