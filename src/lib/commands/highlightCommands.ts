/**
 * Highlight Commands - 自动填充命令
 *
 * 使用类继承方式定义命令
 */

import type { SudokuSchema } from '@/lib/sudoku/types';
import type { CmdResult } from './types';
import {
  cleanAllCellsHighlighted,
  cleanAllCellsSelected,
  highlightSelected,
  setBoxHighlighted,
  setCellHighlighted,
  setColHighlighted,
  setDigitHighlighted,
  setRowHighlighted,
  setRowSelected,
  setXYHighlighted,
} from '@/lib/sudoku';
import { ok, toDigit, toRow, intermediate, toBox, toCol } from './utils';
import { BaseCommand } from './Command';
import { cloneCells } from '../sudoku/basic';

// ============================================================================
// 自动填充命令
// ============================================================================

class HighlightCellCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hcell',
      aliases: ['hce'],
      category: 'highlight',
      description: '高亮格子',
      args: [
        { type: 'pos', name: 'cells', description: '格子位置（如 11, 23）', repeatable: true },
      ],
      examples: ['hcell 11 23'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    console.log('highlightCell', args);
    const cells = cloneCells(schema.cells);
    console.log('highlightCell clonecells');
    for (const arg of args) {
      if (arg.length === 0) {
        return this.error();
      }
      if (args.length === 1) {
        const row = toRow(arg[0]);
        cleanAllCellsSelected(cells);
        setRowSelected(cells, row);
        return intermediate({ ...schema, cells });
      }
      const row = toRow(arg[0]);
      const col = toCol(arg[1]);
      if (setCellHighlighted(cells[row][col])) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有格子被改变');
    }
    return ok({ ...schema, cells });
  }
}

class HighlightRowCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hrow',
      aliases: ['hr'],
      category: 'highlight',
      description: '高亮行',
      args: [{ type: 'pos', name: 'rows', description: '行位置（如 1, 2, 3）', repeatable: true }],
      examples: ['hr 1 2 3'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const row = toRow(arg);
      if (setRowHighlighted(cells, row)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有行被改变');
    }
    return ok({ ...schema, cells });
  }
}

class HighlightColCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hcol',
      aliases: ['hc'],
      category: 'highlight',
      description: '高亮列',
      args: [{ type: 'pos', name: 'cols', description: '列位置（如 1, 2, 3）', repeatable: true }],
      examples: ['hcol 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const col = toCol(arg);
      if (setColHighlighted(cells, col)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有列被改变');
    }
    return ok({ ...schema, cells });
  }
}

class HighlightBoxCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hbox',
      aliases: ['hb'],
      category: 'highlight',
      description: '高亮宫',
      args: [{ type: 'pos', name: 'boxes', description: '宫位置（如 1, 2, 3）', repeatable: true }],
      examples: ['hbox 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const box = toBox(arg);
      if (setBoxHighlighted(cells, box)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有宫被改变');
    }
    return ok({ ...schema, cells });
  }
}

class HighlightDigitCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hdigit',
      aliases: ['h', 'hd'],
      category: 'highlight',
      description: '高亮数字',
      args: [
        { type: 'digit', name: 'digits', description: '数字（如 1, 2, 3）', repeatable: true },
      ],
      examples: ['hdigit 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    if (cleanAllCellsHighlighted(cells)) {
      changed = true;
    }
    for (const arg of args) {
      const digit = toDigit(arg);
      if (setDigitHighlighted(cells, digit)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有数字被改变');
    }
    return ok({ ...schema, cells });
  }
}

class HighlightXYCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hxy',
      aliases: [],
      category: 'highlight',
      description: '高亮坐标',
      args: [],
      examples: ['hxy'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    if (setXYHighlighted(cells)) {
      changed = true;
    }
    if (!changed) {
      return this.error('没有坐标被改变');
    }
    return ok({ ...schema, cells });
  }
}

class UnHighlightCmd extends BaseCommand {
  constructor() {
    super({
      name: 'unhighlight',
      aliases: ['uh'],
      category: 'highlight',
      description: '清除高亮',
      args: [],
      examples: ['unhighlight', 'uh'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    const cells = cloneCells(schema.cells);
    if (cleanAllCellsHighlighted(cells)) {
      return ok({ ...schema, cells });
    }
    return this.error('没有高亮被清除');
  }
}

class JoinHighlightRowCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hrowj',
      aliases: ['hrj'],
      category: 'highlight',
      description: '合并高亮行',
      args: [{ type: 'pos', name: 'rows', description: '行位置（如 1, 2, 3）', repeatable: true }],
      examples: ['hrj 1 2 3'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const row = toRow(arg);
      if (setRowHighlighted(cells, row, true, true)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有行被改变');
    }
    return ok({ ...schema, cells });
  }
}

class JoinHighlightColCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hcolj',
      aliases: ['hcj'],
      category: 'highlight',
      description: '合并高亮列',
      args: [{ type: 'pos', name: 'cols', description: '列位置（如 1, 2, 3）', repeatable: true }],
      examples: ['hcolj 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const col = toCol(arg);
      if (setColHighlighted(cells, col, true, true)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有列被改变');
    }
    return ok({ ...schema, cells });
  }
}

class JoinHighlightBoxCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hboxj',
      aliases: ['hbj'],
      category: 'highlight',
      description: '合并高亮宫',
      args: [{ type: 'pos', name: 'boxes', description: '宫位置（如 1, 2, 3）', repeatable: true }],
      examples: ['hboxj 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const box = toBox(arg);
      if (setBoxHighlighted(cells, box, true, true)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有宫被改变');
    }
    return ok({ ...schema, cells });
  }
}

class JoinHighlightDigitCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hdj',
      aliases: ['hj'],
      category: 'highlight',
      description: '合并高亮数字',
      args: [
        { type: 'digit', name: 'digits', description: '数字（如 1, 2, 3）', repeatable: true },
      ],
      examples: ['hdj 1 2 3', 'hj 1 2 3'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const digit = toDigit(arg);
      if (setDigitHighlighted(cells, digit, true, true)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有数字被改变');
    }
    return ok({ ...schema, cells });
  }
}

class JoinHighlightXYCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hxyj',
      aliases: [],
      category: 'highlight',
      description: '合并高亮坐标',
      args: [],
      examples: ['hxyj'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    if (setXYHighlighted(cells, true, true)) {
      changed = true;
    }
    if (!changed) {
      return this.error('没有坐标被改变');
    }
    return ok({ ...schema, cells });
  }
}

class HighlightSelectedCmd extends BaseCommand {
  constructor() {
    super({
      name: 'hselected',
      aliases: ['hsel'],
      category: 'highlight',
      description: '高亮选中的格子',
      args: [],
      examples: ['hselected'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    const cells = cloneCells(schema.cells);
    if (!highlightSelected(cells)) {
      return this.error('没有格子被改变');
    }
    return ok({ ...schema, cells });
  }
}

// ============================================================================
// 导出
// ============================================================================

const highlightCellCmd = new HighlightCellCmd();
const highlightRowCmd = new HighlightRowCmd();
const highlightColCmd = new HighlightColCmd();
const highlightBoxCmd = new HighlightBoxCmd();
const highlightDigitCmd = new HighlightDigitCmd();
const highlightXYCmd = new HighlightXYCmd();
const unHighlightCmd = new UnHighlightCmd();
const joinHighlightRowCmd = new JoinHighlightRowCmd();
const joinHighlightColCmd = new JoinHighlightColCmd();
const joinHighlightBoxCmd = new JoinHighlightBoxCmd();
const joinHighlightDigitCmd = new JoinHighlightDigitCmd();
const joinHighlightXYCmd = new JoinHighlightXYCmd();
const highlightSelectedCmd = new HighlightSelectedCmd();

export {
  highlightCellCmd,
  highlightRowCmd,
  highlightColCmd,
  highlightBoxCmd,
  highlightDigitCmd,
  highlightXYCmd,
  unHighlightCmd,
  joinHighlightRowCmd,
  joinHighlightColCmd,
  joinHighlightBoxCmd,
  joinHighlightDigitCmd,
  joinHighlightXYCmd,
  highlightSelectedCmd,
};

export const highlightCommands = {
  [highlightCellCmd.name]: {
    meta: highlightCellCmd.getMeta(),
    handler: highlightCellCmd.handle.bind(highlightCellCmd),
  },
  [highlightRowCmd.name]: {
    meta: highlightRowCmd.getMeta(),
    handler: highlightRowCmd.handle.bind(highlightRowCmd),
  },
  [highlightColCmd.name]: {
    meta: highlightColCmd.getMeta(),
    handler: highlightColCmd.handle.bind(highlightColCmd),
  },
  [highlightBoxCmd.name]: {
    meta: highlightBoxCmd.getMeta(),
    handler: highlightBoxCmd.handle.bind(highlightBoxCmd),
  },
  [highlightDigitCmd.name]: {
    meta: highlightDigitCmd.getMeta(),
    handler: highlightDigitCmd.handle.bind(highlightDigitCmd),
  },
  [highlightXYCmd.name]: {
    meta: highlightXYCmd.getMeta(),
    handler: highlightXYCmd.handle.bind(highlightXYCmd),
  },
  [unHighlightCmd.name]: {
    meta: unHighlightCmd.getMeta(),
    handler: unHighlightCmd.handle.bind(unHighlightCmd),
  },
  [joinHighlightRowCmd.name]: {
    meta: joinHighlightRowCmd.getMeta(),
    handler: joinHighlightRowCmd.handle.bind(joinHighlightRowCmd),
  },
  [joinHighlightColCmd.name]: {
    meta: joinHighlightColCmd.getMeta(),
    handler: joinHighlightColCmd.handle.bind(joinHighlightColCmd),
  },
  [joinHighlightBoxCmd.name]: {
    meta: joinHighlightBoxCmd.getMeta(),
    handler: joinHighlightBoxCmd.handle.bind(joinHighlightBoxCmd),
  },
  [joinHighlightDigitCmd.name]: {
    meta: joinHighlightDigitCmd.getMeta(),
    handler: joinHighlightDigitCmd.handle.bind(joinHighlightDigitCmd),
  },
  [joinHighlightXYCmd.name]: {
    meta: joinHighlightXYCmd.getMeta(),
    handler: joinHighlightXYCmd.handle.bind(joinHighlightXYCmd),
  },
  [highlightSelectedCmd.name]: {
    meta: highlightSelectedCmd.getMeta(),
    handler: highlightSelectedCmd.handle.bind(highlightSelectedCmd),
  },
};
