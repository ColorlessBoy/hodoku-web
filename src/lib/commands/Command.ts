/**
 * Command - 命令基类
 *
 * 提供类继承化的命令定义方式，自动处理：
 * - 参数验证和错误提示
 * - 用法字符串生成
 * - 元数据生成
 * - 命令注册
 */

import type { SudokuSchema } from '@/lib/sudoku/types';
import type { CmdResult, CommandMeta, CommandCategory, ArgDef, CmdHandler } from './types';
import { err } from './utils';
import { register } from './registry';

/**
 * 命令配置选项
 */
export interface CommandOptions {
  /** 命令名称 */
  name: string;
  /** 命令描述 */
  description: string;
  /** 命令类别 */
  category: CommandCategory;
  /** 别名列表 */
  aliases?: string[];
  /** 参数定义 */
  args?: ArgDef[];
  /** 使用示例 */
  examples?: string[];
}

/**
 * 命令基类
 * 所有命令都应继承此类
 */
export abstract class BaseCommand {
  /** 命令名称 */
  readonly name: string;

  /** 命令描述 */
  readonly description: string;

  /** 命令类别 */
  readonly category: CommandCategory;

  /** 别名列表 */
  readonly aliases: string[];

  /** 参数定义 */
  readonly args: ArgDef[];

  /** 使用示例 */
  readonly examples: string[];

  constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.category = options.category;
    this.aliases = options.aliases ?? [];
    this.args = options.args ?? [];
    this.examples = options.examples ?? [];
  }

  /**
   * 执行命令的核心逻辑（子类必须实现）
   * @param schema 当前数独状态
   * @param args 参数列表
   */
  abstract execute(schema: SudokuSchema, args: string[]): CmdResult;

  /**
   * 模板方法 - 处理命令
   * 统一处理参数验证和错误提示
   */
  handle(schema: SudokuSchema, args: string[]): CmdResult {
    // 验证必填参数
    if (args.length === 0 && this.args.length > 0 && !this.args[0].optional) {
      return err(`用法: ${this.getUsage()}`);
    }

    // 执行实际逻辑
    return this.execute(schema, args);
  }

  error(msg?: string): CmdResult {
    return err(msg ?? `用法: ${this.getUsage()}`);
  }

  /**
   * 生成用法字符串
   */
  getUsage(): string {
    const argsStr = this.args
      .map((arg) => {
        const optional = arg.optional ? '?' : '';
        const repeatable = arg.repeatable ? '...' : '';
        return `<${arg.name}${optional}${repeatable}>`;
      })
      .join(' ');

    return `${this.name}${argsStr ? ' ' + argsStr : ''}`;
  }

  /**
   * 生成元数据
   */
  getMeta(): CommandMeta {
    return {
      name: this.name,
      aliases: this.aliases,
      description: this.description,
      category: this.category,
      args: this.args,
      examples: this.examples.length > 0 ? this.examples : [this.getUsage()],
    };
  }

  /**
   * 注册命令到注册表
   */
  register(): void {
    register(this.getMeta(), this.handle.bind(this));
  }
}

/**
 * 命令注册表 - 自动收集和管理命令
 */
export class CommandRegistry {
  private static commands = new Map<string, BaseCommand>();

  /**
   * 注册单个命令
   */
  static register(cmd: BaseCommand): void {
    // 存储命令实例
    this.commands.set(cmd.name, cmd);
    for (const alias of cmd.aliases) {
      this.commands.set(alias, cmd);
    }

    // 同时注册到旧的 registry 以保持兼容性
    register(cmd.getMeta(), cmd.handle.bind(cmd));
  }

  /**
   * 批量注册命令
   */
  static registerAll(commands: BaseCommand[]): void {
    for (const cmd of commands) {
      this.register(cmd);
    }
  }

  /**
   * 获取命令配置
   */
  static getConfig(): Record<string, { meta: CommandMeta; handler: CmdHandler }> {
    const config: Record<string, { meta: CommandMeta; handler: CmdHandler }> = {};
    const seen = new Set<string>();

    for (const [name, cmd] of this.commands) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);

      config[cmd.name] = {
        meta: cmd.getMeta(),
        handler: cmd.handle.bind(cmd),
      };
    }

    return config;
  }

  /**
   * 清除所有命令
   */
  static clear(): void {
    this.commands.clear();
  }
}

/**
 * 便捷的注册函数
 */
export function registerCommand(cmd: BaseCommand): void {
  CommandRegistry.register(cmd);
}
