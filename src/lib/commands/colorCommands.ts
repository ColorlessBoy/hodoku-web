/**
 * Color Commands - 颜色命令
 *
 * 使用类继承方式定义命令
 */

import type { Color, SudokuSchema } from '@/lib/sudoku/types';
import type { CmdResult } from './types';
import {
  cleanAllCellsSelected,
  setBoxCandidateColor,
  setBoxSelected,
  setCellCandidateColor,
  setCellSelected,
  setColCandidateColor,
  setColSelected,
  setDigitSelected,
  setRowCandidateColor,
  setRowSelected,
} from '@/lib/sudoku';
import { ok, toDigit, toRow, intermediate, toBox, toCol, toColor0 } from './utils';
import { BaseCommand } from './Command';
import { cloneCells } from '../sudoku/basic';

// ============================================================================
// 自动填充命令
// ============================================================================

class ColorCellCandidateCmd extends BaseCommand {
  constructor() {
    super({
      name: 'colorcandidate',
      aliases: ['c'],
      category: 'color',
      description: '设置格子候选数颜色',
      args: [
        {
          type: 'poscolor',
          name: 'poscolor',
          description: '格子位置（如 23） + 候选数（如 1） + 颜色（如 3）',
          repeatable: true,
        },
      ],
      examples: ['c 2313'],
    });
  }
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const row = toRow(arg[0]);
      if (arg.length === 1) {
        cleanAllCellsSelected(cells);
        setRowSelected(cells, row);
        return intermediate({ ...schema, cells });
      }
      const col = toCol(arg[1]);
      if (arg.length === 2) {
        cleanAllCellsSelected(cells);
        setCellSelected(cells[row][col]);
        return intermediate({ ...schema, cells });
      }
      const digit = toDigit(arg[2]);
      if (arg.length === 3) {
        setCellCandidateColor(cells[row][col], digit, 1 as Color);
        return intermediate({ ...schema, cells });
      }
      const color = toColor0(arg[3]);
      if (setCellCandidateColor(cells[row][col], digit, color)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有格子候选数被染色');
    }
    return ok({ ...schema, cells });
  }
}

class ColorRowCandidateCmd extends BaseCommand {
  constructor() {
    super({
      name: 'crow',
      aliases: ['cr'],
      category: 'color',
      description: '选择行内某个候选数染色',
      args: [
        {
          type: 'numdigitcolor',
          name: 'rowdigitcolor',
          description: '行位置（如 1, 2, 3）+数字+颜色（如 3）',
          repeatable: true,
        },
      ],
      examples: ['cr 123'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const row = toRow(arg[0]);
      if (arg.length === 1) {
        cleanAllCellsSelected(cells);
        setRowSelected(cells, row);
        return intermediate({ ...schema, cells });
      }
      const digit = toDigit(arg[1]);
      if (arg.length === 2) {
        setRowCandidateColor(cells, row, digit, 1 as Color);
      }
      const color = toColor0(arg[2]);
      if (setRowCandidateColor(cells, row, digit, color)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有行被改变');
    }
    return ok({ ...schema, cells });
  }
}

class ColorColCandidateCmd extends BaseCommand {
  constructor() {
    super({
      name: 'cc',
      aliases: ['cc'],
      category: 'color',
      description: '选择列内某个候选数染色',
      args: [
        {
          type: 'numdigitcolor',
          name: 'coldigitcolor',
          description: '列位置（如 1, 2, 3）+数字+颜色（如 3）',
          repeatable: true,
        },
      ],
      examples: ['cc 123'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const col = toCol(arg[0]);
      if (arg.length === 1) {
        cleanAllCellsSelected(cells);
        setColSelected(cells, col);
        return intermediate({ ...schema, cells });
      }
      const digit = toDigit(arg[1]);
      if (arg.length === 2) {
        setColCandidateColor(cells, col, digit, 1 as Color);
      }
      const color = toColor0(arg[2]);
      if (setColCandidateColor(cells, col, digit, color)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有列被染色');
    }
    return ok({ ...schema, cells });
  }
}

class ColorBoxCandidateCmd extends BaseCommand {
  constructor() {
    super({
      name: 'cbox',
      aliases: ['cb'],
      category: 'color',
      description: '选择宫内某个候选数染色',
      args: [
        {
          type: 'numdigitcolor',
          name: 'boxdigitcolor',
          description: '宫位置（如 1, 2, 3）+数字+颜色（如 3）',
          repeatable: true,
        },
      ],
      examples: ['cbox 123'],
    });
  }

  execute(schema: SudokuSchema, args: string[]): CmdResult {
    let changed = false;
    const cells = cloneCells(schema.cells);
    for (const arg of args) {
      const box = toBox(arg[0]);
      if (arg.length === 1) {
        cleanAllCellsSelected(cells);
        setBoxSelected(cells, box);
        return intermediate({ ...schema, cells });
      }
      const digit = toDigit(arg[1]);
      if (arg.length === 2) {
        cleanAllCellsSelected(cells);
        setBoxSelected(cells, box);
        setDigitSelected(cells, digit, true, true);
        return intermediate({ ...schema, cells });
      }
      const color = toColor0(arg[2]);
      if (setBoxCandidateColor(cells, box, digit, color)) {
        changed = true;
      }
    }
    if (!changed) {
      return this.error('没有宫被染色');
    }
    return ok({ ...schema, cells });
  }
}

// ============================================================================
// 导出
// ============================================================================

const colorCellCmd = new ColorCellCandidateCmd();
const colorRowCmd = new ColorRowCandidateCmd();
const colorColCmd = new ColorColCandidateCmd();
const colorBoxCmd = new ColorBoxCandidateCmd();

export { colorCellCmd, colorRowCmd, colorColCmd, colorBoxCmd };

export const colorCommands = {
  [colorCellCmd.name]: {
    meta: colorCellCmd.getMeta(),
    handler: colorCellCmd.handle.bind(colorCellCmd),
  },
  [colorRowCmd.name]: {
    meta: colorRowCmd.getMeta(),
    handler: colorRowCmd.handle.bind(colorRowCmd),
  },
  [colorColCmd.name]: {
    meta: colorColCmd.getMeta(),
    handler: colorColCmd.handle.bind(colorColCmd),
  },
  [colorBoxCmd.name]: {
    meta: colorBoxCmd.getMeta(),
    handler: colorBoxCmd.handle.bind(colorBoxCmd),
  },
};
