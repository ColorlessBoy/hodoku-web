/**
 * History Commands - 撤销/重做相关命令
 *
 * 这些命令由外部处理，这里只注册为 no-op
 */

import type { SudokuSchema } from '@/types/sudoku';
import type { CommandConfig } from './types';
import { noop } from './utils';

export const historyCommands: CommandConfig = {
  undo: {
    meta: {
      name: 'undo',
      aliases: ['u'],
      description: '撤销上一步操作',
      category: 'history',
      args: [],
      examples: ['undo', 'u'],
    },
    handler: (schema: SudokuSchema) => noop(),
  },
  redo: {
    meta: {
      name: 'redo',
      aliases: ['r'],
      description: '重做下一步操作',
      category: 'history',
      args: [],
      examples: ['redo', 'r'],
    },
    handler: (schema: SudokuSchema) => noop(),
  },
};
