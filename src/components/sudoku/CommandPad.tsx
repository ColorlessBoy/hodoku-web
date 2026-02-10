import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SudokuSchema } from '@/types/sudoku';
import { cloneSchema } from '@/lib/schemaAdapter';
import { executeCommands } from '@/lib/CmdEngine';
import { cn } from '@/lib/utils';

interface CommandPadProps {
  schema: SudokuSchema;
  replaceSchema: (next: SudokuSchema) => void;
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
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useLocalStore<string[]>('sudoku_cmd_history', []);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [undoStack, setUndoStack] = useLocalStore<SudokuSchema[]>('sudoku_undo_stack', []);
  const [redoStack, setRedoStack] = useLocalStore<SudokuSchema[]>('sudoku_redo_stack', []);

  const inputRef = useRef<HTMLInputElement>(null);

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
      // 可以在这里显示错误消息
      console.error('Command failed:', result.msg);
    } else {
      // 执行成功，更新 schema
      replaceSchema(finalSchema);
    }

    addHistory(input);
    setInput('');
    inputRef.current?.focus();
  }, [input, schema, pushUndo, doUndo, doRedo, addHistory, setUndoStack, replaceSchema]);

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
    <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">命令</h3>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
      <div className="mt-3 max-h-40 overflow-y-auto rounded-md border border-input">
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
      <div className="mt-3 text-[11px] text-muted-foreground space-y-1">
        <div>new xxx - 导入新题目</div>
        <div>set 11 5 - 设置格子值</div>
        <div>unset 11 - 取消设置格子值</div>
        <div>hra 1 2 3 - 添加高亮行</div>
        <div>hrs 1 2 3 - 高亮行</div>
        <div>hrj 1 2 3 - 高亮行(交集)</div>
        <div>hca 1 2 3 - 添加高亮列</div>
        <div>hcs 1 2 3 - 高亮列</div>
        <div>hcj 1 2 3 - 高亮列(交集)</div>
        <div>hba 1 2 3 - 添加高亮区</div>
        <div>hbs 1 2 3 - 高亮区</div>
        <div>hbj 1 2 3 - 高亮区(交集)</div>
        <div>hda 1 2 3 - 添加高亮数字</div>
        <div>hds 1 2 3 - 高亮数字</div>
        <div>hdj 1 2 3 - 高亮数字(交集)</div>
        <div>ha 12 23 34 - 添加高亮格子</div>
        <div>hs 12 23 34 - 高亮格子</div>
        <div>hxys - 高亮2个后续数的格子</div>
        <div>hxya - 添加高亮2个后续数的格子</div>
        <div>hxyj - 高亮2个后续数的格子(交集)</div>
        <div>uh - 取消高亮</div>
        <div>ss 12 34 42 - 选择格子</div>
        <div>sa 12 34 42 - 添加选择格子</div>
        <div>fuc 12 - 填充唯一后续数格子</div>
        <div>fur 23 - 行内唯一数</div>
        <div>fuc 23 - 列内唯一数</div>
        <div>fub 23 - 区内唯一数</div>
      </div>
    </div>
  );
};
