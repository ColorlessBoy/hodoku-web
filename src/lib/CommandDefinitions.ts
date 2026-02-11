/**
 * CommandDefinitions - 集中管理所有命令定义
 *
 * 统一注册命令的元数据和处理器，解决命令分散的问题
 */

import type { SudokuSchema, Digit } from '@/types/sudoku';
import type { CmdResult, CmdHandler, PosDigit } from './CmdEngine';
import { registerCommand } from './CommandRegistry';
import {
  cloneCells,
  setCellInplace,
  setSelectRowInplace,
  setSelectCellInplace,
  unsetCellInplace,
  addHighlightedRows,
  setHighlightedRows,
  joinHighlightedRows,
  addHighlightedCols,
  setHighlightedCols,
  joinHighlightedCols,
  addHighlightedBoxes,
  setHighlightedBoxes,
  joinHighlightedBoxes,
  addHighlightedCellInplace,
  clearAllHighlightedInplace,
  setHighlightedDigits,
  addHighlightedDigits,
  joinHighlightedDigits,
  setHighlightedXY,
  addHighlightedXY,
  joinHighlightedXY,
  clearAllHighlighted,
  setSelectedCellInplace,
  clearAllSelectedInplace,
  clearAllSelected,
  setSelectedRows,
  addSelectedRows,
  joinSelectedRows,
  setSelectedCols,
  addSelectedCols,
  joinSelectedCols,
  setSelectedBoxes,
  addSelectedBoxes,
  joinSelectedBoxes,
  autofillUniqueCandidate,
  fillUniqueCandidateInplace,
  fillUniqueRowInplace,
  fillUniqueColInplace,
  fillUniqueBoxInplace,
  setSelectColInplace,
  setSelectBoxInplace,
  createNewSchema,
} from './SudokuEngine';

// ============================================================================
// 工具函数
// ============================================================================

const clampRC = (n: number): number => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number): number => clampRC(n) - 1;

const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });
const intermediate = (schema: SudokuSchema, msg?: string): CmdResult => ({ type: 'intermediate', schema, msg });
const err = (msg: string): CmdResult => ({ type: 'error', msg });
const noop = (): CmdResult => ({ type: 'noop' });

/** 解析 115 格式的位置+数字 */
export function parsePosDigit(token: string): PosDigit | null {
  const t = token.trim().toLowerCase();

  if (t.length >= 2) {
    const row = toZeroIdx(Number(t[0]));
    const col = toZeroIdx(Number(t[1]));
    const box = getBoxIndex(row, col);
    const digit = t.length > 2 ? (clampRC(Number(t[2])) as Digit) : undefined;
    return { row, col, box, digit };
  }

  return null;
}

export function parseRowDigit(token: string): { row: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();

  if (t.length > 0) {
    const row = toZeroIdx(Number(t[0]));
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { row, digit };
  }
  return null;
}

export function parseColDigit(token: string): { col: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();

  if (t.length > 0) {
    const col = toZeroIdx(Number(t[0]));
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { col, digit };
  }
  return null;
}

export function parseBoxDigit(token: string): PosDigit | null {
  const t = token.trim().toLowerCase();

  if (t.length > 0) {
    const box = toZeroIdx(Number(t[0]));
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { row: undefined, col: undefined, box, digit };
  }
  return null;
}

import { getBoxIndex } from '@/types/sudoku';

// ============================================================================
// 命令处理器
// ============================================================================

/** set - 设置格子值 */
const cmdSet: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: s 115 327 781');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: set 115 327 781');
    }
    if (pos.col === undefined) {
      // 中间状态：只选择行，需要更多输入
      setSelectRowInplace(newCells, pos.row);
      return intermediate(
        { ...schema, cells: newCells },
        `请选择行${pos.row + 1}中的列`
      );
    } else if (!pos.digit) {
      // 中间状态：只选择格子，需要更多输入
      setSelectCellInplace(newCells, pos.row, pos.col);
      return intermediate(
        { ...schema, cells: newCells },
        `请为格子(${pos.row + 1}, ${pos.col + 1})输入数字`
      );
    } else {
      // Set digit in cell - using setCellInplace which handles conflict checking
      setCellInplace(newCells, pos.row, pos.col, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
};

/** unset - 清除格子 */
const cmdUnset: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: unset 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: c 11 32 78');
    }
    if (pos.col === undefined) {
      // 中间状态：选择行，等待选择列
      setSelectRowInplace(newCells, pos.row);
      return intermediate(
        { ...schema, cells: newCells },
        `请选择行${pos.row + 1}中的格子清除`
      );
    } else {
      unsetCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

// 高亮命令
const cmdAddHighlightRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hra 1 3 7');
  }
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedRows(schema, rows));
};

const cmdSetHighlightRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hrs 1 3 7');
  }
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedRows(schema, rows));
};

const cmdJoinHighlightRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hrj 1 3 7');
  }
  const rows = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedRows(schema, rows));
};

const cmdAddHighlightCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hca 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedCols(schema, cols));
};

const cmdSetHighlightCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hcs 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedCols(schema, cols));
};

const cmdJoinHighlightCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hcj 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedCols(schema, cols));
};

const cmdAddHighlightBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hba 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addHighlightedBoxes(schema, boxes));
};

const cmdSetHighlightBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hbs 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setHighlightedBoxes(schema, boxes));
};

const cmdJoinHighlightBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hbj 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinHighlightedBoxes(schema, boxes));
};

const cmdAddHighlightCells: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: ha 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: ha 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break;
    } else {
      addHighlightedCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdSetHighlightCells: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hs 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  clearAllHighlightedInplace(newCells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: hs 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break;
    } else {
      addHighlightedCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdAddHighlightDigits: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hda 1 3 7');
  }
  const digits = args.map((arg) => clampRC(Number(arg)) as Digit);
  return ok(addHighlightedDigits(schema, digits));
};

const cmdSetHighlightDigits: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hds 1 3 7');
  }
  const digits = args.map((arg) => clampRC(Number(arg)) as Digit);
  return ok(setHighlightedDigits(schema, digits));
};

const cmdJoinHighlightDigits: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: hdj 1 3 7');
  }
  const digits = args.map((arg) => clampRC(Number(arg)) as Digit);
  return ok(joinHighlightedDigits(schema, digits));
};

const cmdSetHighlightXY: CmdHandler = (schema) => {
  return ok(setHighlightedXY(schema));
};

const cmdAddHighlightXY: CmdHandler = (schema) => {
  return ok(addHighlightedXY(schema));
};

const cmdJoinHighlightXY: CmdHandler = (schema) => {
  return ok(joinHighlightedXY(schema));
};

const cmdUnHighlightAll: CmdHandler = (schema) => {
  return ok(clearAllHighlighted(schema));
};

// 选择命令
const cmdAddSelectCells: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sa 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: sa 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break;
    } else {
      setSelectedCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdSetSelectCells: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: ss 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  clearAllSelectedInplace(newCells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: ss 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
      break;
    } else {
      setSelectedCellInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdSetSelectRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: srs 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedRows(schema, cols));
};

const cmdAddSelectRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sra 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedRows(schema, cols));
};

const cmdJoinSelectRows: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: srj 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedRows(schema, cols));
};

const cmdSetSelectCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: scs 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedCols(schema, cols));
};

const cmdAddSelectCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sca 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedCols(schema, cols));
};

const cmdJoinSelectCols: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: scj 1 3 7');
  }
  const cols = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedCols(schema, cols));
};

const cmdSetSelectBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sb 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(setSelectedBoxes(schema, boxes));
};

const cmdAddSelectBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sba 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(addSelectedBoxes(schema, boxes));
};

const cmdJoinSelectBoxes: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: sbj 1 3 7');
  }
  const boxes = args.map((arg) => toZeroIdx(Number(arg)));
  return ok(joinSelectedBoxes(schema, boxes));
};

const cmdUnSelectAll: CmdHandler = (schema) => {
  return ok(clearAllSelected(schema));
};

// 自动填充命令
const cmdAutoFillUniqueCandidate: CmdHandler = (schema) => {
  const result = autofillUniqueCandidate(schema);
  if (result === schema) {
    return err('没有可自动填充的格子');
  }
  return ok(result);
};

