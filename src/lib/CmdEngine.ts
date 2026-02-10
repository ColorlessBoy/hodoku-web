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
  autofillUniqueCandidates,
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
  fillCandidates,
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
} from './SudokuEngine';

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

/** 创建成功的结果 */
const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });

/** 创建错误结果 */
const err = (msg: string): CmdResult => ({ type: 'error', msg });

/** 创建无操作结果 */
const noop = (): CmdResult => ({ type: 'noop' });

// ============================================================================
// 命令处理器
// ============================================================================

/** s - 设置格子值，如果没有输入完整，则自动改成 Select 操作 */
const cmdSet: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: s 115 327 781');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || !pos.row) {
      return err('用法: s 115 327 781');
    }
    if (!pos.col) {
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
    return err('用法: us 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || !pos.row) {
      return err('用法: c 11 32 78');
    }
    if (!pos.col) {
      setSelectRowInplace(newCells, pos.row);
      break; // 自动改成 Select 操作, 并且只处理到不全的位置
    } else {
      unsetCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdAddHighlightRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hr 1 3 7');
  }
  const rows = args.map((arg) => clampRC(Number(arg)));
  return ok(addHighlightedRows(schema, rows));
};

const cmdSetHighlightedRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hr0 1 3 7');
  }
  const rows = args.map((arg) => clampRC(Number(arg)));
  return ok(setHighlightedRows(schema, rows));
};

const cmdAddHighlightCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hc 1 3 7');
  }
  const cols = args.map((arg) => clampRC(Number(arg)));
  return ok(addHighlightedCols(schema, cols));
};

const cmdSetHighlightCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hc0 1 3 7');
  }
  const cols = args.map((arg) => clampRC(Number(arg)));
  return ok(setHighlightedCols(schema, cols));
};
const cmdAddHighlightBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hb 1 3 7');
  }
  const boxes = args.map((arg) => clampRC(Number(arg)));
  return ok(addHighlightedBoxes(schema, boxes));
};
const cmdSetHighlightBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hb0 1 3 7');
  }
  const boxes = args.map((arg) => clampRC(Number(arg)));
  return ok(setHighlightedBoxes(schema, boxes));
};
const cmdAddHighlightCells: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: h 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || !pos.row) {
      return err('用法: h 11 32 78');
    }
    if (!pos.col) {
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
    return err('用法: h0 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  clearAllHighlightedInplace(newCells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || !pos.row) {
      return err('用法: h0 11 32 78');
    }
    if (!pos.col) {
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
    return err('用法: hd 1 3 7');
  }
  const digits = args.map((arg) => clampRC(Number(arg)) as Digit);
  return ok(addHighlightedDigits(schema, digits));
};

const cmdSetHighlightDigits: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hd0 1 3 7');
  }
  const digits = args.map((arg) => clampRC(Number(arg)) as Digit);
  return ok(setHighlightedDigits(schema, digits));
};

const cmdUnHighlightAll: CmdHandler = (schema, args) => {
  return ok(clearAllHighlighted(schema));
};

/** new / generate - 生成新题目 */
const cmdNew: CmdHandler = (_schema, args) => {
  const n = parseInt(args[0] ?? '', 10);
  const minClues = Number.isNaN(n) ? 25 : Math.max(17, Math.min(81, n));
  return ok(gridToSchema(generatePuzzle(minClues)));
};

/** auto - 自动填充唯一候选数 */
const cmdAuto: CmdHandler = (schema) => {
  const result = autofillUniqueCandidates(schema);
  if (result === schema) {
    return err('没有可自动填充的格子');
  }
  return ok(result);
};

/** last - 最后一位 */
const cmdLast: CmdHandler = (schema, args) => {
  const unit = args[0]?.toLowerCase();
  const idx = Number(args[1]);
  const d = Number(args[2]);

  if (!(idx >= 1 && idx <= 9)) {
    return err('用法: last r|c|b 1-9 1-9');
  }
  if (!(d >= 1 && d <= 9)) {
    return err('用法: last r|c|b 1-9 1-9');
  }

  let result: SudokuSchema | null = null;
  if (unit === 'r') {
    result = lastDigitRow(schema, idx - 1, d as Digit);
  } else if (unit === 'c') {
    result = lastDigitCol(schema, idx - 1, d as Digit);
  } else if (unit === 'b') {
    result = lastDigitBox(schema, idx - 1, d as Digit);
  } else {
    return err('用法: last r|c|b 1-9 1-9');
  }

  if (!result || result === schema) {
    return err('没有可填充的格子');
  }
  return ok(result);
};

/** np - 裸对 */
const cmdNakedPair: CmdHandler = (schema, args) => {
  const a = parsePosDigit(args[0] ?? '');
  const b = parsePosDigit(args[1] ?? '');
  if (!a || !b) {
    return err('用法: np r1c1:5 r2c2:6 或 np 115 226');
  }
  const result = nakedPair(schema, a.digit, b.digit, a.pos, b.pos);
  if (result === schema) {
    return err('不满足裸对条件');
  }
  return ok(result);
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
  register('s', cmdSet);
  register('set', cmdSet);
  register('us', cmdUnset);
  register('hr', cmdAddHighlightRows);
  register('hr0', cmdAddHighlightRows);
  register('hc', cmdAddHighlightCols);
  register('hc0', cmdSetHighlightCols);
  register('hb', cmdAddHighlightBoxes);
  register('hb0', cmdSetHighlightBoxes);
  register('hd', cmdAddHighlightDigits);
  register('hd0', cmdSetHighlightDigits);
  register('h', cmdAddHighlightCells);
  register('h0', cmdSetHighlightCells);
  register('uh', cmdUnHighlightAll);

  register('new', cmdNew);
  register('generate', cmdNew);
  register('auto', cmdAuto);
  register('last', cmdLast);
  register('np', cmdNakedPair);

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
    return handler(schema, args);
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
