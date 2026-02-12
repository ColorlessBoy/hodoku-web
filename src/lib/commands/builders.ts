/**
 * Command Builders - 命令构建器
 *
 * 提供函数式命令构建工具，简化重复模式
 */

import type { SudokuSchema } from '@/types/sudoku';
import type { CmdResult, CommandConfig, CommandMeta } from './types';
import { ok, err, clampRC, toZeroIdx } from './utils';
import { parseZeroIndices, parseDigits } from './parsers';

// ============================================================================
// 处理器构建器
// ============================================================================

/** 简单的无参处理器 */
export const simpleHandler =
  (fn: (schema: SudokuSchema) => SudokuSchema) =>
  (schema: SudokuSchema): CmdResult =>
    ok(fn(schema));

/** 需要参数的处理器 */
export const withArgs =
  <T>(
    parseFn: (args: string[]) => T | null,
    execFn: (schema: SudokuSchema, parsed: T) => SudokuSchema,
    usage: string
  ) =>
  (schema: SudokuSchema, args: string[]): CmdResult => {
    const parsed = parseFn(args);
    if (parsed === null) return err(usage);
    return ok(execFn(schema, parsed));
  };

// ============================================================================
// 批量操作构建器（用于高亮/选择行、列、宫）
// ============================================================================

type BatchOperation = 'set' | 'add' | 'join';
type TargetType = 'row' | 'col' | 'box';

interface BatchFunctions {
  set: (schema: SudokuSchema, indices: number[]) => SudokuSchema;
  add: (schema: SudokuSchema, indices: number[]) => SudokuSchema;
  join: (schema: SudokuSchema, indices: number[]) => SudokuSchema;
}

/** 创建批量操作处理器 */
export const createBatchHandler = (
  operation: BatchOperation,
  fns: BatchFunctions,
  targetType: TargetType,
  usage: string
) => {
  return (schema: SudokuSchema, args: string[]): CmdResult => {
    if (args.length === 0) return err(usage);
    const indices = parseZeroIndices(args);
    const fn = fns[operation];
    return ok(fn(schema, indices));
  };
};

/** 创建批量操作命令配置 */
export const createBatchCommands = (
  fns: BatchFunctions,
  targetType: TargetType,
  prefix: string
): CommandConfig => {
  const descriptions = {
    row: { s: '行', add: '高亮行', verb: '选择' },
    col: { s: '列', add: '高亮列', verb: '选择' },
    box: { s: '宫', add: '高亮宫', verb: '选择' },
  };

  const d = descriptions[targetType];
  const baseName = prefix === 'h' ? d.add : d.verb + d.s;
  const isSelect = prefix === 's';

  return {
    [`${prefix}${targetType}a`]: {
      meta: {
        name: `${prefix}${targetType}a`,
        aliases: [],
        description: `添加${baseName}`,
        category: isSelect ? 'select' : 'highlight',
        args: [{ type: targetType, name: `${targetType}s`, description: `${d.s}号 1-9`, repeatable: true }],
        examples: [`${prefix}${targetType}a 1 3 7`],
      },
      handler: (schema, args) => {
        if (args.length === 0) return err(`用法: ${prefix}${targetType}a 1 3 7`);
        return ok(fns.add(schema, parseZeroIndices(args)));
      },
    },

    [`${prefix}${targetType}s`]: {
      meta: {
        name: `${prefix}${targetType}s`,
        aliases: isSelect ? [`${prefix}${targetType}`] : [`${prefix}${targetType}`],
        description: `设置${baseName}（替换现有）`,
        category: isSelect ? 'select' : 'highlight',
        args: [{ type: targetType, name: `${targetType}s`, description: `${d.s}号 1-9`, repeatable: true }],
        examples: [`${prefix}${targetType}s 1 3 7`],
      },
      handler: (schema, args) => {
        if (args.length === 0) return err(`用法: ${prefix}${targetType}s 1 3 7`);
        return ok(fns.set(schema, parseZeroIndices(args)));
      },
    },

    [`${prefix}${targetType}j`]: {
      meta: {
        name: `${prefix}${targetType}j`,
        aliases: [],
        description: `${baseName}取交集`,
        category: isSelect ? 'select' : 'highlight',
        args: [{ type: targetType, name: `${targetType}s`, description: `${d.s}号 1-9`, repeatable: true }],
        examples: [`${prefix}${targetType}j 1 3 7`],
      },
      handler: (schema, args) => {
        if (args.length === 0) return err(`用法: ${prefix}${targetType}j 1 3 7`);
        return ok(fns.join(schema, parseZeroIndices(args)));
      },
    },
  };
};

// ============================================================================
// 数字操作构建器
// ============================================================================

interface DigitFunctions {
  set: (schema: SudokuSchema, digits: number[]) => SudokuSchema;
  add: (schema: SudokuSchema, digits: number[]) => SudokuSchema;
  join: (schema: SudokuSchema, digits: number[]) => SudokuSchema;
}

/** 创建数字操作命令配置（如高亮数字） */
export const createDigitCommands = (
  fns: DigitFunctions,
  prefix: string,
  category: 'highlight' | 'select' = 'highlight'
): CommandConfig => {
  const isSelect = category === 'select';
  const action = isSelect ? '选择' : '高亮';

  return {
    [`${prefix}a`]: {
      meta: {
        name: `${prefix}a`,
        aliases: [],
        description: `添加${action}数字`,
        category,
        args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
        examples: [`${prefix}a 1 3 7`],
      },
      handler: (schema, args) => {
        if (args.length === 0) return err(`用法: ${prefix}a 1 3 7`);
        return ok(fns.add(schema, parseDigits(args)));
      },
    },

    [`${prefix}s`]: {
      meta: {
        name: `${prefix}s`,
        aliases: [prefix],
        description: `设置${action}数字（替换现有）`,
        category,
        args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
        examples: [`${prefix}s 1 3 7`],
      },
      handler: (schema, args) => {
        if (args.length === 0) return err(`用法: ${prefix}s 1 3 7`);
        return ok(fns.set(schema, parseDigits(args)));
      },
    },

    [`${prefix}j`]: {
      meta: {
        name: `${prefix}j`,
        aliases: [],
        description: `${action}数字取交集`,
        category,
        args: [{ type: 'digit', name: 'digits', description: '数字 1-9', repeatable: true }],
        examples: [`${prefix}j 1 3 7`],
      },
      handler: (schema, args) => {
        if (args.length === 0) return err(`用法: ${prefix}j 1 3 7`);
        return ok(fns.join(schema, parseDigits(args)));
      },
    },
  };
};
