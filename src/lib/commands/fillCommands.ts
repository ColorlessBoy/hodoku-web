/**
 * Fill Commands - 自动填充命令
 *
 * 使用类继承方式定义命令
 */

import type { SudokuSchema } from '@/lib/sudoku/types';
import type { CmdResult } from './types';
import {
  fillUniqueCandidateAuto as fillLastCandidateAuto,
  fillLastDigitInRow,
  fillLastDigitInCol,
  fillLastDigitInBox,
  cleanAllCellsSelected,
  setRowSelected,
  setColSelected,
  setBoxSelected,
  setCellSelected,
} from '@/lib/sudoku';
import { ok, intermediate, toDigit, toRow, toCol, toBox } from './utils';
import { BaseCommand } from './Command';
import { cloneCells } from '../sudoku/basic';
import { fillLastCandidate } from '../sudoku/fill';

// ============================================================================
// 自动填充命令
// ============================================================================

class FillLastCandidateAutoCmd extends BaseCommand {
  constructor() {
    super({
      name: 'autolastcandidates',
      aliases: ['autolc'],
      category: 'fill',
      description: '自动填充所有可确定的格子',
      args: [],
      examples: ['autolc'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    const cells = cloneCells(schema.cells);
    if (fillLastCandidateAuto(cells)) {
      return ok({ ...schema, cells });
    }
    return this.error('自动填充失败');
  }
}

class FillLastCandidateCmd extends BaseCommand {
  constructor() {
    super({
      name: 'lastcandidate',
      aliases: ['lc'],
      category: 'fill',
      description: '填充可确定的格子',
      args: [
        { type: 'pos', name: 'cells', description: '格子位置（如 11, 23）', repeatable: true },
      ],
      examples: ['lc 12'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      if (arg.length === 0) {
        return this.error();
      }
      if (arg.length === 1) {
        const row = toRow(arg[0]);
        cleanAllCellsSelected(cells);
        setRowSelected(cells, row);
        return intermediate({ ...schema, cells });
      }
      const row = toRow(arg[0]);
      const col = toCol(arg[1]);
      if (fillLastCandidate(cells, row, col)) {
        changed = true;
        cleanAllCellsSelected(cells);
        setCellSelected(cells[row][col]);
      }
    }
    if (!changed) {
      return this.error();
    }
    return ok({ ...schema, cells });
  }
}

class FillLastDigitInRowCommand extends BaseCommand {
  constructor() {
    super({
      name: 'lastdigitrow',
      aliases: ['ldr'],
      category: 'fill',
      description: '填充行最后数',
      args: [
        { type: 'pos', name: 'rowdigit', description: '行+数字（如 12, 32）', repeatable: true },
      ],
      examples: ['ldr 12', 'ldr 32 32'],
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
      const [success, col] = fillLastDigitInRow(cells, row, digit);
      if (success) {
        changed = true;
        cleanAllCellsSelected(cells);
        setCellSelected(cells[row][col]);
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
      name: 'lastdigitcol',
      aliases: ['ldc'],
      category: 'fill',
      description: '填充列最后数',
      args: [
        {
          type: 'numdigit',
          name: 'coldigit',
          description: '列+数字（如 12, 32）',
          repeatable: true,
        },
      ],
      examples: ['ldc 12', 'ldc 13 32'],
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
      name: 'lastdigitbox',
      aliases: ['ldb'],
      category: 'fill',
      description: '填充框最后数',
      args: [
        { type: 'pos', name: 'boxdigit', description: '框+数字（如 12, 32）', repeatable: true },
      ],
      examples: ['ldb 12', 'ldb 13 32'],
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

const fillLastCandidateAutoCmd = new FillLastCandidateAutoCmd();
const fillLastCandidateCmd = new FillLastCandidateCmd();
const fillLastDigitInRowCmd = new FillLastDigitInRowCommand();
const fillLastDigitInColCmd = new FillLastDigitInColCommand();
const fillLastDigitInBoxCmd = new FillLastDigitInBoxCommand();

export {
  fillLastCandidateAutoCmd,
  fillLastCandidateCmd,
  fillLastDigitInRowCmd,
  fillLastDigitInColCmd,
  fillLastDigitInBoxCmd,
};

export const fillCommands = {
  [fillLastCandidateAutoCmd.name]: {
    meta: fillLastCandidateAutoCmd.getMeta(),
    handler: fillLastCandidateAutoCmd.handle.bind(fillLastCandidateAutoCmd),
  },
  [fillLastCandidateCmd.name]: {
    meta: fillLastCandidateCmd.getMeta(),
    handler: fillLastCandidateCmd.handle.bind(fillLastCandidateCmd),
  },
  [fillLastDigitInRowCmd.name]: {
    meta: fillLastDigitInRowCmd.getMeta(),
    handler: fillLastDigitInRowCmd.handle.bind(fillLastDigitInRowCmd),
  },
  [fillLastDigitInColCmd.name]: {
    meta: fillLastDigitInColCmd.getMeta(),
    handler: fillLastDigitInColCmd.handle.bind(fillLastDigitInColCmd),
  },
  [fillLastDigitInBoxCmd.name]: {
    meta: fillLastDigitInBoxCmd.getMeta(),
    handler: fillLastDigitInBoxCmd.handle.bind(fillLastDigitInBoxCmd),
  },
};
