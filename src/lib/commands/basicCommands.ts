/**
 * Basic Commands - 基础操作命令
 *
 * 包含 set, unset, new 等基础数独操作命令
 */

import type { SudokuSchema, Digit } from '@/types/sudoku';
import type { CmdResult, CommandConfig } from './types';
import {
  cloneCells,
  setCellInplace,
  unsetCellInplace,
  setSelectRowInplace,
  setSelectCellInplace,
  createNewSchema,
} from '@/lib/SudokuEngine';
import { getBoxIndex } from '@/types/sudoku';

// ============================================================================
// 工具函数
// ============================================================================

const clampRC = (n: number): number => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number): number => clampRC(n) - 1;

const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });
const err = (msg: string): CmdResult => ({ type: 'error', msg });

/** 解析 115 格式的位置+数字 */
function parsePosDigit(token: string): { row: number; col: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length >= 2) {
    const row = toZeroIdx(Number(t[0]));
    const col = toZeroIdx(Number(t[1]));
    const digit = t.length > 2 ? (clampRC(Number(t[2])) as Digit) : undefined;
    return { row, col, digit };
  }
  return null;
}

// ============================================================================
// 命令处理器
// ============================================================================

const cmdSet: (schema: SudokuSchema, args: string[]) => CmdResult = (schema, args) => {
  if (args.length === 0) {
    return err('用法: s 115 327 781');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos) {
      return err('用法: set 115 327 781');
    }
    if (pos.digit === undefined) {
      setSelectCellInplace(newCells, pos.row, pos.col);
      break;
    } else {
      setCellInplace(newCells, pos.row, pos.col, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdUnset: (schema: SudokuSchema, args: string[]) => CmdResult = (schema, args) => {
  if (args.length === 0) {
    return err('用法: unset 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos) {
      return err('用法: c 11 32 78');
    }
    unsetCellInplace(newCells, pos.row, pos.col);
  }
  return ok({ ...schema, cells: newCells });
};

const cmdNew: (schema: SudokuSchema, args: string[]) => CmdResult = (_schema, args) => {
  if (args.length < 1 || args[0].length < 81) {
    return err('用法: new 123456789... (81位数字)');
  }
  const arg = args[0];
  const nums: number[][] = [];

  for (let i = 0; i < 9; i++) {
    nums.push([]);
    for (let j = 0; j < 9; j++) {
      const idx = i * 9 + j;
      nums[i].push(Number(arg[idx]));
    }
  }
  const newSchema = createNewSchema(nums);
  if (!newSchema) {
    return err('无效的数独数据');
  }
  return ok(newSchema);
};

// ============================================================================
// 命令配置
// ============================================================================

export const basicCommands: CommandConfig = {
  set: {
    meta: {
      name: 'set',
      aliases: ['s'],
      description: '设置格子值（行+列+数字 格式）',
      category: 'basic',
      args: [
        {
          type: 'pos',
          name: 'positions',
          description: '位置+数字，如 115 表示行1列1设置值为5',
          repeatable: true,
        },
      ],
      examples: ['set 115 326', 's 115 326'],
    },
    handler: cmdSet,
  },

  unset: {
    meta: {
      name: 'unset',
      aliases: ['us', 'c'],
      description: '清除格子值',
      category: 'basic',
      args: [
        {
          type: 'pos',
          name: 'positions',
          description: '位置，如 11 表示行1列1',
          repeatable: true,
        },
      ],
      examples: ['unset 11 32', 'c 11 32'],
    },
    handler: cmdUnset,
  },

  new: {
    meta: {
      name: 'new',
      aliases: [],
      description: '导入新题目（81位数字）',
      category: 'new',
      args: [
        {
          type: 'string',
          name: 'puzzle',
          description: '81位数字字符串，0表示空格',
        },
      ],
      examples: [
        'new 530070000600195000098006800800060003400803001700020006060000280000419005000080079',
      ],
    },
    handler: cmdNew,
  },
};
