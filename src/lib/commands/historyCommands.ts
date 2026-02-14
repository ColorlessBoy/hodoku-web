/**
 * History Commands - 撤销/重做命令
 *
 * 使用类继承方式定义命令
 */

import type { CmdResult } from './types';
import { ok } from './utils';
import { BaseCommand } from './Command';

// 注意：历史记录管理由外部处理，这些命令只是标记
// 实际实现需要与 HistoryManager 集成

// ============================================================================
// 历史记录命令
// ============================================================================

class UndoCommand extends BaseCommand {
  constructor() {
    super({
      name: 'undo',
      aliases: [],
      category: 'history',
      description: '撤销上一步操作',
      args: [],
      examples: ['undo'],
    });
  }

  execute(): CmdResult {
    return this.error('没有实现撤销操作');
  }
}

class RedoCommand extends BaseCommand {
  constructor() {
    super({
      name: 'redo',
      aliases: [],
      category: 'history',
      description: '重做下一步操作',
      args: [],
      examples: ['redo'],
    });
  }

  execute(): CmdResult {
    // 实际重做逻辑由外部处理
    return this.error('没有实现重做操作');
  }
}

// ============================================================================
// 导出
// ============================================================================

const undoCmd = new UndoCommand();
const redoCmd = new RedoCommand();

export { undoCmd, redoCmd, UndoCommand, RedoCommand };

export const historyCommands = {
  [undoCmd.name]: { meta: undoCmd.getMeta(), handler: undoCmd.handle.bind(undoCmd) },
  [redoCmd.name]: { meta: redoCmd.getMeta(), handler: redoCmd.handle.bind(redoCmd) },
};
