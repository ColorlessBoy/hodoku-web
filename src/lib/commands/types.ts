/**
 * Command Types - 命令类型定义
 *
 * 提供统一的命令类型接口，支持配置化注册
 */

import type { SudokuSchema, Digit } from '@/types/sudoku';

/** 命令执行结果 */
export type CmdResult =
  | { type: 'ok'; schema: SudokuSchema }
  | { type: 'error'; msg: string }
  | { type: 'noop' };

/** 命令处理器 */
export type CmdHandler = (schema: SudokuSchema, args: string[]) => CmdResult;

/** 参数类型 */
export type ArgType = 'pos' | 'digit' | 'row' | 'col' | 'box' | 'cells' | 'rows' | 'cols' | 'boxes' | 'string';

/** 参数定义 */
export interface ArgDef {
  type: ArgType;
  name: string;
  description: string;
  optional?: boolean;
  repeatable?: boolean;
}

/** 命令分类 */
export type CommandCategory =
  | 'basic'
  | 'highlight'
  | 'select'
  | 'color'
  | 'solve'
  | 'auto'
  | 'new'
  | 'history';

/** 命令元数据 */
export interface CommandMeta {
  name: string;
  aliases: string[];
  description: string;
  category: CommandCategory;
  args: ArgDef[];
  examples: string[];
}

/** 完整命令定义（配置化） */
export interface CommandDefinition {
  meta: CommandMeta;
  handler: CmdHandler;
}

/** 命令配置对象（用于批量注册） */
export type CommandConfig = Record<string, CommandDefinition>;
