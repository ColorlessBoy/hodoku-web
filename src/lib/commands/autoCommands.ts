/**
 * Auto Commands - 自动填充相关命令
 */

import type { SudokuSchema } from '@/types/sudoku';
import type { CmdResult, CommandConfig } from './types';
import {
  autofillUniqueCandidate,
  fillUniqueCandidateInplace,
  fillUniqueRowInplace,
  fillUniqueColInplace,
  fillUniqueBoxInplace,
  cloneCells,
  setSelectRowInplace,
  setSelectColInplace,
  setSelectBoxInplace,
} from '@/lib/SudokuEngine';

const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });
const err = (msg: string): CmdResult => ({ type: 'error', msg });

const clampRC = (n: number): number => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number): number => clampRC(n) - 1;

// ============================================================================
// 命令处理器
// ============================================================================

const cmdAutofuc = (schema: SudokuSchema): CmdResult => {
  const result = autofillUniqueCandidate(schema);
  if (result === schema) {
    return err('没有可自动填充的格子');
  }
  return ok(result);
};

const cmdFu = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) {
    return err('用法: fu 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const t = arg.trim().toLowerCase();
    if (t.length >= 2) {
      const row = toZeroIdx(Number(t[0]));
      const col = toZeroIdx(Number(t[1]));
      fillUniqueCandidateInplace(newCells, row, col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdFur = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) {
    return err('用法: fur 12 23 88');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const t = arg.trim();
    if (t.length > 0) {
      const row = toZeroIdx(Number(t[0]));
      const digit = t.length > 1 ? (clampRC(Number(t[1])) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) : undefined;
      if (digit !== undefined) {
        fillUniqueRowInplace(newCells, row, digit);
      } else {
        setSelectRowInplace(newCells, row);
      }
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdFuc = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) {
    return err('用法: fucol 12 23 88');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const t = arg.trim();
    if (t.length > 0) {
      const col = toZeroIdx(Number(t[0]));
      const digit = t.length > 1 ? (clampRC(Number(t[1])) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) : undefined;
      if (digit !== undefined) {
        fillUniqueColInplace(newCells, col, digit);
      } else {
        setSelectColInplace(newCells, col);
      }
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdFub = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) {
    return err('用法: fub 12 23 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const t = arg.trim();
    if (t.length > 0) {
      const box = toZeroIdx(Number(t[0]));
      const digit = t.length > 1 ? (clampRC(Number(t[1])) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) : undefined;
      if (digit !== undefined) {
        fillUniqueBoxInplace(newCells, box, digit);
      } else {
        setSelectBoxInplace(newCells, box);
      }
    }
  }
  return ok({ ...schema, cells: newCells });
};

// ============================================================================
// 命令配置
// ============================================================================

export const autoCommands: CommandConfig = {
  autofuc: {
    meta: {
      name: 'autofuc',
      aliases: ['auto'],
      description: '自动填充所有唯一候选数',
      category: 'auto',
      args: [],
      examples: ['autofuc', 'auto'],
    },
    handler: cmdAutofuc,
  },
  fu: {
    meta: {
      name: 'fu',
      aliases: ['fuc'],
      description: '填充指定格子的唯一候选数',
      category: 'auto',
      args: [{ type: 'pos', name: 'positions', description: '位置如 11, 23', repeatable: true }],
      examples: ['fu 11 32', 'fuc 11'],
    },
    handler: cmdFu,
  },
  fur: {
    meta: {
      name: 'fur',
      aliases: [],
      description: '填充行内唯一数',
      category: 'auto',
      args: [{ type: 'row', name: 'positions', description: '行+数字如 23 表示行2的3', repeatable: true }],
      examples: ['fur 23 15'],
    },
    handler: cmdFur,
  },
  fucol: {
    meta: {
      name: 'fucol',
      aliases: [],
      description: '填充列内唯一数',
      category: 'auto',
      args: [{ type: 'col', name: 'positions', description: '列+数字如 23 表示列2的3', repeatable: true }],
      examples: ['fucol 23 15'],
    },
    handler: cmdFuc,
  },
  fub: {
    meta: {
      name: 'fub',
      aliases: [],
      description: '填充宫内唯一数',
      category: 'auto',
      args: [{ type: 'box', name: 'positions', description: '宫+数字如 23 表示宫2的3', repeatable: true }],
      examples: ['fub 23 15'],
    },
    handler: cmdFub,
  },
};
