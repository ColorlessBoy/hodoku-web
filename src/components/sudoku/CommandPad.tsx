import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SudokuRenderSchema,
  CellPosition,
  Digit,
  CandidateColor,
  CellColor,
  ChainLink,
} from '@/types/sudoku';
import { cn } from '@/lib/utils';

interface CommandPadProps {
  schema: SudokuRenderSchema;
  selectCell: (position: CellPosition | null) => void;
  setCellValue: (position: CellPosition, value: Digit | null) => void;
  toggleCornerCandidate: (position: CellPosition, digit: Digit) => void;
  toggleCenterCandidate: (position: CellPosition, digit: Digit) => void;
  setCellColor: (position: CellPosition, color: CellColor) => void;
  setCandidateColor: (
    position: CellPosition,
    digit: Digit,
    color: CandidateColor,
    isCorner: boolean
  ) => void;
  setHighlightedDigit: (digit: Digit | null) => void;
  addLink: (link: ChainLink) => void;
  clearLinks: () => void;
  clearCell: (position: CellPosition) => void;
  replaceSchema: (next: SudokuRenderSchema) => void;
}

type CmdResult = { ok: boolean; msg?: string };

const clampRC = (n: number) => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number) => clampRC(n) - 1;

function parsePos(token: string): CellPosition | null {
  const t = token.trim().toLowerCase();
  const m1 = t.match(/^r([1-9])c([1-9])$/);
  if (m1) return { row: toZeroIdx(Number(m1[1])), col: toZeroIdx(Number(m1[2])) };
  const m2 = t.match(/^([1-9])\s*,\s*([1-9])$/);
  if (m2) return { row: toZeroIdx(Number(m2[1])), col: toZeroIdx(Number(m2[2])) };
  return null;
}

