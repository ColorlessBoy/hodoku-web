/**
 * 数独命令的“定理式”校验：只有合法的操作才允许执行。
 * 例如添加强/弱链时必须通过 checkWeakLink / checkStrongLink，否则拒绝并返回错误信息。
 */
import { checkWeakLink, checkStrongLink } from '@/lib/SudokuEngine';
import {
  renderSchemaToEngineSchema,
  chainLinkToEngineLink,
} from '@/lib/schemaAdapter';
import type { SudokuRenderSchema, ChainLink } from '@/types/sudoku';
import type { CellPosition, Digit } from '@/types/sudoku';
import { getBoxIndex } from '@/types/sudoku';

export type OperatorResult = { ok: true } | { ok: false; msg: string };

/**
 * 校验添加一条链是否合法。
 * 弱链：两端点均为有效候选，且满足弱链条件（同数同单元或异数同格）；
 * 强链：在弱链基础上再满足强链条件（同数仅两格或异数双值格）。
 */
export function validateLink(
  renderSchema: SudokuRenderSchema,
  link: ChainLink
): OperatorResult {
  const fromDigit = link.from.candidate;
  const toDigit = link.to.candidate;
  if (fromDigit == null || toDigit == null) {
    return { ok: false, msg: '链的两端必须指定候选数，例如 r1c1:5 r2c2:5 strong' };
  }

  const engineSchema = renderSchemaToEngineSchema(renderSchema);
  const engineLink = chainLinkToEngineLink(link);

  if (!checkWeakLink(engineSchema, engineLink)) {
    return {
      ok: false,
      msg: '弱链不合法：两端点须为有效候选，且同数在同一单元或异数在同一格',
    };
  }
  if (link.isStrong && !checkStrongLink(engineSchema, engineLink)) {
    return {
      ok: false,
      msg: '强链不合法：同数时该单元内须恰好 2 个该候选，异数时起点须为双值格',
    };
  }
  return { ok: true };
}

/**
 * 校验 set 命令：不能改给定格，且填入后不能与同单元重复。
 */
export function validateSet(
  renderSchema: SudokuRenderSchema,
  position: CellPosition,
  digit: Digit
): OperatorResult {
  const cell = renderSchema.cells[position.row][position.col];
  if (cell.isGiven) {
    return { ok: false, msg: '不能修改题目给定的格子' };
  }
  const box = getBoxIndex(position.row, position.col);
  for (let c = 0; c < 9; c++) {
    if (c !== position.col && renderSchema.cells[position.row][c].value === digit) {
      return { ok: false, msg: `同行已有 ${digit}` };
    }
  }
  for (let r = 0; r < 9; r++) {
    if (r !== position.row && renderSchema.cells[r][position.col].value === digit) {
      return { ok: false, msg: `同列已有 ${digit}` };
    }
  }
  const br = Math.floor(box / 3) * 3;
  const bc = (box % 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== position.row || c !== position.col) && renderSchema.cells[r][c].value === digit) {
        return { ok: false, msg: `同宫已有 ${digit}` };
      }
    }
  }
  return { ok: true };
}

/**
 * 校验 clear 命令：不能清除给定格。
 */
export function validateClear(
  renderSchema: SudokuRenderSchema,
  position: CellPosition
): OperatorResult {
  const cell = renderSchema.cells[position.row][position.col];
  if (cell.isGiven) {
    return { ok: false, msg: '不能清除题目给定的格子' };
  }
  return { ok: true };
}
