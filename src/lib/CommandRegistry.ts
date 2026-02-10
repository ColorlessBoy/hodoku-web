/**
 * CommandRegistry - 统一命令注册和管理系统
 *
 * 解决命令和帮助信息分散在多个文件的问题
 */

import type { SudokuSchema, Digit } from '@/types/sudoku';
import type { CmdResult, CmdHandler } from './CmdEngine';

// ============================================================================
// 命令元数据类型
// ============================================================================

/** 命令参数类型 */
export type ArgType = 'pos' | 'digit' | 'row' | 'col' | 'box' | 'cells' | 'rows' | 'cols' | 'boxes' | 'string';

/** 单个命令参数定义 */
export interface ArgDef {
  type: ArgType;
  name: string;
  description: string;
  optional?: boolean;
  repeatable?: boolean; // 是否可重复（如 1 2 3）
}

/** 命令元数据 */
export interface CommandMeta {
  name: string;           // 主命令名
  aliases: string[];      // 别名
  description: string;    // 描述
  args: ArgDef[];         // 参数定义
  examples: string[];     // 示例
  category: CommandCategory;
}

/** 命令分类 */
export type CommandCategory =
  | 'basic'      // 基础操作
  | 'highlight'  // 高亮
  | 'select'     // 选择
  | 'solve'      // 解题技巧
  | 'auto'       // 自动填充
  | 'new'        // 新题目
  | 'history';   // 撤销/重做

// ============================================================================
// 命令注册表
// ============================================================================

interface CommandEntry {
  meta: CommandMeta;
  handler: CmdHandler;
}

const commandRegistry = new Map<string, CommandEntry>();
const metaRegistry = new Map<string, CommandMeta>();

/** 注册命令 */
export function registerCommand(meta: CommandMeta, handler: CmdHandler): void {
  const entry: CommandEntry = { meta, handler };

  // 注册主命令名
  commandRegistry.set(meta.name.toLowerCase(), entry);
  metaRegistry.set(meta.name.toLowerCase(), meta);

  // 注册所有别名
  for (const alias of meta.aliases) {
    commandRegistry.set(alias.toLowerCase(), entry);
    metaRegistry.set(alias.toLowerCase(), meta);
  }
}

/** 获取命令处理器 */
export function getCommandHandler(name: string): CmdHandler | undefined {
  return commandRegistry.get(name.toLowerCase())?.handler;
}

/** 获取命令元数据 */
export function getCommandMeta(name: string): CommandMeta | undefined {
  return metaRegistry.get(name.toLowerCase());
}

/** 检查命令是否存在 */
export function hasCommand(name: string): boolean {
  return commandRegistry.has(name.toLowerCase());
}

/** 获取所有命令列表 */
export function getAllCommands(): CommandMeta[] {
  const seen = new Set<string>();
  const result: CommandMeta[] = [];

  for (const meta of metaRegistry.values()) {
    if (!seen.has(meta.name)) {
      seen.add(meta.name);
      result.push(meta);
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/** 按分类获取命令 */
export function getCommandsByCategory(category: CommandCategory): CommandMeta[] {
  return getAllCommands().filter((cmd) => cmd.category === category);
}

/** 获取所有分类 */
export function getCategories(): { id: CommandCategory; name: string }[] {
  return [
    { id: 'basic', name: '基础操作' },
    { id: 'highlight', name: '高亮' },
    { id: 'select', name: '选择' },
    { id: 'solve', name: '解题技巧' },
    { id: 'auto', name: '自动填充' },
    { id: 'new', name: '新题目' },
    { id: 'history', name: '撤销/重做' },
  ];
}

/** 生成命令帮助文本 */
export function generateHelpText(meta: CommandMeta): string {
  const lines: string[] = [];

  // 命令名和别名
  const allNames = [meta.name, ...meta.aliases].join(', ');
  lines.push(`${allNames}`);
  lines.push(`  ${meta.description}`);

  // 参数
  if (meta.args.length > 0) {
    lines.push('  参数:');
    for (const arg of meta.args) {
      const optional = arg.optional ? '?' : '';
      const repeatable = arg.repeatable ? '...' : '';
      lines.push(`    ${arg.name}${optional}${repeatable}: ${arg.description}`);
    }
  }

  // 示例
  if (meta.examples.length > 0) {
    lines.push('  示例:');
    for (const ex of meta.examples) {
      lines.push(`    ${ex}`);
    }
  }

  return lines.join('\n');
}

/** 获取所有命令的帮助文本 */
export function getAllHelpText(): string {
  const commands = getAllCommands();
  const byCategory = new Map<CommandCategory, CommandMeta[]>();

  for (const cmd of commands) {
    const list = byCategory.get(cmd.category) ?? [];
    list.push(cmd);
    byCategory.set(cmd.category, list);
  }

  const lines: string[] = [];
  lines.push('=== 数独命令帮助 ===\n');

  const categories = getCategories();
  for (const cat of categories) {
    const cmds = byCategory.get(cat.id);
    if (!cmds || cmds.length === 0) continue;

    lines.push(`\n[${cat.name}]`);
    for (const cmd of cmds) {
      const aliasStr = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
      lines.push(`  ${cmd.name}${aliasStr}: ${cmd.description}`);
    }
  }

  lines.push('\n使用 "help <命令名>" 查看详细帮助');

  return lines.join('\n');
}

// ============================================================================
// 辅助函数：安全地执行命令
// ============================================================================

/** 安全地获取数组元素，越界返回 undefined */
export function safeGet<T>(arr: T[], index: number): T | undefined {
  if (index < 0 || index >= arr.length) return undefined;
  return arr[index];
}

/** 安全地解析数字，失败返回 NaN */
export function safeParseInt(str: string): number {
  const num = parseInt(str, 10);
  if (isNaN(num)) return NaN;
  return num;
}

/** 安全地获取对象的属性，不存在返回 undefined */
export function safeProp<T, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  if (obj == null) return undefined;
  return obj[key];
}

/** 检查值是否为 null 或 undefined */
export function isNil<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

/** 检查值是否不为 null 和 undefined */
export function isNotNil<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/** 安全地访问嵌套属性 */
export function safePath<T>(obj: Record<string, unknown>, ...path: string[]): T | undefined {
  let current: unknown = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current as T | undefined;
}

/** 带默认值的获取 */
export function getOr<T>(value: T | null | undefined, defaultValue: T): T {
  return isNil(value) ? defaultValue : value;
}
