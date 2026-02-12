/**
 * Command Registry - 命令注册中心
 *
 * 集中管理所有命令的注册、查找和获取
 */

import type { CommandMeta, CommandCategory, CmdHandler, CommandConfig } from './types';

// ============================================================================
// 存储
// ============================================================================

/** 命令处理器存储 */
const handlers = new Map<string, CmdHandler>();

/** 命令元数据存储 */
const metas = new Map<string, CommandMeta>();

/** 主名称到别名集合的映射 */
const aliases = new Map<string, Set<string>>();

// ============================================================================
// 注册
// ============================================================================

export function getCommandHandler(name: string): CmdHandler | undefined {
  return handlers.get(name.toLowerCase());
}

export function getCommandMeta(name: string): CommandMeta | undefined {
  return metas.get(name.toLowerCase());
}


/**
 * 注册单个命令
 * @param meta 命令元数据
 * @param handler 命令处理器
 */
export function register(meta: CommandMeta, handler: CmdHandler): void {
  const name = meta.name.toLowerCase();

  // 存储元数据
  metas.set(name, meta);

  // 存储处理器
  handlers.set(name, handler);

  // 存储别名映射
  const aliasSet = new Set(meta.aliases.map((a) => a.toLowerCase()));
  aliases.set(name, aliasSet);

  // 为别名也注册处理器映射
  for (const alias of aliasSet) {
    handlers.set(alias, handler);
  }
}

/**
 * 批量注册命令
 * @param config 命令配置对象
 */
export function registerCommands(config: CommandConfig): void {
  for (const [name, def] of Object.entries(config)) {
    register(def.meta, def.handler);
  }
}

// ============================================================================
// 查询
// ============================================================================

/**
 * 获取命令处理器
 * @param name 命令名称或别名
 * @returns 处理器或 undefined
 */
export function getHandler(name: string): CmdHandler | undefined {
  return handlers.get(name.toLowerCase());
}

/**
 * 获取命令元数据
 * @param name 命令名称（主名称）
 * @returns 元数据或 undefined
 */
export function getMeta(name: string): CommandMeta | undefined {
  return metas.get(name.toLowerCase());
}

/**
 * 检查命令是否存在
 * @param name 命令名称或别名
 */
export function hasCommand(name: string): boolean {
  return handlers.has(name.toLowerCase());
}

/**
 * 获取所有命令的主名称列表
 */
export function getAllCommandNames(): string[] {
  return Array.from(metas.keys()).sort();
}

/**
 * 获取所有命令元数据
 */
export function getAllCommands(): CommandMeta[] {
  return Array.from(metas.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * 按类别获取命令
 * @param category 命令类别
 */
export function getCommandsByCategory(category: CommandCategory): CommandMeta[] {
  return getAllCommands().filter((cmd) => cmd.category === category);
}

/**
 * 获取所有类别
 */
export function getCategories(): { id: CommandCategory; name: string }[] {
  return [
    { id: 'basic', name: '基础操作' },
    { id: 'highlight', name: '高亮' },
    { id: 'select', name: '选择' },
    { id: 'color', name: '染色' },
    { id: 'solve', name: '解题技巧' },
    { id: 'auto', name: '自动填充' },
    { id: 'new', name: '新题目' },
    { id: 'history', name: '撤销/重做' },
  ];
}

// ============================================================================
// 帮助文本生成
// ============================================================================

/**
 * 生成单个命令的帮助文本
 * @param meta 命令元数据
 */
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

/**
 * 生成所有命令的帮助文本
 */
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