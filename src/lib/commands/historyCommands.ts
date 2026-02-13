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
      aliases: ['u'],
      category: 'history',
      description: '撤销上一步操作',
      args: [],
      examples: ['undo', 'u'],
    });
  }

  execute(): CmdResult {
    // 实际撤销逻辑由外部处理
    // 这里返回 noop 表示命令已接收，但实际操作由 HistoryManager 执行
    return ok({
      cells: [],
      selectedCells: [],
      highlightedRows: [],
      highlightedCols: [],
      highlightedBoxes: [],
      highlightedDigits: [],
      history: [],
      historyIndex: -1,
    } as any);
  }
}

class RedoCommand extends BaseCommand {
  constructor() {
    super({
      name: 'redo',
      aliases: ['r'],
      category: 'history',
      description: '重做下一步操作',
      args: [],
      examples: ['redo', 'r'],
    });
  }

  execute(): CmdResult {
    // 实际重做逻辑由外部处理
    return ok({
      cells: [],
      selectedCells: [],
      highlightedRows: [],
      highlightedCols: [],
      highlightedBoxes: [],
      highlightedDigits: [],
      history: [],
      historyIndex: -1,
    } as any);
  }
}

// ============================================================================
// 导出
// ============================================================================

const undoCmd = new UndoCommand();
const redoCmd = new RedoCommand();

export {
  undoCmd,
  redoCmd,
  UndoCommand,
  RedoCommand,
};

export const historyCommands = {
  [undoCmd.name]: { meta: undoCmd.getMeta(), handler: undoCmd.handle.bind(undoCmd) },
  [redoCmd.name]: { meta: redoCmd.getMeta(), handler: redoCmd.handle.bind(redoCmd) },
};
