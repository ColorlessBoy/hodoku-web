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
  cleanAllCellsHighlighted,
  setDigitHighlighted,
} from '@/lib/sudoku';
import { ok, intermediate, toDigit, toRow, toCol, toBox } from './utils';
import { BaseCommand } from './Command';
import { cloneCells, getBoxIndex } from '../sudoku/basic';
import {
  fillGroupedDigitsInBox,
  fillGroupedDigitsInCol,
  fillGroupedDigitsInRow,
  fillLastCandidate,
} from '../sudoku/fill';
import {
  buildChain,
  buildXChain,
  removeCandidatesByChains,
  WeakXYWings,
  WWingsInBox,
  WWingsInCol,
  WWingsInRow,
  XYWings,
} from '../sudoku/link';

// ============================================================================
// 自动填充命令
// ============================================================================

class FillLastCandidateAutoCmd extends BaseCommand {
  constructor() {
    super({
      name: 'autolastcandidates',
      aliases: ['autol'],
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

class FillLastDigitAutoCmd extends BaseCommand {
  constructor() {
    super({
      name: 'autolastdigits',
      aliases: ['autold'],
      category: 'fill',
      description: '自动填充所有可确定的数字',
      args: [],
      examples: ['autold'],
    });
  }

  execute(schema: SudokuSchema): CmdResult {
    return this.error('还没有实现');
  }
}

class FillLastCandidateCmd extends BaseCommand {
  constructor() {
    super({
      name: 'lastcandidate',
      aliases: ['l'],
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
      aliases: ['lr'],
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
      if (arg.length === 2) {
        const digit = toDigit(arg[1]);
        const success = fillLastDigitInRow(cells, row, digit);
        if (success) {
          changed = true;
        }
      } else {
        const digits = arg.slice(1).split('').map(toDigit);
        if (fillGroupedDigitsInRow(cells, row, digits)) {
          changed = true;
        }
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
      aliases: ['lc'],
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
      if (arg.length === 2) {
        const digit = toDigit(arg[1]);
        if (fillLastDigitInCol(cells, col, digit)) {
          changed = true;
        }
      } else {
        const digits = arg.slice(1).split('').map(toDigit);
        if (fillGroupedDigitsInCol(cells, col, digits)) {
          changed = true;
        }
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
      aliases: ['lb'],
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
      if (arg.length === 2) {
        const digit = toDigit(arg[1]);
        if (fillLastDigitInBox(cells, box, digit)) {
          changed = true;
        }
      } else {
        const digits = arg.slice(1).split('').map(toDigit);
        console.log('fillGroupedDigitsInBox', box, digits);
        if (fillGroupedDigitsInBox(cells, box, digits)) {
          changed = true;
        }
      }
    }
    if (!changed) {
      return this.error('没有格子被填充');
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
      return intermediate({ ...schema, cells });
    }
    const [changed, msg2] = removeCandidatesByChains(cells, links);
    if (!changed) {
      return intermediate({ ...schema, cells });
    }
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
    return ok({ ...schema, cells });
  }
}

class WWingsInRowCommand extends BaseCommand {
  constructor() {
    super({
      name: 'wwingsinrow',
      aliases: ['wwr'],
      category: 'fill',
      description: 'W翼（行）',
      args: [
        {
          type: 'digit',
          name: 'digit',
          description: '数',
          repeatable: false,
        },
        {
          type: 'row',
          name: 'row',
          description: '行',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'pos1',
          description: '位置1',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'pos2',
          description: '位置2',
          repeatable: false,
        },
      ],
      examples: ['wwr <digit> <row> 12 56'],
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
    const row = toRow(args[1]);
    setRowSelected(cells, row);
    if (args.length === 2) {
      return intermediate({ ...schema, cells });
    }
    const row1 = toRow(args[2][0]);
    if (args[2].length === 1) {
      setRowSelected(cells, row1);
      return intermediate({ ...schema, cells });
    }
    const col1 = toCol(args[2][1]);
    setCellSelected(cells[row1][col1]);
    if (args.length === 3) {
      return intermediate({ ...schema, cells });
    }
    const row2 = toRow(args[3][0]);
    if (args[3].length === 1) {
      setRowSelected(cells, row2);
      return intermediate({ ...schema, cells });
    }
    const col2 = toCol(args[3][1]);
    setCellSelected(cells[row2][col2]);
    const position1: Position = { row: row1, col: col1, box: getBoxIndex(row1, col1) };
    const position2: Position = { row: row2, col: col2, box: getBoxIndex(row2, col2) };
    const [isSuccess, msg] = WWingsInRow(cells, digit, row, position1, position2);
    if (!isSuccess) {
      return this.error(msg);
    }
    return ok({ ...schema, cells });
  }
}

class WWingsInColCommand extends BaseCommand {
  constructor() {
    super({
      name: 'wwingsincol',
      aliases: ['wwc'],
      category: 'fill',
      description: 'W翼（列）',
      args: [
        {
          type: 'digit',
          name: 'digit',
          description: '数',
          repeatable: false,
        },
        {
          type: 'col',
          name: 'col',
          description: '列',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'pos1',
          description: '位置1',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'pos2',
          description: '位置2',
          repeatable: false,
        },
      ],
      examples: ['wwc <digit> <col> 12 56'],
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
    const col = toCol(args[1]);
    setColSelected(cells, col);
    if (args.length === 2) {
      return intermediate({ ...schema, cells });
    }
    const row1 = toRow(args[2][0]);
    if (args[2].length === 1) {
      setRowSelected(cells, row1);
      return intermediate({ ...schema, cells });
    }
    const col1 = toCol(args[2][1]);
    setCellSelected(cells[row1][col1]);
    if (args.length === 3) {
      return intermediate({ ...schema, cells });
    }
    const row2 = toRow(args[3][0]);
    if (args[3].length === 1) {
      setRowSelected(cells, row2);
      return intermediate({ ...schema, cells });
    }
    const col2 = toCol(args[3][1]);
    setCellSelected(cells[row2][col2]);
    const position1: Position = { row: row1, col: col1, box: getBoxIndex(row1, col1) };
    const position2: Position = { row: row2, col: col2, box: getBoxIndex(row2, col2) };
    const [isSuccess, msg] = WWingsInCol(cells, digit, col, position1, position2);
    if (!isSuccess) {
      return this.error(msg);
    }
    return ok({ ...schema, cells });
  }
}

class WWingsInBoxCommand extends BaseCommand {
  constructor() {
    super({
      name: 'wwingsinbox',
      aliases: ['wwb'],
      category: 'fill',
      description: 'W翼（框）',
      args: [
        {
          type: 'digit',
          name: 'digit',
          description: '数',
          repeatable: false,
        },
        {
          type: 'box',
          name: 'box',
          description: '框',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'pos1',
          description: '位置1',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'pos2',
          description: '位置2',
          repeatable: false,
        },
      ],
      examples: ['wwb <digit> <box> 12 56'],
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
    const box = toBox(args[1]);
    setBoxSelected(cells, box);
    if (args.length === 2) {
      return intermediate({ ...schema, cells });
    }
    const row1 = toRow(args[2][0]);
    if (args[2].length === 1) {
      setRowSelected(cells, row1);
      return intermediate({ ...schema, cells });
    }
    const col1 = toCol(args[2][1]);
    setCellSelected(cells[row1][col1]);
    if (args.length === 3) {
      return intermediate({ ...schema, cells });
    }
    const row2 = toRow(args[3][0]);
    if (args[3].length === 1) {
      setRowSelected(cells, row2);
      return intermediate({ ...schema, cells });
    }
    const col2 = toCol(args[3][1]);
    setCellSelected(cells[row2][col2]);
    const position1: Position = { row: row1, col: col1, box: getBoxIndex(row1, col1) };
    const position2: Position = { row: row2, col: col2, box: getBoxIndex(row2, col2) };
    const [isSuccess, msg] = WWingsInBox(cells, digit, box, position1, position2);
    if (!isSuccess) {
      return this.error(msg);
    }
    return ok({ ...schema, cells });
  }
}

class XYWingsCommand extends BaseCommand {
  constructor() {
    super({
      name: 'xywing',
      aliases: ['xyw'],
      category: 'fill',
      description: 'XY翼',
      args: [
        {
          type: 'pos',
          name: 'x',
          description: '行+列',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'y',
          description: '行+列',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'z',
          description: '行+列',
          repeatable: false,
        },
      ],
      examples: ['xy  12 27 74'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    const cells = cloneCells(schema.cells);
    if (args.length === 0) {
      return this.error();
    }
    cleanAllCellsSelected(cells);
    const xrow = toRow(args[0][0]);
    if (args[0].length === 1) {
      setRowSelected(cells, xrow);
      return intermediate({ ...schema, cells });
    }
    const xcol = toCol(args[0][1]);
    setCellSelected(cells[xrow][xcol]);
    if (args.length === 1) {
      return intermediate({ ...schema, cells });
    }
    const yrow = toRow(args[1][0]);
    if (args[1].length === 1) {
      setRowSelected(cells, yrow);
      return intermediate({ ...schema, cells });
    }
    const ycol = toCol(args[1][1]);
    setCellSelected(cells[yrow][ycol]);
    if (args.length === 2) {
      return intermediate({ ...schema, cells });
    }
    const zrow = toRow(args[2][0]);
    if (args[2].length === 1) {
      setRowSelected(cells, zrow);
      return intermediate({ ...schema, cells });
    }
    const zcol = toCol(args[2][1]);
    setCellSelected(cells[zrow][zcol]);
    const [isSuccess, msg] = XYWings(
      cells,
      { row: xrow, col: xcol, box: getBoxIndex(xrow, xcol) },
      { row: yrow, col: ycol, box: getBoxIndex(yrow, ycol) },
      { row: zrow, col: zcol, box: getBoxIndex(zrow, zcol) }
    );
    if (!isSuccess) {
      return this.error(msg);
    }
    return ok({ ...schema, cells });
  }
}

class WeakXYWingsCommand extends BaseCommand {
  constructor() {
    super({
      name: 'weakxywing',
      aliases: ['wxyw'],
      category: 'fill',
      description: '弱化XY翼',
      args: [
        {
          type: 'pos',
          name: 'x',
          description: '行+列',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'y',
          description: '行+列',
          repeatable: false,
        },
        {
          type: 'pos',
          name: 'z',
          description: '行+列',
          repeatable: false,
        },
      ],
      examples: ['wxyw 12 27 74'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    const cells = cloneCells(schema.cells);
    if (args.length === 0) {
      return this.error();
    }
    cleanAllCellsSelected(cells);
    const xrow = toRow(args[0][0]);
    if (args[0].length === 1) {
      setRowSelected(cells, xrow);
      return intermediate({ ...schema, cells });
    }
    const xcol = toCol(args[0][1]);
    setCellSelected(cells[xrow][xcol]);
    if (args.length === 1) {
      return intermediate({ ...schema, cells });
    }
    const yrow = toRow(args[1][0]);
    if (args[1].length === 1) {
      setRowSelected(cells, yrow);
      return intermediate({ ...schema, cells });
    }
    const ycol = toCol(args[1][1]);
    setCellSelected(cells[yrow][ycol]);
    if (args.length === 2) {
      return intermediate({ ...schema, cells });
    }
    const zrow = toRow(args[2][0]);
    if (args[2].length === 1) {
      setRowSelected(cells, zrow);
      return intermediate({ ...schema, cells });
    }
    const zcol = toCol(args[2][1]);
    setCellSelected(cells[zrow][zcol]);
    const [isSuccess, msg] = WeakXYWings(
      cells,
      { row: xrow, col: xcol, box: getBoxIndex(xrow, xcol) },
      { row: yrow, col: ycol, box: getBoxIndex(yrow, ycol) },
      { row: zrow, col: zcol, box: getBoxIndex(zrow, zcol) }
    );
    if (!isSuccess) {
      return this.error(msg);
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
const xChainCmd = new XChainCommand();
const groupXChainCmd = new GroupedXChainCommand();
const wWingsInRowCmd = new WWingsInRowCommand();
const wWingsInColCmd = new WWingsInColCommand();
const wWingsInBoxCmd = new WWingsInBoxCommand();
const xyWingCmd = new XYWingsCommand();
const weakXYWingCmd = new WeakXYWingsCommand();

export {
  fillLastCandidateAutoCmd,
  fillLastCandidateCmd,
  fillLastDigitInRowCmd,
  fillLastDigitInColCmd,
  fillLastDigitInBoxCmd,
  xChainCmd,
  groupXChainCmd,
  wWingsInRowCmd,
  wWingsInColCmd,
  wWingsInBoxCmd,
  xyWingCmd,
  weakXYWingCmd,
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
  [xChainCmd.name]: {
    meta: xChainCmd.getMeta(),
    handler: xChainCmd.handle.bind(xChainCmd),
  },
  [groupXChainCmd.name]: {
    meta: groupXChainCmd.getMeta(),
    handler: groupXChainCmd.handle.bind(groupXChainCmd),
  },
  [wWingsInRowCmd.name]: {
    meta: wWingsInRowCmd.getMeta(),
    handler: wWingsInRowCmd.handle.bind(wWingsInRowCmd),
  },
  [wWingsInColCmd.name]: {
    meta: wWingsInColCmd.getMeta(),
    handler: wWingsInColCmd.handle.bind(wWingsInColCmd),
  },
  [wWingsInBoxCmd.name]: {
    meta: wWingsInBoxCmd.getMeta(),
    handler: wWingsInBoxCmd.handle.bind(wWingsInBoxCmd),
  },
  [xyWingCmd.name]: {
    meta: xyWingCmd.getMeta(),
    handler: xyWingCmd.handle.bind(xyWingCmd),
  },
  [weakXYWingCmd.name]: {
    meta: weakXYWingCmd.getMeta(),
    handler: weakXYWingCmd.handle.bind(weakXYWingCmd),
  },
};
