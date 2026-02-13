/**
 * Basic Commands - 基础操作命令
 *
 * 使用类继承方式定义命令
 */

import type { SudokuSchema } from '@/types/sudoku';
import type { CmdResult, ArgDef } from './types';
import {
  cloneCells,
  setCellInplace,
  unsetCellInplace,
  setSelectCellInplace,
  createNewSchema,
} from '@/lib/sudoku';
import { ok, err } from './utils';
import { parsePosDigit } from './parsers';
import { BaseCommand } from './Command';

// ============================================================================
// 参数定义复用
// ============================================================================

const posArg: ArgDef = {
  type: 'pos',
  name: 'positions',
  description: '位置+数字，如 115 表示行1列1设置值为5',
  repeatable: true,
};

const posArgNoDigit: ArgDef = {
  type: 'pos',
  name: 'positions',
  description: '位置，如 11 表示行1列1',
  repeatable: true,
};

const puzzleArg: ArgDef = {
  type: 'string',
  name: 'puzzle',
  description: '81位数字字符串，0表示空格',
};

// ============================================================================
// 命令类定义
// ============================================================================

class SetCommand extends BaseCommand {
  constructor() {
    super({
      name: 'set',
      aliases: ['s'],
      category: 'basic',
      description: '设置格子值（行+列+数字 格式）',
      args: [posArg],
      examples: ['set 115 326', 's 115 326'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    const newCells = cloneCells(schema.cells);

    for (const arg of args) {
      const pos = parsePosDigit(arg);
      if (!pos) return err('无效的参数格式');

      if (pos.digit === undefined) {
        setSelectCellInplace(newCells, pos.row, pos.col);
        break;
      } else {
        setCellInplace(newCells, pos.row, pos.col, pos.digit);
      }
    }

    return ok({ ...schema, cells: newCells });
  }
}

class UnsetCommand extends BaseCommand {
  constructor() {
    super({
      name: 'unset',
      aliases: ['us', 'c'],
      category: 'basic',
      description: '清除格子值',
      args: [posArgNoDigit],
      examples: ['unset 11 32', 'c 11 32'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    const newCells = cloneCells(schema.cells);

    for (const arg of args) {
      const pos = parsePosDigit(arg);
      if (!pos) return err('无效的参数格式');
      unsetCellInplace(newCells, pos.row, pos.col);
    }

    return ok({ ...schema, cells: newCells });
  }
}

class NewCommand extends BaseCommand {
  constructor() {
    super({
      name: 'new',
      aliases: [],
      category: 'new',
      description: '导入新题目（81位数字）',
      args: [puzzleArg],
      examples: ['new 530070000600195000098006800800060003400803001700020006060000280000419005000080079'],
    });
  }

  execute(_schema: SudokuSchema, args: string[]): CmdResult {
    if (args.length < 1 || args[0].length < 81) {
      return err('无效的数独数据，需要81位数字');
    }

    const nums: number[][] = [];
    for (let i = 0; i < 9; i++) {
      nums.push([]);
      for (let j = 0; j < 9; j++) {
        nums[i].push(Number(args[0][i * 9 + j]));
      }
    }

    const newSchema = createNewSchema(nums);
    if (!newSchema) return err('无效的数独数据');

    return ok(newSchema);
  }
}

// ============================================================================
// 自动收集并导出
// ============================================================================

// 实例化所有命令
const setCommand = new SetCommand();
const unsetCommand = new UnsetCommand();
const newCommand = new NewCommand();

// 导出命令实例（用于独立导入）
export { setCommand, unsetCommand, newCommand, SetCommand, UnsetCommand, NewCommand };

// 导出自动收集的命令配置
export const basicCommands = {
  [setCommand.name]: {
    meta: setCommand.getMeta(),
    handler: setCommand.handle.bind(setCommand),
  },
  [unsetCommand.name]: {
    meta: unsetCommand.getMeta(),
    handler: unsetCommand.handle.bind(unsetCommand),
  },
  [newCommand.name]: {
    meta: newCommand.getMeta(),
    handler: newCommand.handle.bind(newCommand),
  },
};
