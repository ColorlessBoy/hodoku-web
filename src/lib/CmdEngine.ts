/**
 * CmdEngine - 命令解析引擎（重构版）
 *
 * 主要改进：
 * 1. 使用 CommandRegistry 统一管理命令
 * 2. 使用更安全的方式处理 undefined/null
 * 3. 集中化的命令定义和文档
 */

import type { SudokuSchema, Digit } from '@/lib/sudoku';
import {
  getCommandHandler,
  hasCommand,
  getAllCommands,
  getAllHelpText,
  generateHelpText,
  getCommandMeta,
} from '@/lib/commands';



// 导入并注册所有命令
import { preloadAllCommands } from '@/lib/commands';

// 立即注册所有命令
preloadAllCommands();

// ============================================================================
// 类型定义
// ============================================================================

/** 命令执行结果 */
export type CmdResult =
  | { type: 'ok'; schema: SudokuSchema }
  | { type: 'intermediate'; schema: SudokuSchema; msg?: string } // 中间状态（如需要更多输入）
  | { type: 'error'; msg: string }
  | { type: 'noop' }; // 无操作（如 undo/redo 由外部处理）

/** 位置+数字解析结果 - 使用更安全的方式 */
export interface PosDigit {
  row?: number;
  col?: number;
  box?: number;
  digit?: Digit;
}

/** 命令处理器 */
export type CmdHandler = (
  schema: SudokuSchema,
  args: string[],
  flags?: Record<string, boolean>
) => CmdResult;

// ============================================================================
// 安全的工具函数
// ============================================================================

const clampRC = (n: number): number => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number): number => clampRC(n) - 1;

/** 创建成功的结果 */
const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });

/** 创建错误结果 */
const err = (msg: string): CmdResult => ({ type: 'error', msg });

/** 创建无操作结果 */
const noop = (): CmdResult => ({ type: 'noop' });

// ============================================================================
// 位置解析（更安全的实现）
// ============================================================================

import { getBoxIndex } from '@/types/sudoku';

/** 解析 115 格式的位置+数字 - 使用更安全的返回值 */
export function parsePosDigit(token: string): PosDigit | null {
  const t = token.trim().toLowerCase();

  if (t.length < 2) {
    return null;
  }

  const rowNum = Number(t[0]);
  const colNum = Number(t[1]);

  // 验证数字有效性
  if (isNaN(rowNum) || isNaN(colNum)) {
    return null;
  }

  const row = toZeroIdx(rowNum);
  const col = toZeroIdx(colNum);
  const box = getBoxIndex(row, col);
  const digit = t.length > 2 ? (clampRC(Number(t[2])) as Digit) : undefined;

  return { row, col, box, digit };
}

/** 解析行+数字格式 */
export function parseRowDigit(token: string): { row: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();

  if (t.length === 0) {
    return null;
  }

  const rowNum = Number(t[0]);
  if (isNaN(rowNum)) {
    return null;
  }

  const row = toZeroIdx(rowNum);
  const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;

  return { row, digit };
}

/** 解析列+数字格式 */
export function parseColDigit(token: string): { col: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();

  if (t.length === 0) {
    return null;
  }

  const colNum = Number(t[0]);
  if (isNaN(colNum)) {
    return null;
  }

  const col = toZeroIdx(colNum);
  const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;

  return { col, digit };
}

/** 解析宫+数字格式 */
export function parseBoxDigit(token: string): { box: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();

  if (t.length === 0) {
    return null;
  }

  const boxNum = Number(t[0]);
  if (isNaN(boxNum)) {
    return null;
  }

  const box = toZeroIdx(boxNum);
  const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;

  return { box, digit };
}

// ============================================================================
// 主入口
// ============================================================================

function isNumber(s: string): boolean {
  return !isNaN(Number(s));
}

/**
 * 执行单条命令
 * @param schema 当前数独状态
 * @param command 命令字符串
 * @returns 执行结果
 */
export function executeCommand(schema: SudokuSchema, command: string): CmdResult {
  const s = command.trim();
  if (!s) return err('空命令');

  const parts = s.split(/\s+/);
  const cmd = isNumber(parts[0]) ? 'hds' : parts[0].toLowerCase(); // 默认高亮数字
  const args = isNumber(parts[0]) ? parts.slice(0, 1) : parts.slice(1);

  // 帮助命令
  if (cmd === 'help') {
    if (args.length === 0) {
      return { type: 'ok', schema };
    }
    const meta = getCommandMeta(args[0]);
    if (meta) {
      console.log(generateHelpText(meta));
    }
    return { type: 'ok', schema };
  }

  const handler = getCommandHandler(cmd);
  if (!handler) {
    return err(`未知命令: ${cmd}`);
  }

  try {
    return handler(schema, args);
  } catch (e) {
    return err(`执行错误: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 批量执行命令（分号分隔）
 * @param schema 当前数独状态
 * @param commands 命令字符串（可多命令，分号分隔）
 * @returns 执行结果和最终 schema
 */
export function executeCommands(
  schema: SudokuSchema,
  commands: string
): { result: CmdResult; finalSchema: SudokuSchema } {
  const cmds = commands
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  let currentSchema = schema;
  let lastResult: CmdResult = { type: 'noop' };

  for (const cmd of cmds) {
    lastResult = executeCommand(currentSchema, cmd);

    if (lastResult.type === 'error') {
      break;
    }

    if (lastResult.type === 'intermediate') {
      // 中间状态：返回该状态，不继续执行后续命令
      return {
        result: lastResult,
        finalSchema: currentSchema,
      };
    }

    if (lastResult.type === 'ok') {
      currentSchema = lastResult.schema;
    }
    // noop 不改变 schema
  }

  return {
    result: lastResult,
    finalSchema: currentSchema,
  };
}

/**
 * 获取命令列表（用于帮助/自动补全）
 * @returns 命令名称列表
 */
export function getCommandList(): string[] {
  const commands = getAllCommands();
  return commands.flatMap((cmd) => [cmd.name, ...cmd.aliases]).sort();
}

/**
 * 检查命令是否存在
 * @param name 命令名称
 * @returns 是否存在
 */
export function checkCommandExists(name: string): boolean {
  return hasCommand(name);
}

/**
 * 获取所有命令帮助文本
 * @returns 帮助文本
 */
export function getAllHelp(): string {
  return getAllHelpText();
}
