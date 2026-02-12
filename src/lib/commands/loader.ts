/**
 * Command Loader - 命令加载器
 *
 * 支持按需加载命令，优化前端包体积
 */

import type { CommandConfig } from './types';
import { registerCommands } from './registry';

// 导入所有命令配置
import { basicCommands } from './basicCommands';
import { highlightCommands } from './highlightCommands';
import { selectCommands } from './selectCommands';
import { autoCommands } from './autoCommands';
import { historyCommands } from './historyCommands';
import { colorCommands } from "./colorCommands";

// 命令类别映射
const commandModules: Record<string, CommandConfig> = {
  basic: basicCommands,
  highlight: highlightCommands,
  color: colorCommands,
  select: selectCommands,
  auto: autoCommands,
  history: historyCommands,
};

/**
 * 加载指定类别的命令
 * @param categories 命令类别数组或 'all'
 */
export async function loadCommands(
  categories: string[] | 'all'
): Promise<void> {
  const cats = categories === 'all' ? Object.keys(commandModules) : categories;

  for (const cat of cats) {
    const config = commandModules[cat];
    if (config) {
      registerCommands(config);
    }
  }
}

/**
 * 预加载所有命令（用于开发或需要立即使用所有命令的场景）
 */
export function preloadAllCommands(): void {
  for (const config of Object.values(commandModules)) {
    registerCommands(config);
  }
}

// 导出所有命令配置，供需要直接使用的场景
export { basicCommands, highlightCommands, colorCommands, selectCommands, autoCommands, historyCommands };
