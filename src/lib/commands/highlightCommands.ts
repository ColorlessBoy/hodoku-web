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
import { ok } from './utils';
import { createBatchCommands, createDigitCommands } from './builders';

// ============================================================================
// 处理器
// ============================================================================

const cmdHxys = (schema: SudokuSchema): CmdResult => ok(setHighlightedXY(schema));
const cmdHxya = (schema: SudokuSchema): CmdResult => ok(addHighlightedXY(schema));
const cmdHxyj = (schema: SudokuSchema): CmdResult => ok(joinHighlightedXY(schema));
const cmdUh = (schema: SudokuSchema): CmdResult => ok(clearAllHighlighted(schema));

// ============================================================================
// 命令配置
// ============================================================================

export const highlightCommands: CommandConfig = {
  // 行高亮
  ...createBatchCommands(
    { set: setHighlightedRows, add: addHighlightedRows, join: joinHighlightedRows },
    'row',
    'h'
  ),

  // 列高亮
  ...createBatchCommands(
    { set: setHighlightedCols, add: addHighlightedCols, join: joinHighlightedCols },
    'col',
    'h'
  ),

  // 宫高亮
  ...createBatchCommands(
    { set: setHighlightedBoxes, add: addHighlightedBoxes, join: joinHighlightedBoxes },
    'box',
    'h'
  ),

  // 数字高亮
  ...createDigitCommands(
    { set: setHighlightedDigits, add: addHighlightedDigits, join: joinHighlightedDigits },
    'hd',
    'highlight'
  ),

  // XY 高亮
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
