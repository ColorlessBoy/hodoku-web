/**
 * Commands Index - 命令模块统一导出
 *
 * 集中导出所有命令相关的类型和功能
 */

// 类型导出
export type {
  CmdResult,
  CmdHandler,
  ArgType,
  ArgDef,
  CommandCategory,
  CommandMeta,
  CommandDefinition,
  CommandConfig,
} from './types';

// 工具函数导出
export {
  clampRC,
  toZeroIdx,
  toNumbers,
  toZeroIndices,
  ok,
  err,
  noop,
  intermediate,
} from './utils';

// 解析器导出
export {
  parsePosDigit,
  parsePos,
  parseRowDigit,
  parseColDigit,
  parseBoxDigit,
  parseNumbers,
  parseZeroIndices,
  parseDigits,
} from './parsers';

// 构建器导出
export {
  simpleHandler,
  createBatchCommands,
  createDigitCommands,
} from './builders';

// 注册中心导出
export {
  register,
  registerCommands,
  getHandler,
  getMeta,
  hasCommand,
  getAllCommandNames,
  getAllCommands,
  getCommandsByCategory,
  getCategories,
  generateHelpText,
  getAllHelpText,
  getCommandHandler,
  getCommandMeta,
} from './registry';

// 基类导出
export {
  BaseCommand,
  CommandRegistry,
  registerCommand,
} from './Command';
export type { CommandOptions } from './Command';

// 加载器导出
export { loadCommands, preloadAllCommands } from './loader';

// 具体命令配置导出（按需使用）
export { basicCommands } from './basicCommands';
export { highlightCommands } from './highlightCommands';
export { colorCommands } from './colorCommands';
export { selectCommands } from './selectCommands';
export { fillCommands } from './fillCommands';
export { historyCommands } from './historyCommands';
