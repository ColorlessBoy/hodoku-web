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

// 加载器导出
export { loadCommands, preloadAllCommands } from './loader';

// 具体命令配置导出（按需使用）
export { basicCommands } from './basicCommands';
export { highlightCommands } from './highlightCommands';
export { colorCommands } from './colorCommands';
export { selectCommands } from './selectCommands';
export { autoCommands } from './autoCommands';
export { historyCommands } from './historyCommands';