function parsePosDigit(token: string): { pos: CellPosition; digit: Digit } | null {
  const t = token.trim().toLowerCase();
  const m = t.match(/^r([1-9])c([1-9]):([1-9])$/);
  if (m) {
    return {
      pos: { row: toZeroIdx(Number(m[1])), col: toZeroIdx(Number(m[2])) },
      digit: Number(m[3]) as Digit,
    };
  }
  return null;
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
  selectCell,
  setCellValue,
  toggleCornerCandidate,
  toggleCenterCandidate,
  setCellColor,
  setCandidateColor,
  setHighlightedDigit,
  addLink,
  clearLinks,
  clearCell,
  replaceSchema,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useLocalStore<string[]>('sudoku_cmd_history', []);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [undoStack, setUndoStack] = useLocalStore<SudokuRenderSchema[]>('sudoku_undo_stack', []);
  const [redoStack, setRedoStack] = useLocalStore<SudokuRenderSchema[]>('sudoku_redo_stack', []);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('sudoku_last_schema');
    if (raw) {
      try {
        const snap = JSON.parse(raw) as SudokuRenderSchema;
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
    const snap =
      typeof structuredClone === 'function'
        ? structuredClone(schema)
        : JSON.parse(JSON.stringify(schema));
    setUndoStack((prev) => [...prev, snap]);
    setRedoStack([]);
  }, [schema, setUndoStack, setRedoStack]);

  const doUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const nextUndo = [...prev];
      const last = nextUndo.pop()!;
      setRedoStack((rp) => {
        const cur =
          typeof structuredClone === 'function'
            ? structuredClone(schema)
            : JSON.parse(JSON.stringify(schema));
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
        const cur =
          typeof structuredClone === 'function'
            ? structuredClone(schema)
            : JSON.parse(JSON.stringify(schema));
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

  const execSingle = useCallback(
    (raw: string): CmdResult => {
      const s = raw.trim();
      if (!s) return { ok: false, msg: '空命令' };
      const parts = s.split(/\s+/);
      const cmd = parts[0].toLowerCase();

      if (cmd === 'undo') {
        doUndo();
        return { ok: true };
      }
      if (cmd === 'redo') {
        doRedo();
        return { ok: true };
      }

      pushUndo();

      if (cmd === 'set') {
        const rest = parts.slice(1);
        for (let i = 0; i + 1 < rest.length; i += 2) {
          const pos = parsePos(rest[i]);
          const d = Number(rest[i + 1]);
          if (!pos || !(d >= 1 && d <= 9)) continue;
          setCellValue(pos, d as Digit);
        }
        return { ok: true };
      }

      if (cmd === 'clear') {
        const rest = parts.slice(1);
        for (let i = 0; i < rest.length; i++) {
          const pos = parsePos(rest[i]);
          if (!pos) continue;
          clearCell(pos);
        }
        return { ok: true };
      }

      if (cmd === 'corner') {
        const rest = parts.slice(1);
        for (let i = 0; i + 1 < rest.length; i += 2) {
          const pos = parsePos(rest[i]);
          const d = Number(rest[i + 1]);
          if (!pos || !(d >= 1 && d <= 9)) continue;
          toggleCornerCandidate(pos, d as Digit);
        }
        return { ok: true };
      }

      if (cmd === 'center') {
        const rest = parts.slice(1);
        for (let i = 0; i + 1 < rest.length; i += 2) {
          const pos = parsePos(rest[i]);
          const d = Number(rest[i + 1]);
          if (!pos || !(d >= 1 && d <= 9)) continue;
          toggleCenterCandidate(pos, d as Digit);
        }
        return { ok: true };
      }

      if (cmd === 'cellcolor') {
        const rest = parts.slice(1);
        for (let i = 0; i + 1 < rest.length; i += 2) {
          const pos = parsePos(rest[i]);
          const k = Number(rest[i + 1]);
          if (!pos) continue;
          const color = k >= 1 && k <= 8 ? (k as CellColor) : null;
          setCellColor(pos, color as CellColor);
        }
        return { ok: true };
      }

      if (cmd === 'candcolor') {
        const rest = parts.slice(1);
        for (let i = 0; i + 3 < rest.length; i += 4) {
          const pos = parsePos(rest[i]);
          const d = Number(rest[i + 1]);
          const k = Number(rest[i + 2]);
          const t = rest[i + 3].toLowerCase();
          if (!pos || !(d >= 1 && d <= 9)) continue;
          const color = k >= 1 && k <= 6 ? (k as CandidateColor) : null;
          const isCorner = t === 'corner';
          const isCenter = t === 'center';
          if (!isCorner && !isCenter) continue;
          setCandidateColor(pos, d as Digit, color as CandidateColor, isCorner);
        }
        return { ok: true };
      }

      if (cmd === 'highlight') {
        const v = parts[1]?.toLowerCase();
        if (!v || v === 'off') {
          setHighlightedDigit(null);
        } else {
          const d = Number(v);
          if (d >= 1 && d <= 9) setHighlightedDigit(d as Digit);
        }
        return { ok: true };
      }

      if (cmd === 'select') {
        const pos = parsePos(parts[1] || '');
        if (pos) selectCell(pos);
        return { ok: true };
      }

      if (cmd === 'link') {
        const a = parsePosDigit(parts[1] || '');
        const b = parsePosDigit(parts[2] || '');
        const t = (parts[3] || '').toLowerCase();
        if (a && b) {
          addLink({
            from: { position: a.pos, candidate: a.digit },
            to: { position: b.pos, candidate: b.digit },
            isStrong: t === 'strong',
          });
        }
        return { ok: true };
      }

      if (cmd === 'linkclear') {
        clearLinks();
        return { ok: true };
      }

      return { ok: false, msg: '未知命令' };
    },
    [
      addLink,
      clearCell,
      clearLinks,
      doRedo,
      doUndo,
      pushUndo,
      selectCell,
      setCellColor,
      setCellValue,
      setCandidateColor,
      setHighlightedDigit,
      toggleCenterCandidate,
      toggleCornerCandidate,
    ]
  );

  const exec = useCallback(() => {
    const cmds = input
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    let lastRes: CmdResult = { ok: true };
    for (const c of cmds) {
      lastRes = execSingle(c);
      if (!lastRes.ok) break;
    }
    addHistory(input);
    setInput('');
    inputRef.current?.focus();
    return lastRes;
  }, [addHistory, execSingle, input]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        exec();
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
    [exec, history]
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
          placeholder="示例: set r1c1 5; corner r1c1 3"
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          onClick={exec}
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
        <div>set r1c1 5 [r1c2 6 ...]</div>
        <div>clear r1c1 [r2c2 ...]</div>
        <div>corner r1c1 3 [r1c2 4 ...]</div>
        <div>center r1c1 3 [r1c2 4 ...]</div>
        <div>cellcolor r1c1 3 | cellcolor r1c1 0</div>
        <div>candcolor r1c1 5 2 corner|center</div>
        <div>highlight 5 | highlight off</div>
        <div>select r1c1</div>
        <div>link r1c1:4 r2c5:4 strong|weak | linkclear</div>
        <div>支持多个命令用 ; 分隔</div>
        <div>支持上下键浏览历史，撤销/重做</div>
      </div>
    </div>
  );
};
