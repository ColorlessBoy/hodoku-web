/**
 * Basic Commands - 基础操作命令
 *
 * 使用类继承方式定义命令
 */

import type { SudokuSchema } from '@/lib/sudoku';
import type { CmdResult, ArgDef } from './types';
import { createNewSchema } from '@/lib/sudoku';
import { ok, err } from './utils';
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

class NewCommand extends BaseCommand {
  constructor() {
    super({
      name: 'new',
      aliases: [],
      category: 'new',
      description: '导入新题目（81位数字）',
      args: [puzzleArg],
      examples: [
        'new 530070000600195000098006800800060003400803001700020006060000280000419005000080079',
      ],
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
const newCommand = new NewCommand();

// 导出命令实例（用于独立导入）
export { newCommand };

// 导出自动收集的命令配置
export const basicCommands = {
  [newCommand.name]: {
    meta: newCommand.getMeta(),
    handler: newCommand.handle.bind(newCommand),
  },
};
