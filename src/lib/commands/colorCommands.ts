/**
 * Color Commands - 候选数染色命令
 *
 * 提供格子、行、列、宫内的候选数染色功能
 */

import type { SudokuSchema, Digit, CandidateColor } from '@/types/sudoku';
import type { CmdHandler, CommandConfig } from './types';
import {
  cloneCells,
  setCandidatesColorCellInplace,
  setCandidatesColorRowInplace,
  setCandidatesColorColInplace,
  setCandidatesColorBoxInplace,
  setSelectRowInplace,
  setSelectCellInplace,
  setSelectColInplace,
  setSelectBoxInplace,
  joinSelectedDigitInplace,
} from '../SudokuEngine';
import { ok, err, intermediate, clampRC, toZeroIdx } from './utils';

/** 解析 115 格式的位置+数字 */
function parsePosDigit(token: string): { row?: number; col?: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length <= 0) return null;
  const row = toZeroIdx(Number(t[0]));
  if (t.length <= 1) return { row };
  const col = toZeroIdx(Number(t[1]));
  if (t.length <= 2) return { row, col };
  const digit = clampRC(Number(t[2])) as Digit;
  return { row, col, digit };
}

function parseColor(token: string) : CandidateColor {
  const t = token.trim().toLowerCase();
  if (t.length <= 0) return null;
  if (Number(t[0]) === 0) return null;
  const color = clampRC(Number(t[0]));
  return color as CandidateColor;
}

/** 解析行+数字 */
function parseRowDigit(token: string): { row?: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length <= 0) return null;
  const row = toZeroIdx(Number(t[0]));
  if (t.length <= 1) return { row };
  const digit = clampRC(Number(t[1])) as Digit;
  return { row, digit };
}

/** 解析列+数字 */
function parseColDigit(token: string): { col?: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length <= 0) return null;
  const col = toZeroIdx(Number(t[0]));
  if (t.length <= 1) return { col };
  const digit = clampRC(Number(t[1])) as Digit;
  return { col, digit };
}

/** 解析宫+数字 */
function parseBoxDigit(token: string): { box?: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length <= 0) return null;
  const box = toZeroIdx(Number(t[0]));
  if (t.length <= 1) return { box };
  const digit = clampRC(Number(t[1])) as Digit;
  return { box, digit };
}

// ============================================================================
// 命令处理器
// ============================================================================

/** 格子候选数染色 */
const cmdSetCandidateColorCell: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: nc <row><col><digit><colornum>');
  }
  const newCells = cloneCells(schema.cells);
  const pos = parsePosDigit(args[0]);
  if (!pos || pos.row === undefined) {
    return err('用法: nc <row><col><digit><colornum>');
  }
  if (pos.col === undefined) {
    setSelectRowInplace(newCells, pos.row);
    return intermediate({ ...schema, cells: newCells });
  } else if (pos.digit === undefined) {
    setSelectCellInplace(newCells, pos.row, pos.col);
    return intermediate({ ...schema, cells: newCells });
  } else if (args[0].length < 4) {
    setSelectCellInplace(newCells, pos.row, pos.col);
    setCandidatesColorCellInplace(newCells, pos.row, pos.col, pos.digit, 1 as CandidateColor);
    return intermediate({ ...schema, cells: newCells });
  } else {
    const color = parseColor(args[0][3]);
    setCandidatesColorCellInplace(newCells, pos.row, pos.col, pos.digit, color);
  }
  return ok({ ...schema, cells: newCells });
};

/** 行内候选数染色 */
const cmdSetCandidateColorRow: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: ncr <row><digit><colornum>');
  }
  const newCells = cloneCells(schema.cells);
  const pos = parseRowDigit(args[0]);
  if (!pos || pos.row === undefined) {
    return err('用法: ncr <row><digit><colornum>');
  } else if (pos.digit === undefined) {
    setSelectRowInplace(newCells, pos.row);
    return intermediate({ ...schema, cells: newCells });
  } else if (args[0].length < 3) {
    setSelectRowInplace(newCells, pos.row);
    joinSelectedDigitInplace(newCells, pos.digit);
    setCandidatesColorRowInplace(newCells, pos.row, pos.digit, 1 as CandidateColor);
    return intermediate({ ...schema, cells: newCells });
  } else {
    const color = parseColor(args[0][2]);
    setCandidatesColorRowInplace(newCells, pos.row, pos.digit, color);
  }
  return ok({ ...schema, cells: newCells });
};

