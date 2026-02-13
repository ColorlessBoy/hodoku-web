/**
 * Fill Commands - 自动填充命令
 *
 * 使用类继承方式定义命令
 */

import type { SudokuSchema } from '@/lib/sudoku/types';
import type { CmdResult } from './types';
import {
  fillUniqueCandidateAuto,
  fillLastDigitInRow,
  fillLastDigitInCol,
  fillLastDigitInBox,
  cleanAllCellsSelected,
  setRowSelected,
  setColSelected,
  setBoxSelected,
} from '@/lib/sudoku';
import { ok, intermediate, toDigit, toRow, toCol, toBox } from './utils';
import { BaseCommand } from './Command';
import { cloneCells } from '../sudoku/basic';

// ============================================================================
// 自动填充命令
// ============================================================================

class FillUniqueCandidateAutoCmd extends BaseCommand {
  constructor() {
    super({
      name: 'autofu',
      aliases: ['afu'],
      category: 'fill',
      description: '自动填充所有可确定的格子',
      args: [],
      examples: ['autofu', 'afu'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    const cells = cloneCells(schema.cells);
    if (fillUniqueCandidateAuto(cells)) {
      return ok({ ...schema, cells });
    }
    return this.error('自动填充失败');
  }
}

class FillLastDigitInRowCommand extends BaseCommand {
  constructor() {
    super({
      name: 'fr',
      aliases: ['fr'],
      category: 'fill',
      description: '填充行最后数',
      args: [{ type: 'pos', name: 'rowdigit', description: '行+数字（如 12, 32）', repeatable: true }],
      examples: ['fr 12', 'fr 32 32'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      if (arg.length === 0) {
        return this.error();
      } else if (arg.length === 1) {
        const row = toRow(arg[0]);
        cleanAllCellsSelected(cells);
        setRowSelected(cells, row);
        return intermediate({ ...schema, cells });
      }
      const row = toRow(arg[0]);
      const digit = toDigit(arg[1]);
      if (fillLastDigitInRow(cells, row, digit)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有格子被填充');
    }
    return ok({ ...schema, cells });
  }
}

class FillLastDigitInColCommand extends BaseCommand {
  constructor() {
    super({
      name: 'fc',
      aliases: ['fc'],
      category: 'fill',
      description: '填充列最后数',
      args: [{ type: 'pos', name: 'coldigit', description: '列+数字（如 12, 32）', repeatable: true }],
      examples: ['fc 12', 'fc 32 32'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      if (arg.length === 0) {
        return this.error();
      } else if (arg.length === 1) {
        const col = toCol(arg[0]);
        cleanAllCellsSelected(cells);
        setColSelected(cells, col);
        return intermediate({ ...schema, cells });
      }
      const col = toCol(arg[0]);
      const digit = toDigit(arg[1]);
      if (fillLastDigitInCol(cells, col, digit)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有格子被填充');
    }
    return ok({ ...schema, cells });
  }
}

class FillLastDigitInBoxCommand extends BaseCommand {
  constructor() {
    super({
      name: 'fb',
      aliases: ['fb'],
      category: 'fill',
      description: '填充框最后数',
      args: [{ type: 'pos', name: 'boxdigit', description: '框+数字（如 12, 32）', repeatable: true }],
      examples: ['fb 12', 'fb 32 32'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      if (arg.length === 0) {
        return this.error();
      } else if (arg.length === 1) {
        const box = toBox(arg[0]);
        cleanAllCellsSelected(cells);
        setBoxSelected(cells, box);
        return intermediate({ ...schema, cells });
      }
      const box = toBox(arg[0]);
      const digit = toDigit(arg[1]);
      if (fillLastDigitInBox(cells, box, digit)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有格子被填充');
    }
    return ok({ ...schema, cells });
  }
}

// ============================================================================
// 导出
// ============================================================================

const fillUniqueCandidateAutoCmd = new FillUniqueCandidateAutoCmd();
const fillLastDigitInRowCmd = new FillLastDigitInRowCommand();
const fillLastDigitInColCmd = new FillLastDigitInColCommand();
const fillLastDigitInBoxCmd = new FillLastDigitInBoxCommand();


export {
  fillUniqueCandidateAutoCmd,
  fillLastDigitInRowCmd,
  fillLastDigitInColCmd,
  fillLastDigitInBoxCmd,
};

export const fillCommands = {
  [fillUniqueCandidateAutoCmd.name]: { meta: fillUniqueCandidateAutoCmd.getMeta(), handler: fillUniqueCandidateAutoCmd.handle.bind(fillUniqueCandidateAutoCmd) },
  [fillLastDigitInRowCmd.name]: { meta: fillLastDigitInRowCmd.getMeta(), handler: fillLastDigitInRowCmd.handle.bind(fillLastDigitInRowCmd) },
  [fillLastDigitInColCmd.name]: { meta: fillLastDigitInColCmd.getMeta(), handler: fillLastDigitInColCmd.handle.bind(fillLastDigitInColCmd) },
  [fillLastDigitInBoxCmd.name]: { meta: fillLastDigitInBoxCmd.getMeta(), handler: fillLastDigitInBoxCmd.handle.bind(fillLastDigitInBoxCmd) },
};