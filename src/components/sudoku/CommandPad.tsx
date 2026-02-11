import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SudokuSchema } from '@/types/sudoku';
import { cloneSchema } from '@/lib/schemaAdapter';
import { executeCommands, executeCommand } from '@/lib/CmdEngine';
import { cn } from '@/lib/utils';
import { CommandHelp } from './CommandHelp';

// 导入并注册所有命令
import { preloadAllCommands } from '@/lib/commands';

// 立即注册所有命令
preloadAllCommands();

interface CommandPadProps {
  schema: SudokuSchema;
  replaceSchema: (next: SudokuSchema) => void;
  onIntermediateSchema?: (schema: SudokuSchema | null) => void;
}

const useLocalStore = <T,>(key: string, initial: T) => {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      void 0;
    }
  }, [key, state]);
  return [state, setState] as const;
};

export const CommandPad: React.FC<CommandPadProps> = ({
  schema,
  replaceSchema,
  onIntermediateSchema,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useLocalStore<string[]>('sudoku_cmd_history', []);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [undoStack, setUndoStack] = useLocalStore<SudokuSchema[]>('sudoku_undo_stack', []);
  const [redoStack, setRedoStack] = useLocalStore<SudokuSchema[]>('sudoku_redo_stack', []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // 解析输入并返回中间状态 schema（用于实时预览）
  const parseIntermediateSchema = useCallback((inputValue: string): SudokuSchema | null => {
    const trimmed = inputValue.trim();
    if (!trimmed) return null;

    // 只处理单个命令（不处理分号分隔的多命令）
    if (trimmed.includes(';')) return null;

    // 执行命令但忽略错误
    const result = executeCommand(schema, trimmed);

    if (result.type === 'intermediate') {
      return result.schema;
    }

    return null;
  }, [schema]);

  // 输入变化时实时更新中间状态
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    // 用户开始输入时清除错误消息
    if (errorMsg) setErrorMsg(null);

    // 实时解析中间状态
    const intermediateSchema = parseIntermediateSchema(newValue);
    onIntermediateSchema?.(intermediateSchema);
  };

  useEffect(() => {
    const raw = localStorage.getItem('sudoku_last_schema');
    if (raw) {
      try {
        const snap = JSON.parse(raw) as SudokuSchema;
        replaceSchema(snap);
      } catch {
        void 0;
      }
    }
  }, [replaceSchema]);

  useEffect(() => {
    try {
      localStorage.setItem('sudoku_last_schema', JSON.stringify(schema));
    } catch {
      void 0;
    }
  }, [schema]);

  const pushUndo = useCallback(() => {
    const snap = cloneSchema(schema);
    setUndoStack((prev) => [...prev, snap]);
    setRedoStack([]);
  }, [schema, setUndoStack, setRedoStack]);

  const doUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const nextUndo = [...prev];
      const last = nextUndo.pop()!;
      setRedoStack((rp) => {
        const cur = cloneSchema(schema);
        return [...rp, cur];
      });
      replaceSchema(last);
      return nextUndo;
    });
  }, [schema, replaceSchema, setUndoStack, setRedoStack]);

  const doRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const nextRedo = [...prev];
      const last = nextRedo.pop()!;
      setUndoStack((up) => {
        const cur = cloneSchema(schema);
        return [...up, cur];
      });
      replaceSchema(last);
      return nextRedo;
    });
  }, [schema, replaceSchema, setUndoStack, setRedoStack]);

  const addHistory = useCallback(
    (cmd: string) => {
      setHistory((prev) => {
        const list = [...prev];
        if (list[list.length - 1] !== cmd) list.push(cmd);
        return list.slice(-200);
      });
      setHistoryIdx(-1);
    },
    [setHistory]
  );

  const cleanHistory = useCallback(() => {
    setHistory([]);
    setHistoryIdx(-1);
  }, [setHistory]);

  // 使用 CmdEngine 处理命令
  const handleExec = useCallback(() => {
    if (!input.trim()) return;

    // 检查是否为 undo/redo 命令
    const trimmed = input.trim().toLowerCase();
    if (trimmed === 'u' || trimmed === 'undo') {
      doUndo();
      addHistory(input);
      setInput('');
      return;
    }
    if (trimmed === 'r' || trimmed === 'redo') {
      doRedo();
      addHistory(input);
      setInput('');
      return;
    }

    // 使用 CmdEngine 执行命令
    pushUndo();
    const { result, finalSchema } = executeCommands(schema, input);

    if (result.type === 'error') {
      // 执行失败，撤销 pushUndo
      setUndoStack((prev) => prev.slice(0, -1));
      // 显示错误消息在 GUI 上
      setErrorMsg(result.msg);
      // 清除中间状态
      onIntermediateSchema?.(null);
    } else if (result.type === 'intermediate') {
      // 中间状态 - 不更新主 schema，但显示叠加层
      setUndoStack((prev) => prev.slice(0, -1)); // 撤销 pushUndo，因为命令未完成
      onIntermediateSchema?.(result.schema);
      if (result.msg) {
        console.log('Intermediate:', result.msg);
      }
    } else {
      if (trimmed === 'new') {
        cleanHistory();
      }
      // 执行成功，更新 schema
      replaceSchema(finalSchema);
      // 清除中间状态（命令已完成）
      onIntermediateSchema?.(null);
      // 清除错误消息
      setErrorMsg(null);
    }

    addHistory(input);
    setInput('');
    inputRef.current?.focus();
  }, [input, schema, pushUndo, doUndo, doRedo, addHistory, setUndoStack, replaceSchema, onIntermediateSchema, errorMsg]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleExec();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHistoryIdx((idx) => {
          const next = idx < 0 ? history.length - 1 : Math.max(0, idx - 1);
          const val = history[next] ?? '';
          setInput(val);
          return next;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHistoryIdx((idx) => {
          const next = idx < 0 ? -1 : Math.min(history.length - 1, idx + 1);
          const val = next < 0 ? '' : (history[next] ?? '');
          setInput(val);
          return next;
        });
      }
    },
    [handleExec, history]
  );

  return (
    <div className="bg-card rounded-xl p-4 shadow-lg border border-border flex flex-col h-full overflow-hidden">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex-shrink-0">命令</h3>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          placeholder="示例: s r1c1 5; k r1c1 3"
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          onClick={handleExec}
        >
          执行
        </button>
      </div>
      {/* 错误消息显示 */}
      {errorMsg && (
        <div className="mb-3 px-3 py-2 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm animate-in fade-in slide-in-from-top-1">
          {errorMsg}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
          onClick={doUndo}
        >
          撤销
        </button>
        <button
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
          onClick={doRedo}
        >
          重做
        </button>
      </div>
      {/* 命令历史 - 固定高度 */}
      <div className="mt-3 h-24 flex-shrink-0 overflow-y-auto rounded-md border border-input">
        {history.length === 0 ? (
          <div className="text-xs text-muted-foreground p-2">暂无历史</div>
        ) : (
          <ul className="text-xs">
            {history
              .slice()
              .reverse()
              .map((h, i) => (
                <li key={i} className="px-2 py-1 border-b border-border last:border-b-0">
                  {h}
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* 动态命令帮助面板 - 自动占据剩余空间，超出时内部滚动 */}
      <div className="mt-3 flex-1 min-h-0 overflow-hidden flex flex-col">
        <CommandHelp searchable={false} collapsible={true} />
      </div>
    </div>
  );
};
