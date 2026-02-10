/**
 * Select Commands - 选择相关命令
 */

import type { SudokuSchema } from '@/types/sudoku';
import type { CmdResult, CommandConfig } from './types';
import {
  cloneCells,
  setSelectRowInplace,
  setSelectCellInplace,
  setSelectColInplace,
  setSelectBoxInplace,
  setSelectedCellInplace,
  clearAllSelectedInplace,
  clearAllSelected,
  setSelectedRows,
  addSelectedRows,
  joinSelectedRows,
  setSelectedCols,
  addSelectedCols,
  joinSelectedCols,
  setSelectedBoxes,
  addSelectedBoxes,
  joinSelectedBoxes,
} from '@/lib/SudokuEngine';

const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });
const err = (msg: string): CmdResult => ({ type: 'error', msg });

const clampRC = (n: number): number => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number): number => clampRC(n) - 1;

/** 解析 115 格式的位置 */
function parsePos(token: string): { row: number; col: number } | null {
  const t = token.trim().toLowerCase();
  if (t.length >= 2) {
    const row = toZeroIdx(Number(t[0]));
    const col = toZeroIdx(Number(t[1]));
    return { row, col };
  }
  return null;
}

// ============================================================================
// 命令处理器
// ============================================================================

// 选择格子
const cmdSs = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) {
    return err('用法: ss 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  clearAllSelectedInplace(newCells);
  for (const arg of args) {
    const pos = parsePos(arg);
    if (!pos) {
      return err('用法: ss 11 32 78');
    }
    setSelectedCellInplace(newCells, pos.row, pos.col);
  }
  return ok({ ...schema, cells: newCells });
};

const cmdSa = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) {
    return err('用法: sa 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePos(arg);
    if (!pos) {
      return err('用法: sa 11 32 78');
    }
    setSelectedCellInplace(newCells, pos.row, pos.col);
  }
  return ok({ ...schema, cells: newCells });
};

// 选择行
const cmdSrs = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: srs 1 3 7');
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedRows(schema, rows));
};

const cmdSra = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: sra 1 3 7');
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedRows(schema, rows));
};

const cmdSrj = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: srj 1 3 7');
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedRows(schema, rows));
};

// 选择列
const cmdScs = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: scs 1 3 7');
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedCols(schema, cols));
};

const cmdSca = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: sca 1 3 7');
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedCols(schema, cols));
};

const cmdScj = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: scj 1 3 7');
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedCols(schema, cols));
};

// 选择宫
const cmdSbs = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: sbs 1 3 7');
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedBoxes(schema, boxes));
};

const cmdSba = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: sba 1 3 7');
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedBoxes(schema, boxes));
};

const cmdSbj = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: sbj 1 3 7');
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedBoxes(schema, boxes));
};

// 清除选择
const cmdUs = (schema: SudokuSchema): CmdResult => ok(clearAllSelected(schema));

// ============================================================================
// 命令配置
// ============================================================================

export const selectCommands: CommandConfig = {
  // 选择格子
  ss: {
    meta: {
      name: 'ss',
      aliases: ['s'],
      description: '设置选择格子（替换现有）',
      category: 'select',
      args: [{ type: 'pos', name: 'positions', description: '位置如 11, 23', repeatable: true }],
      examples: ['ss 12 34 42'],
    },
    handler: cmdSs,
  },
  sa: {
    meta: {
      name: 'sa',
      aliases: [],
      description: '添加选择格子',
      category: 'select',
      args: [{ type: 'pos', name: 'positions', description: '位置如 11, 23', repeatable: true }],
      examples: ['sa 12 34 42'],
    },
    handler: cmdSa,
  },

  // 选择行
  srs: {
    meta: {
      name: 'srs',
      aliases: ['sr'],
      description: '设置选择行（替换现有）',
      category: 'select',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['srs 1 3 7'],
    },
    handler: cmdSrs,
  },
  sra: {
    meta: {
      name: 'sra',
      aliases: [],
      description: '添加选择行',
      category: 'select',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['sra 1 3 7'],
    },
    handler: cmdSra,
  },
  srj: {
    meta: {
      name: 'srj',
      aliases: [],
      description: '选择行取交集',
      category: 'select',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['srj 1 3 7'],
    },
    handler: cmdSrj,
  },

  // 选择列
  scs: {
    meta: {
      name: 'scs',
      aliases: ['sc'],
      description: '设置选择列（替换现有）',
      category: 'select',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['scs 1 3 7'],
    },
    handler: cmdScs,
  },
  sca: {
    meta: {
      name: 'sca',
      aliases: ['scc'],
      description: '添加选择列',
      category: 'select',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['sca 1 3 7'],
    },
    handler: cmdSca,
  },
  scj: {
    meta: {
      name: 'scj',
      aliases: [],
      description: '选择列取交集',
      category: 'select',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['scj 1 3 7'],
    },
    handler: cmdScj,
  },

  // 选择宫
  sbs: {
    meta: {
      name: 'sbs',
      aliases: ['sb'],
      description: '设置选择宫（替换现有）',
      category: 'select',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['sbs 1 3 7'],
    },
    handler: cmdSbs,
  },
  sba: {
    meta: {
      name: 'sba',
      aliases: [],
      description: '添加选择宫',
      category: 'select',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['sba 1 3 7'],
    },
    handler: cmdSba,
  },
  sbj: {
    meta: {
      name: 'sbj',
      aliases: [],
      description: '选择宫取交集',
      category: 'select',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['sbj 1 3 7'],
    },
    handler: cmdSbj,
  },

  // 清除选择
  us: {
    meta: {
      name: 'us',
      aliases: [],
      description: '取消所有选择',
      category: 'select',
      args: [],
      examples: ['us'],
    },
    handler: cmdUs,
  },
};
