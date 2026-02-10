/**
 * Highlight Commands - 高亮相关命令
 */

import type { SudokuSchema } from '@/types/sudoku';
import type { CmdResult, CommandConfig } from './types';
import {
  addHighlightedRows,
  setHighlightedRows,
  joinHighlightedRows,
  addHighlightedCols,
  setHighlightedCols,
  joinHighlightedCols,
  addHighlightedBoxes,
  setHighlightedBoxes,
  joinHighlightedBoxes,
  setHighlightedDigits,
  addHighlightedDigits,
  joinHighlightedDigits,
  setHighlightedXY,
  addHighlightedXY,
  joinHighlightedXY,
  clearAllHighlighted,
} from '@/lib/SudokuEngine';

const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });
const err = (msg: string): CmdResult => ({ type: 'error', msg });

const clampRC = (n: number): number => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number): number => clampRC(n) - 1;

// 行高亮
const cmdHra = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hra 1 3 7');
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedRows(schema, rows));
};

const cmdHrs = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hrs 1 3 7');
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedRows(schema, rows));
};

const cmdHrj = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hrj 1 3 7');
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedRows(schema, rows));
};

// 列高亮
const cmdHca = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hca 1 3 7');
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedCols(schema, cols));
};

const cmdHcs = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hcs 1 3 7');
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedCols(schema, cols));
};

const cmdHcj = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hcj 1 3 7');
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedCols(schema, cols));
};

// 宫高亮
const cmdHba = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hba 1 3 7');
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedBoxes(schema, boxes));
};

const cmdHbs = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hbs 1 3 7');
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedBoxes(schema, boxes));
};

const cmdHbj = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hbj 1 3 7');
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedBoxes(schema, boxes));
};

// 数字高亮
const cmdHda = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hda 1 3 7');
  const digits = args.map((arg) => clampRC(Number(arg)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
  return ok(addHighlightedDigits(schema, digits));
};

const cmdHds = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hds 1 3 7');
  const digits = args.map((arg) => clampRC(Number(arg)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
  return ok(setHighlightedDigits(schema, digits));
};

const cmdHdj = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: hdj 1 3 7');
  const digits = args.map((arg) => clampRC(Number(arg)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
  return ok(joinHighlightedDigits(schema, digits));
};

// XY 高亮（双候选数）
const cmdHxys = (schema: SudokuSchema): CmdResult => ok(setHighlightedXY(schema));
const cmdHxya = (schema: SudokuSchema): CmdResult => ok(addHighlightedXY(schema));
const cmdHxyj = (schema: SudokuSchema): CmdResult => ok(joinHighlightedXY(schema));

// 清除高亮
const cmdUh = (schema: SudokuSchema): CmdResult => ok(clearAllHighlighted(schema));

// ============================================================================
// 命令配置
// ============================================================================

export const highlightCommands: CommandConfig = {
  // 行高亮
  hra: {
    meta: {
      name: 'hra',
      aliases: [],
      description: '添加高亮行',
      category: 'highlight',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['hra 1 3 7'],
    },
    handler: cmdHra,
  },
  hrs: {
    meta: {
      name: 'hrs',
      aliases: ['hr'],
      description: '设置高亮行（替换现有）',
      category: 'highlight',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['hrs 1 3 7'],
    },
    handler: cmdHrs,
  },
  hrj: {
    meta: {
      name: 'hrj',
      aliases: [],
      description: '高亮行取交集',
      category: 'highlight',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['hrj 1 3 7'],
    },
    handler: cmdHrj,
  },

  // 列高亮
  hca: {
    meta: {
      name: 'hca',
      aliases: [],
      description: '添加高亮列',
      category: 'highlight',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['hca 1 3 7'],
    },
    handler: cmdHca,
  },
  hcs: {
    meta: {
      name: 'hcs',
      aliases: ['hc'],
      description: '设置高亮列（替换现有）',
      category: 'highlight',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['hcs 1 3 7'],
    },
    handler: cmdHcs,
  },
  hcj: {
    meta: {
      name: 'hcj',
      aliases: [],
      description: '高亮列取交集',
      category: 'highlight',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['hcj 1 3 7'],
    },
    handler: cmdHcj,
  },

  // 宫高亮
  hba: {
    meta: {
      name: 'hba',
      aliases: [],
      description: '添加高亮宫',
      category: 'highlight',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['hba 1 3 7'],
    },
    handler: cmdHba,
  },
  hbs: {
    meta: {
      name: 'hbs',
      aliases: ['hb'],
      description: '设置高亮宫（替换现有）',
      category: 'highlight',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['hbs 1 3 7'],
    },
    handler: cmdHbs,
  },
  hbj: {
    meta: {
      name: 'hbj',
      aliases: [],
      description: '高亮宫取交集',
      category: 'highlight',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['hbj 1 3 7'],
    },
    handler: cmdHbj,
  },

  // 数字高亮
  hda: {
    meta: {
      name: 'hda',
      aliases: [],
      description: '添加高亮数字',
      category: 'highlight',
      args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
      examples: ['hda 1 3 7'],
    },
    handler: cmdHda,
  },
  hds: {
    meta: {
      name: 'hds',
      aliases: ['h', 'hd'],
      description: '设置高亮数字（替换现有）',
      category: 'highlight',
      args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
      examples: ['hds 1 3 7'],
    },
    handler: cmdHds,
  },
  hdj: {
    meta: {
      name: 'hdj',
      aliases: [],
      description: '高亮数字取交集',
      category: 'highlight',
      args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
      examples: ['hdj 1 3 7'],
    },
    handler: cmdHdj,
  },

  // XY 高亮（双候选数）
  hxys: {
    meta: {
      name: 'hxys',
      aliases: ['hxy'],
      description: '高亮双候选数格子',
      category: 'highlight',
      args: [],
      examples: ['hxys'],
    },
    handler: cmdHxys,
  },
  hxya: {
    meta: {
      name: 'hxya',
      aliases: [],
      description: '添加高亮双候选数格子',
      category: 'highlight',
      args: [],
      examples: ['hxya'],
    },
    handler: cmdHxya,
  },
  hxyj: {
    meta: {
      name: 'hxyj',
      aliases: [],
      description: '高亮双候选数格子取交集',
      category: 'highlight',
      args: [],
      examples: ['hxyj'],
    },
    handler: cmdHxyj,
  },

  // 清除高亮
  uh: {
    meta: {
      name: 'uh',
      aliases: [],
      description: '取消所有高亮',
      category: 'highlight',
      args: [],
      examples: ['uh'],
    },
    handler: cmdUh,
  },
};