/** 列内候选数染色 */
const cmdSetCandidateColorCol: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: ncc <col><digit><colornum>');
  }
  const newCells = cloneCells(schema.cells);
  const pos = parseColDigit(args[0]);
  if (!pos || pos.col === undefined) {
    return err('用法: ncc <col><digit><colornum>');
  } else if (pos.digit === undefined) {
    setSelectColInplace(newCells, pos.col);
    return intermediate({ ...schema, cells: newCells });
  } else if (args[0].length < 3) {
    setSelectColInplace(newCells, pos.col);
    joinSelectedDigitInplace(newCells, pos.digit);
    setCandidatesColorColInplace(newCells, pos.col, pos.digit, 1 as CandidateColor);
    return intermediate({ ...schema, cells: newCells });
  } else {
    const color = parseColor(args[0][2]);
    setCandidatesColorColInplace(newCells, pos.col, pos.digit, color);
  }
  return ok({ ...schema, cells: newCells });
};

/** 宫内候选数染色 */
const cmdSetCandidateColorBox: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: ncb <box><digit><colornum>');
  }
  const newCells = cloneCells(schema.cells);
  const pos = parseBoxDigit(args[0]);
  if (!pos || pos.box === undefined) {
    return err('用法: ncb <box><digit><colornum>');
  } else if (pos.digit === undefined) {
    setSelectBoxInplace(newCells, pos.box);
    return intermediate({ ...schema, cells: newCells });
  } else if (args[0].length < 3) {
    setSelectBoxInplace(newCells, pos.box);
    joinSelectedDigitInplace(newCells, pos.digit);
    setCandidatesColorBoxInplace(newCells, pos.box, pos.digit, 1 as CandidateColor);
    return intermediate({ ...schema, cells: newCells });
  } else {
    const color = parseColor(args[0][2]);
    setCandidatesColorBoxInplace(newCells, pos.box, pos.digit, color);
  }
  return ok({ ...schema, cells: newCells });
};

// ============================================================================
// 命令配置导出
// ============================================================================

export const colorCommands: CommandConfig = {
  notecolor: {
    meta: {
      name: 'notecolor',
      aliases: ['nc'],
      description: '候选数染色（格子级别）',
      category: 'color',
      args: [
        {
          type: 'pos',
          name: '参数',
          description: '格式: <行><列><数字><颜色>, 如 1121 表示行1列1的数字1染颜色1',
          repeatable: false,
        },
      ],
      examples: ['nc 1121', 'nc 1152'],
    },
    handler: cmdSetCandidateColorCell,
  },

  noterowcolor: {
    meta: {
      name: 'noterowcolor',
      aliases: ['nrc'],
      description: '行内候选数染色',
      category: 'color',
      args: [
        {
          type: 'row',
          name: '参数',
          description: '格式: <行><数字><颜色>, 如 121 表示行1的数字2染颜色1',
          repeatable: false,
        },
      ],
      examples: ['nrc 121', 'nrc 352'],
    },
    handler: cmdSetCandidateColorRow,
  },

  notecolcolor: {
    meta: {
      name: 'notecolcolor',
      aliases: ['ncc'],
      description: '列内候选数染色',
      category: 'color',
      args: [
        {
          type: 'col',
          name: '参数',
          description: '格式: <列><数字><颜色>, 如 121 表示列1的数字2染颜色1',
          repeatable: false,
        },
      ],
      examples: ['ncc 121', 'ncc 352'],
    },
    handler: cmdSetCandidateColorCol,
  },

  notecolboxcolor: {
    meta: {
      name: 'notecolboxcolor',
      aliases: ['ncb'],
      description: '宫内候选数染色',
      category: 'color',
      args: [
        {
          type: 'box',
          name: '参数',
          description: '格式: <宫><数字><颜色>, 如 121 表示宫1的数字2染颜色1',
          repeatable: false,
        },
      ],
      examples: ['ncb 121', 'ncb 352'],
    },
    handler: cmdSetCandidateColorBox,
  },
};
