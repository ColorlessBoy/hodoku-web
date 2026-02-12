/**
 * Command Utils - 命令工具函数
 *
 * 提供命令处理中常用的工具函数
 */

import type { SudokuSchema } from '@/types/sudoku';
import type { CmdResult } from './types';

// ============================================================================
// 数值工具
// ============================================================================

/** 将 1-9 的数字限制在有效范围内 */
export const clampRC = (n: number): number => Math.max(1, Math.min(9, n));

/** 将 1-9 转换为 0-8 的索引 */
export const toZeroIdx = (n: number): number => clampRC(n) - 1;

/** 将字符串数组转换为数字数组 */
export const toNumbers = (args: string[]): number[] => args.map((arg) => Number(arg));

/** 将字符串数组转换为零基索引数组 */
export const toZeroIndices = (args: string[]): number[] =>
  args.map((arg) => toZeroIdx(Number(arg)));

// ============================================================================
// 结果构造器
// ============================================================================

/** 创建成功的结果 */
export const ok = (schema: SudokuSchema): CmdResult => ({ type: 'ok', schema });

/** 创建错误结果 */
export const err = (msg: string): CmdResult => ({ type: 'error', msg });

/** 创建无操作结果 */
export const noop = (): CmdResult => ({ type: 'noop' });

/** 创建中间状态结果 */
export const intermediate = (schema: SudokuSchema, msg?: string): CmdResult =>
  ({ type: 'intermediate', schema, msg } as unknown as CmdResult);

// ============================================================================
// 参数验证
// ============================================================================

/** 验证参数不为空 */
export const requireArgs = (args: string[], usage: string): string | null =>
  args.length === 0 ? usage : null;

/** 创建参数验证器 */
export const validate = (args: string[], usage: string) => ({
  /** 验证并执行 */
  exec: <T>(fn: () => T): CmdResult | T => {
    if (args.length === 0) return err(usage);
    return fn();
  },
});