const cmdFillUniqueCandidate: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: fuc 11 32 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parsePosDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: fuc 11 32 78');
    }
    if (pos.col === undefined) {
      setSelectRowInplace(newCells, pos.row);
    } else {
      fillUniqueCandidateInplace(newCells, pos.row, pos.col);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdFillUniqueRow: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: fur 12 23 88');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parseRowDigit(arg);
    if (!pos || pos.row === undefined) {
      return err('用法: fur 11 32 78');
    } else if (!pos.digit) {
      setSelectRowInplace(newCells, pos.row);
      break;
    } else {
      fillUniqueRowInplace(newCells, pos.row, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdFillUniqueCol: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: fuc 12 23 88');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parseColDigit(arg);
    if (!pos || pos.col === undefined) {
      return err('用法: fuc 11 32 78');
    } else if (!pos.digit) {
      setSelectColInplace(newCells, pos.col);
      break;
    } else {
      fillUniqueColInplace(newCells, pos.col, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
};

const cmdFillUniqueBox: CmdHandler = (schema, args) => {
  if (args.length === 0) {
    return err('用法: fub 12 23 78');
  }
  const newCells = cloneCells(schema.cells);
  for (const arg of args) {
    const pos = parseBoxDigit(arg);
    if (!pos || pos.box === undefined) {
      return err('用法: fub 11 32 78');
    } else if (!pos.digit) {
      setSelectBoxInplace(newCells, pos.box);
      break;
    } else {
      fillUniqueBoxInplace(newCells, pos.box, pos.digit);
    }
  }
  return ok({ ...schema, cells: newCells });
};

/** new - 生成新题目 */
const cmdNew: CmdHandler = (_schema, args) => {
  if (args.length < 1 || args[0].length < 81) {
    return err('用法: new 123456789... (81位数字)');
  }
  const arg = args[0];
  const nums: number[][] = [];

  for (let i = 0; i < 9; i++) {
    nums.push([]);
    for (let j = 0; j < 9; j++) {
      const idx = i * 9 + j;
      nums[i].push(Number(arg[idx]));
    }
  }
  return ok(createNewSchema(nums));
};

// ============================================================================
// 初始化所有命令
// ============================================================================

export function initializeCommands(): void {
  // 基础操作
  registerCommand(
    {
      name: 'set',
      aliases: ['s'],
      description: '设置格子值（行+列+数字 格式）',
      category: 'basic',
      args: [
        { type: 'pos', name: 'pos', description: '位置+数字，如 115 表示行1列1设置值为5', repeatable: true },
      ],
      examples: ['set 115 326', 's 115 326'],
    },
    cmdSet
  );

  registerCommand(
    {
      name: 'unset',
      aliases: ['us', 'c'],
      description: '清除格子值',
      category: 'basic',
      args: [
        { type: 'pos', name: 'pos', description: '位置，如 11 表示行1列1', repeatable: true },
      ],
      examples: ['unset 11 32', 'c 11 32'],
    },
    cmdUnset
  );

  // 高亮行
  registerCommand(
    {
      name: 'hra',
      aliases: [],
      description: '添加高亮行',
      category: 'highlight',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['hra 1 3 7'],
    },
    cmdAddHighlightRows
  );

  registerCommand(
    {
      name: 'hrs',
      aliases: ['hr'],
      description: '设置高亮行（替换现有）',
      category: 'highlight',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['hrs 1 3 7'],
    },
    cmdSetHighlightRows
  );

  registerCommand(
    {
      name: 'hrj',
      aliases: [],
      description: '高亮行取交集',
      category: 'highlight',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['hrj 1 3 7'],
    },
    cmdJoinHighlightRows
  );

  // 高亮列
  registerCommand(
    {
      name: 'hca',
      aliases: [],
      description: '添加高亮列',
      category: 'highlight',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['hca 1 3 7'],
    },
    cmdAddHighlightCols
  );

  registerCommand(
    {
      name: 'hcs',
      aliases: ['hc'],
      description: '设置高亮列（替换现有）',
      category: 'highlight',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['hcs 1 3 7'],
    },
    cmdSetHighlightCols
  );

  registerCommand(
    {
      name: 'hcj',
      aliases: [],
      description: '高亮列取交集',
      category: 'highlight',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['hcj 1 3 7'],
    },
    cmdJoinHighlightCols
  );

  // 高亮宫
  registerCommand(
    {
      name: 'hba',
      aliases: [],
      description: '添加高亮宫',
      category: 'highlight',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['hba 1 3 7'],
    },
    cmdAddHighlightBoxes
  );

  registerCommand(
    {
      name: 'hbs',
      aliases: ['hb'],
      description: '设置高亮宫（替换现有）',
      category: 'highlight',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['hbs 1 3 7'],
    },
    cmdSetHighlightBoxes
  );

  registerCommand(
    {
      name: 'hbj',
      aliases: [],
      description: '高亮宫取交集',
      category: 'highlight',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['hbj 1 3 7'],
    },
    cmdJoinHighlightBoxes
  );

  // 高亮数字
  registerCommand(
    {
      name: 'hda',
      aliases: [],
      description: '添加高亮数字',
      category: 'highlight',
      args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
      examples: ['hda 1 3 7'],
    },
    cmdAddHighlightDigits
  );

  registerCommand(
    {
      name: 'hds',
      aliases: ['h', 'hd'],
      description: '设置高亮数字（替换现有）',
      category: 'highlight',
      args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
      examples: ['hds 1 3 7'],
    },
    cmdSetHighlightDigits
  );

  registerCommand(
    {
      name: 'hdj',
      aliases: [],
      description: '高亮数字取交集',
      category: 'highlight',
      args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
      examples: ['hdj 1 3 7'],
    },
    cmdJoinHighlightDigits
  );

  // 高亮格子
  registerCommand(
    {
      name: 'ha',
      aliases: [],
      description: '添加高亮格子',
      category: 'highlight',
      args: [{ type: 'pos', name: 'positions', description: '位置如 11, 23', repeatable: true }],
      examples: ['ha 12 23 34'],
    },
    cmdAddHighlightCells
  );

  registerCommand(
    {
      name: 'hs',
      aliases: [],
      description: '设置高亮格子（替换现有）',
      category: 'highlight',
      args: [{ type: 'pos', name: 'positions', description: '位置如 11, 23', repeatable: true }],
      examples: ['hs 12 23 34'],
    },
    cmdSetHighlightCells
  );

  // 高亮XY（双候选数）
  registerCommand(
    {
      name: 'hxys',
      aliases: ['hxy'],
      description: '高亮双候选数格子',
      category: 'highlight',
      args: [],
      examples: ['hxys'],
    },
    cmdSetHighlightXY
  );

  registerCommand(
    {
      name: 'hxya',
      aliases: [],
      description: '添加高亮双候选数格子',
      category: 'highlight',
      args: [],
      examples: ['hxya'],
    },
    cmdAddHighlightXY
  );

  registerCommand(
    {
      name: 'hxyj',
      aliases: [],
      description: '高亮双候选数格子取交集',
      category: 'highlight',
      args: [],
      examples: ['hxyj'],
    },
    cmdJoinHighlightXY
  );

  // 取消高亮
  registerCommand(
    {
      name: 'uh',
      aliases: [],
      description: '取消所有高亮',
      category: 'highlight',
      args: [],
      examples: ['uh'],
    },
    cmdUnHighlightAll
  );

  // 选择命令
  registerCommand(
    {
      name: 'ss',
      aliases: ['s'],
      description: '设置选择格子（替换现有）',
      category: 'select',
      args: [{ type: 'pos', name: 'positions', description: '位置如 11, 23', repeatable: true }],
      examples: ['ss 12 34 42'],
    },
    cmdSetSelectCells
  );

  registerCommand(
    {
      name: 'sa',
      aliases: [],
      description: '添加选择格子',
      category: 'select',
      args: [{ type: 'pos', name: 'positions', description: '位置如 11, 23', repeatable: true }],
      examples: ['sa 12 34 42'],
    },
    cmdAddSelectCells
  );

  // 选择行
  registerCommand(
    {
      name: 'srs',
      aliases: ['sr'],
      description: '设置选择行（替换现有）',
      category: 'select',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['srs 1 3 7'],
    },
    cmdSetSelectRows
  );

  registerCommand(
    {
      name: 'sra',
      aliases: [],
      description: '添加选择行',
      category: 'select',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['sra 1 3 7'],
    },
    cmdAddSelectRows
  );

  registerCommand(
    {
      name: 'srj',
      aliases: [],
      description: '选择行取交集',
      category: 'select',
      args: [{ type: 'row', name: 'rows', description: '行号 1-9', repeatable: true }],
      examples: ['srj 1 3 7'],
    },
    cmdJoinSelectRows
  );

  // 选择列
  registerCommand(
    {
      name: 'scs',
      aliases: ['sc'],
      description: '设置选择列（替换现有）',
      category: 'select',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['scs 1 3 7'],
    },
    cmdSetSelectCols
  );

  registerCommand(
    {
      name: 'sca',
      aliases: ['scc'],
      description: '添加选择列',
      category: 'select',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['sca 1 3 7'],
    },
    cmdAddSelectCols
  );

  registerCommand(
    {
      name: 'scj',
      aliases: [],
      description: '选择列取交集',
      category: 'select',
      args: [{ type: 'col', name: 'cols', description: '列号 1-9', repeatable: true }],
      examples: ['scj 1 3 7'],
    },
    cmdJoinSelectCols
  );

  // 选择宫
  registerCommand(
    {
      name: 'sbs',
      aliases: ['sb'],
      description: '设置选择宫（替换现有）',
      category: 'select',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['sbs 1 3 7'],
    },
    cmdSetSelectBoxes
  );

  registerCommand(
    {
      name: 'sba',
      aliases: [],
      description: '添加选择宫',
      category: 'select',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['sba 1 3 7'],
    },
    cmdAddSelectBoxes
  );

  registerCommand(
    {
      name: 'sbj',
      aliases: [],
      description: '选择宫取交集',
      category: 'select',
      args: [{ type: 'box', name: 'boxes', description: '宫号 1-9', repeatable: true }],
      examples: ['sbj 1 3 7'],
    },
    cmdJoinSelectBoxes
  );

  // 取消选择
  registerCommand(
    {
      name: 'us',
      aliases: [],
      description: '取消所有选择',
      category: 'select',
      args: [],
      examples: ['us'],
    },
    cmdUnSelectAll
  );

  // 自动填充
  registerCommand(
    {
      name: 'autofuc',
      aliases: ['auto'],
      description: '自动填充所有唯一候选数',
      category: 'auto',
      args: [],
      examples: ['autofuc', 'auto'],
    },
    cmdAutoFillUniqueCandidate
  );

  registerCommand(
    {
      name: 'fu',
      aliases: ['fuc'],
      description: '填充指定格子的唯一候选数',
      category: 'auto',
      args: [{ type: 'pos', name: 'positions', description: '位置如 11, 23', repeatable: true }],
      examples: ['fu 11 32', 'fuc 11'],
    },
    cmdFillUniqueCandidate
  );

  registerCommand(
    {
      name: 'fur',
      aliases: [],
      description: '填充行内唯一数',
      category: 'auto',
      args: [{ type: 'row', name: 'positions', description: '行+数字如 23 表示行2的3', repeatable: true }],
      examples: ['fur 23 15'],
    },
    cmdFillUniqueRow
  );

  registerCommand(
    {
      name: 'fucol',
      aliases: [],
      description: '填充列内唯一数',
      category: 'auto',
      args: [{ type: 'col', name: 'positions', description: '列+数字如 23 表示列2的3', repeatable: true }],
      examples: ['fucol 23 15'],
    },
    cmdFillUniqueCol
  );

  registerCommand(
    {
      name: 'fub',
      aliases: [],
      description: '填充宫内唯一数',
      category: 'auto',
      args: [{ type: 'box', name: 'positions', description: '宫+数字如 23 表示宫2的3', repeatable: true }],
      examples: ['fub 23 15'],
    },
    cmdFillUniqueBox
  );

  // 新题目
  registerCommand(
    {
      name: 'new',
      aliases: [],
      description: '导入新题目（81位数字）',
      category: 'new',
      args: [{ type: 'string', name: 'puzzle', description: '81位数字字符串，0表示空格' }],
      examples: ['new 530070000600195000098006800800060003400803001700020006060000280000419005000080079'],
    },
    cmdNew
  );

  // 撤销/重做
  registerCommand(
    {
      name: 'undo',
      aliases: ['u'],
      description: '撤销上一步操作',
      category: 'history',
      args: [],
      examples: ['undo', 'u'],
    },
    () => noop()
  );

  registerCommand(
    {
      name: 'redo',
      aliases: ['r'],
      description: '重做下一步操作',
      category: 'history',
      args: [],
      examples: ['redo', 'r'],
    },
    () => noop()
  );
}
