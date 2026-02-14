/**
 * Select Commands - 选择命令
 *
 * 使用类继承方式定义命令
 */

import type { SudokuSchema } from '@/lib/sudoku/types';
import type { CmdResult } from './types';
import {
  cleanAllCellsSelected,
  selectHighlighted,
  setBoxSelected,
  setCellSelected,
  setColSelected,
  setDigitSelected,
  setRowSelected,
  setXYSelected,
} from '@/lib/sudoku';
import { ok, toDigit, toRow, intermediate, toBox, toCol } from './utils';
import { BaseCommand } from './Command';
import { cloneCells } from '../sudoku/basic';

// ============================================================================
// 自动填充命令
// ============================================================================

class SelectCellCmd extends BaseCommand {
  constructor() {
    super({
      name: 'select',
      aliases: ['s'],
      category: 'select',
      description: '选择格子',
      args: [
        { type: 'pos', name: 'cells', description: '格子位置（如 11, 23）', repeatable: true },
      ],
      examples: ['select 11 23'],
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
      if (setCellSelected(cells[row][col])) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error();
    }
    return ok({ ...schema, cells });
  }
}

class SelectRowCmd extends BaseCommand {
  constructor() {
    super({
      name: 'srow',
      aliases: ['sr'],
      category: 'select',
      description: '选择行',
      args: [{ type: 'pos', name: 'rows', description: '行位置（如 1, 2, 3）', repeatable: true }],
      examples: ['srow 1 2 3'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const row = toRow(arg);
      if (setRowSelected(cells, row)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有行被改变');
    }
    return ok({ ...schema, cells });
  }
}

class SelectColCmd extends BaseCommand {
  constructor() {
    super({
      name: 'scol',
      aliases: ['sc'],
      category: 'select',
      description: '选择列',
      args: [{ type: 'pos', name: 'cols', description: '列位置（如 1, 2, 3）', repeatable: true }],
      examples: ['scol 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const col = toCol(arg);
      if (setColSelected(cells, col)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有列被改变');
    }
    return ok({ ...schema, cells });
  }
}

class SelectBoxCmd extends BaseCommand {
  constructor() {
    super({
      name: 'sbox',
      aliases: ['sb'],
      category: 'select',
      description: '选择宫',
      args: [{ type: 'pos', name: 'boxes', description: '宫位置（如 1, 2, 3）', repeatable: true }],
      examples: ['sbox 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const box = toBox(arg);
      if (setBoxSelected(cells, box)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有宫被改变');
    }
    return ok({ ...schema, cells });
  }
}

class SelectDigitCmd extends BaseCommand {
  constructor() {
    super({
      name: 'sdigit',
      aliases: ['sd'],
      category: 'select',
      description: '选择数字',
      args: [
        { type: 'digit', name: 'digits', description: '数字（如 1, 2, 3）', repeatable: true },
      ],
      examples: ['sdigit 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const digit = toDigit(arg);
      if (setDigitSelected(cells, digit)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有数字被改变');
    }
    return ok({ ...schema, cells });
  }
}

class SelectXYCmd extends BaseCommand {
  constructor() {
    super({
      name: 'selectxy',
      aliases: ['sxy'],
      category: 'select',
      description: '选择坐标',
      args: [],
      examples: ['selectxy'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    console.log('SelectXYCmd');
    if (setXYSelected(cells)) {
      changed = true;
    }
    if (!changed) {
      return this.error('没有坐标被改变');
    }
    return ok({ ...schema, cells });
  }
}

class UnSelectCmd extends BaseCommand {
  constructor() {
    super({
      name: 'unselect',
      aliases: ['us'],
      category: 'select',
      description: '清除选择',
      args: [],
      examples: ['unselect', 'us'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    const cells = cloneCells(schema.cells);
    if (cleanAllCellsSelected(cells)) {
      return ok({ ...schema, cells });
    }
    return this.error('没有选择被清除');
  }
}

class JoinSelectRowCmd extends BaseCommand {
  constructor() {
    super({
      name: 'srowj',
      aliases: ['srj'],
      category: 'select',
      description: '合并选择行',
      args: [{ type: 'pos', name: 'rows', description: '行位置（如 1, 2, 3）', repeatable: true }],
      examples: ['srowj 1 2 3'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const row = toRow(arg);
      if (setRowSelected(cells, row, true, true)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有行被改变');
    }
    return ok({ ...schema, cells });
  }
}

class JoinSelectColCmd extends BaseCommand {
  constructor() {
    super({
      name: 'scolj',
      aliases: ['scj'],
      category: 'select',
      description: '合并选择列',
      args: [{ type: 'pos', name: 'cols', description: '列位置（如 1, 2, 3）', repeatable: true }],
      examples: ['scolj 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const col = toCol(arg);
      if (setColSelected(cells, col, true, true)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有列被改变');
    }
    return ok({ ...schema, cells });
  }
}

class JoinSelectBoxCmd extends BaseCommand {
  constructor() {
    super({
      name: 'sboxj',
      aliases: ['sbj'],
      category: 'select',
      description: '合并选择宫',
      args: [{ type: 'pos', name: 'boxes', description: '宫位置（如 1, 2, 3）', repeatable: true }],
      examples: ['sboxj 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const box = toBox(arg);
      if (setBoxSelected(cells, box, true, true)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有宫被改变');
    }
    return ok({ ...schema, cells });
  }
}

class JoinSelectDigitCmd extends BaseCommand {
  constructor() {
    super({
      name: 'sjd',
      aliases: ['sj'],
      category: 'select',
      description: '合并选择数字',
      args: [
        { type: 'digit', name: 'digits', description: '数字（如 1, 2, 3）', repeatable: true },
      ],
      examples: ['sjd 1 2 3', 'sj 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const digit = toDigit(arg);
      if (setDigitSelected(cells, digit, true, true)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有数字被改变');
    }
    return ok({ ...schema, cells });
  }
}

class JoinSelectXYCmd extends BaseCommand {
  constructor() {
    super({
      name: 'sxyj',
      aliases: [],
      category: 'select',
      description: '合并选择坐标',
      args: [],
      examples: ['sxyj'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    if (setXYSelected(cells, true, true)) {
      changed = true;
    }
    if (!changed) {
      return this.error('没有坐标被改变');
    }
    return ok({ ...schema, cells });
  }
}

class SelectHighlightedCmd extends BaseCommand {
  constructor() {
    super({
      name: 'shighlighted',
      aliases: ['sh'],
      category: 'select',
      description: '选择所有高亮的格子',
      args: [],
      examples: ['shighlighted'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    const cells = cloneCells(schema.cells);
    if (!selectHighlighted(cells)) {
      return this.error('没有格子被改变');
    }
    return ok({ ...schema, cells });
  }
}

// ============================================================================
// 导出
// ============================================================================

const selectCellCmd = new SelectCellCmd();
const selectRowCmd = new SelectRowCmd();
const selectColCmd = new SelectColCmd();
const selectBoxCmd = new SelectBoxCmd();
const selectDigitCmd = new SelectDigitCmd();
const selectXYCmd = new SelectXYCmd();
const unSelectCmd = new UnSelectCmd();
const joinSelectRowCmd = new JoinSelectRowCmd();
const joinSelectColCmd = new JoinSelectColCmd();
const joinSelectBoxCmd = new JoinSelectBoxCmd();
const joinSelectDigitCmd = new JoinSelectDigitCmd();
const joinSelectXYCmd = new JoinSelectXYCmd();
const selectHighlightedCmd = new SelectHighlightedCmd();

export {
  selectCellCmd,
  selectRowCmd,
  selectColCmd,
  selectBoxCmd,
  selectDigitCmd,
  selectXYCmd,
  unSelectCmd,
  joinSelectRowCmd,
  joinSelectColCmd,
  joinSelectBoxCmd,
  joinSelectDigitCmd,
  joinSelectXYCmd,
  selectHighlightedCmd,
};

export const selectCommands = {
  [selectCellCmd.name]: {
    meta: selectCellCmd.getMeta(),
    handler: selectCellCmd.handle.bind(selectCellCmd),
  },
  [selectRowCmd.name]: {
    meta: selectRowCmd.getMeta(),
    handler: selectRowCmd.handle.bind(selectRowCmd),
  },
  [selectColCmd.name]: {
    meta: selectColCmd.getMeta(),
    handler: selectColCmd.handle.bind(selectColCmd),
  },
  [selectBoxCmd.name]: {
    meta: selectBoxCmd.getMeta(),
    handler: selectBoxCmd.handle.bind(selectBoxCmd),
  },
  [selectDigitCmd.name]: {
    meta: selectDigitCmd.getMeta(),
    handler: selectDigitCmd.handle.bind(selectDigitCmd),
  },
  [selectXYCmd.name]: {
    meta: selectXYCmd.getMeta(),
    handler: selectXYCmd.handle.bind(selectXYCmd),
  },
  [unSelectCmd.name]: {
    meta: unSelectCmd.getMeta(),
    handler: unSelectCmd.handle.bind(unSelectCmd),
  },
  [joinSelectRowCmd.name]: {
    meta: joinSelectRowCmd.getMeta(),
    handler: joinSelectRowCmd.handle.bind(joinSelectRowCmd),
  },
  [joinSelectColCmd.name]: {
    meta: joinSelectColCmd.getMeta(),
    handler: joinSelectColCmd.handle.bind(joinSelectColCmd),
  },
  [joinSelectBoxCmd.name]: {
    meta: joinSelectBoxCmd.getMeta(),
    handler: joinSelectBoxCmd.handle.bind(joinSelectBoxCmd),
  },
  [joinSelectDigitCmd.name]: {
    meta: joinSelectDigitCmd.getMeta(),
    handler: joinSelectDigitCmd.handle.bind(joinSelectDigitCmd),
  },
  [joinSelectXYCmd.name]: {
    meta: joinSelectXYCmd.getMeta(),
    handler: joinSelectXYCmd.handle.bind(joinSelectXYCmd),
  },
  [selectHighlightedCmd.name]: {
    meta: selectHighlightedCmd.getMeta(),
    handler: selectHighlightedCmd.handle.bind(selectHighlightedCmd),
  },
};
