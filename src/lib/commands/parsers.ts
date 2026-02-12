/**
 * Command Parsers - 命令参数解析器
 *
 * 提供统一的参数解析函数
 */

import type { Digit } from '@/types/sudoku';
import { clampRC, toZeroIdx } from './utils';

// ============================================================================
// 位置解析
// ============================================================================

/** 解析 115 格式的位置+数字 */
export function parsePosDigit(token: string): { row: number; col: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length >= 2) {
    const row = toZeroIdx(Number(t[0]));
    const col = toZeroIdx(Number(t[1]));
    const digit = t.length > 2 ? (clampRC(Number(t[2])) as Digit) : undefined;
    return { row, col, digit };
  }
  return null;
}

/** 解析 11 格式的位置（行+列） */
export function parsePos(token: string): { row: number; col: number } | null {
  const t = token.trim().toLowerCase();
  if (t.length >= 2) {
    const row = toZeroIdx(Number(t[0]));
    const col = toZeroIdx(Number(t[1]));
    return { row, col };
  }
  return null;
}

/** 解析行+数字格式 */
export function parseRowDigit(token: string): { row: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length >= 1) {
    const row = toZeroIdx(Number(t[0]));
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { row, digit };
  }
  return null;
}

/** 解析列+数字格式 */
export function parseColDigit(token: string): { col: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length >= 1) {
    const col = toZeroIdx(Number(t[0]));
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { col, digit };
  }
  return null;
}

/** 解析宫+数字格式 */
export function parseBoxDigit(token: string): { box: number; digit?: Digit } | null {
  const t = token.trim().toLowerCase();
  if (t.length >= 1) {
    const box = toZeroIdx(Number(t[0]));
    const digit = t.length > 1 ? (clampRC(Number(t[1])) as Digit) : undefined;
    return { box, digit };
  }
  return null;
}

// ============================================================================
// 批量解析
// ============================================================================

/** 将参数解析为数字数组 */
export function parseNumbers(args: string[]): number[] {
  return args.map((arg) => Number(arg));
}

/** 将参数解析为零基索引数组 */
export function parseZeroIndices(args: string[]): number[] {
  return args.map((arg) => toZeroIdx(Number(arg)));
}

/** 将参数解析为数字数组（Digit） */
export function parseDigits(args: string[]): Digit[] {
  return args.map((arg) => clampRC(Number(arg)) as Digit);
}
