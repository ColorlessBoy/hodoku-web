/**
 * Select Commands - 选择相关命令
 */

import type { SudokuSchema } from '@/types/sudoku';
import type { CmdResult, CommandConfig } from './types';
import {
  cloneCells,
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
import { ok, err } from './utils';
import { createBatchCommands } from './builders';
import { parsePos } from './parsers';

// ============================================================================
// 处理器
// ============================================================================

const cmdSs = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: ss 11 32 78');
  const newCells = cloneCells(schema.cells);
  clearAllSelectedInplace(newCells);
  for (const arg of args) {
    const pos = parsePos(arg);
    if (!pos) return err('用法: ss 11 32 78');
    setSelectedCellInplace(newCells, pos.row, pos.col);
  }
  return ok({ ...schema, cells: newCells });
};

const cmdSa = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: sa 11 32 78');
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePos(arg);
    if (!pos) return err('用法: sa 11 32 78');
    setSelectedCellInplace(newCells, pos.row, pos.col);
  }
  return ok({ ...schema, cells: newCells });
};

const cmdUs = (schema: SudokuSchema): CmdResult => ok(clearAllSelected(schema));

// ============================================================================
// 配置
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
  ...createBatchCommands(
    { set: setSelectedRows, add: addSelectedRows, join: joinSelectedRows },
    'row',
    's'
  ),

  // 选择列
  ...createBatchCommands(
    { set: setSelectedCols, add: addSelectedCols, join: joinSelectedCols },
    'col',
    's'
  ),

  // 选择宫
  ...createBatchCommands(
    { set: setSelectedBoxes, add: addSelectedBoxes, join: joinSelectedBoxes },
    'box',
    's'
  ),

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
