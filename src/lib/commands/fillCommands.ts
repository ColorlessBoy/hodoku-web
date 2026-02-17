/**
 * Fill Commands - 自动填充命令
 *
 * 使用类继承方式定义命令
 */

import type { Position, SudokuSchema } from '@/lib/sudoku/types';
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
  cleanCellHighlighted,
  cleanAllCellsHighlighted,
  setDigitHighlighted,
} from '@/lib/sudoku';
import { ok, intermediate, toDigit, toRow, toCol, toBox } from './utils';
import { BaseCommand } from './Command';
import { cloneCells, getBoxIndex } from '../sudoku/basic';
import { fillLastCandidate, groupedDigitInBoxCol, groupedDigitInBoxRow } from '../sudoku/fill';
import { highlightDigitCmd } from './highlightCommands';
import { buildChain, buildXChain, removeCandidatesByChains } from '../sudoku/link';

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

class GroupedDigitInBoxRowCommand extends BaseCommand {
  constructor() {
    super({
      name: 'groupeddigitboxrow',
      aliases: ['gbr'],
      category: 'fill',
      description: '某个数字集中在行和框的交集区域，可以排除该行和列的并集区域的其他数字',
      args: [
        {
          type: 'pos',
          name: 'boxrowdigit',
          description: '框+行+数字（如 12, 32）',
          repeatable: true,
        },
      ],
      examples: ['gbr 125', 'gbr 135'],
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
      } else if (arg.length === 2) {
        const box = toBox(arg[0]);
        const row = toRow(arg[1]);
        cleanAllCellsSelected(cells);
        setBoxSelected(cells, box);
        setRowSelected(cells, row, true, true);
        return intermediate({ ...schema, cells });
      }
      const box = toBox(arg[0]);
      const row = toRow(arg[1]);
      const digit = toDigit(arg[2]);
      if (groupedDigitInBoxRow(cells, box, row, digit)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error();
    }
    return ok({ ...schema, cells });
  }
}

class GroupedDigitInBoxColCommand extends BaseCommand {
  constructor() {
    super({
      name: 'groupeddigitboxcol',
      aliases: ['gbc'],
      category: 'fill',
      description: '某个数字集中在行和框的交集区域，可以排除该行和列的并集区域的其他数字',
      args: [
        {
          type: 'pos',
          name: 'boxcoldigit',
          description: '框+列+数字（如 12, 32）',
          repeatable: true,
        },
      ],
      examples: ['gbc 125', 'gbc 135'],
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
      } else if (arg.length === 2) {
        const box = toBox(arg[0]);
        const col = toCol(arg[1]);
        cleanAllCellsSelected(cells);
        setBoxSelected(cells, box);
        setColSelected(cells, col, true, true);
        return intermediate({ ...schema, cells });
      }
      const box = toBox(arg[0]);
      const col = toCol(arg[1]);
      const digit = toDigit(arg[2]);
      if (groupedDigitInBoxCol(cells, box, col, digit)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error();
    }
    return ok({ ...schema, cells });
  }
}

class XChainCommand extends BaseCommand {
  constructor() {
    super({
      name: 'xchain',
      aliases: ['xc'],
      category: 'fill',
      description: '同数链',
      args: [
        {
          type: 'digit',
          name: 'd',
          description: '数字',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'pos',
          description: '行+列（如 12, 32）',
          repeatable: true,
        },
      ],
      examples: ['xc 1 12 34'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    const cells = cloneCells(schema.cells);
    if (args.length === 0) {
      return this.error();
    }
    const digit = toDigit(args[0]);
    cleanAllCellsHighlighted(cells);
    setDigitHighlighted(cells, digit);
    if (args.length === 1) {
      return intermediate({ ...schema, cells });
    }
    cleanAllCellsSelected(cells);
    const positions: Position[] = [];
    for (const arg of args.slice(1)) {
      if (arg.length === 0) {
        return this.error();
      } else if (arg.length === 1) {
        const row = toRow(arg[0]);
        setRowSelected(cells, row);
        return intermediate({ ...schema, cells });
      } else if (arg.length === 2) {
        const row = toRow(arg[0]);
        const col = toCol(arg[1]);
        setCellSelected(cells[row][col]);
        positions.push({ row, col, box: getBoxIndex(row, col) });
      }
    }
    const [links, msg] = buildXChain(cells, positions, digit);
    if (msg.length > 0) {
      return this.error(msg);
    }
    const [changed, msg2] = removeCandidatesByChains(cells, links);
    if (!changed) {
      return this.error(msg2);
    }
    cleanAllCellsSelected(cells);
    return ok({ ...schema, cells });
  }
}

class GroupedXChainCommand extends BaseCommand {
  constructor() {
    super({
      name: 'groupedxchain',
      aliases: ['gxc'],
      category: 'fill',
      description: '同数群链',
      args: [
        {
          type: 'digit',
          name: 'd',
          description: '数字',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'pos',
          description: '行+列+行+列（如 12, 32）',
          repeatable: true,
        },
      ],
      examples: ['gxc 1 1234 5671'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    const cells = cloneCells(schema.cells);
    if (args.length === 0) {
      return this.error();
    }
    const digit = toDigit(args[0]);
    cleanAllCellsHighlighted(cells);
    setDigitHighlighted(cells, digit);
    if (args.length === 1) {
      return intermediate({ ...schema, cells });
    }
    cleanAllCellsSelected(cells);
    const positions: Position[][] = [];
    for (const arg of args.slice(1)) {
      if (arg.length === 0) {
        return this.error();
      }
      const group: Position[] = [];
      for (let i = 0; i < arg.length; i += 2) {
        const row = toRow(arg[i]);
        if (i + 1 >= arg.length) {
          setRowSelected(cells, row);
          return intermediate({ ...schema, cells });
        }
        const col = toCol(arg[i + 1]);
        setCellSelected(cells[row][col]);
        group.push({ row, col, box: getBoxIndex(row, col) });
      }
      positions.push(group);
    }
    const [links, msg] = buildChain(
      cells,
      positions,
      positions.map((_) => digit)
    );
    if (msg.length > 0) {
      return this.error(msg);
    }
    const [changed, msg2] = removeCandidatesByChains(cells, links);
    if (!changed) {
      return this.error(msg2);
    }
    cleanAllCellsSelected(cells);
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
const groupedDigitInBoxRowCmd = new GroupedDigitInBoxRowCommand();
const groupedDigitInBoxColCmd = new GroupedDigitInBoxColCommand();
const xChainCmd = new XChainCommand();
const groupXChainCmd = new GroupedXChainCommand();

export {
  fillLastCandidateAutoCmd,
  fillLastCandidateCmd,
  fillLastDigitInRowCmd,
  fillLastDigitInColCmd,
  fillLastDigitInBoxCmd,
  groupedDigitInBoxRowCmd,
  groupedDigitInBoxColCmd,
  xChainCmd,
  groupXChainCmd,
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
  [groupedDigitInBoxRowCmd.name]: {
    meta: groupedDigitInBoxRowCmd.getMeta(),
    handler: groupedDigitInBoxRowCmd.handle.bind(groupedDigitInBoxRowCmd),
  },
  [groupedDigitInBoxColCmd.name]: {
    meta: groupedDigitInBoxColCmd.getMeta(),
    handler: groupedDigitInBoxColCmd.handle.bind(groupedDigitInBoxColCmd),
  },
  [xChainCmd.name]: {
    meta: xChainCmd.getMeta(),
    handler: xChainCmd.handle.bind(xChainCmd),
  },
  [groupXChainCmd.name]: {
    meta: groupXChainCmd.getMeta(),
    handler: groupXChainCmd.handle.bind(groupXChainCmd),
  },
};
