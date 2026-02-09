import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SudokuSchema,
  CellPosition,
  Digit,
  CellColor,
  CandidateColor,
  Link,
  setDigit,
  addCandidate,
  subCandidate,
  addCandidates,
  subCandidates,
  createLink,
  addCellColor,
  addCandidateColor,
  setHighlightedDigit,
  setHighlightedRow,
  setHighlightedCol,
  setHighlightedBox,
  clearAllHighlighted,
  setSelectedCell,
  setSelectedRow,
  setSelectedCol,
  setSelectedBox,
  getBoxRange,
  autofillUniqueCandidates,
  lastDigitRow,
  lastDigitCol,
  lastDigitBox,
  nakedPair,
  nakedPairsRow,
  hiddenPairsRow,
  nakedPairsCol,
  hiddenPairsCol,
  nakedPairsBox,
  hiddenPairsBox,
  setGroupCandidatesRow,
  setGroupCandidatesCol,
  setGroupCandidatesBox,
  getBoxIndex,
} from '@/types/sudoku';
import { validateLink, validateSet, validateClear } from '@/lib/sudokuOperator';
import { solve, applySolutionToSchema } from '@/lib/sudokuSolver';
import { generatePuzzle, gridToSchema } from '@/lib/sudokuGenerator';
import { cloneSchema } from '@/lib/schemaAdapter';
import { cn } from '@/lib/utils';

interface CommandPadProps {
  schema: SudokuSchema;
  selectCell: (position: CellPosition | null) => void;
  setCellValue: (position: CellPosition, value: Digit | null) => void;
  toggleCornerCandidate: (position: CellPosition, digit: Digit) => void;
  setCellColor: (position: CellPosition, color: CellColor) => void;
  setCandidateColor: (position: CellPosition, digit: Digit, color: CandidateColor) => void;
  addLink: (link: Link) => void;
  clearLinks: () => void;
  clearCell: (position: CellPosition) => void;
  replaceSchema: (next: SudokuSchema) => void;
}

type CmdResult = { ok: boolean; msg?: string };

const clampRC = (n: number) => Math.max(1, Math.min(9, n));
const toZeroIdx = (n: number) => clampRC(n) - 1;

function parsePos(token: string): CellPosition | null {
  const t = token.trim().toLowerCase();
  const m1 = t.match(/^([1-9])([1-9])$/);
  if (m1) {
    const row = toZeroIdx(Number(m1[1]));
    const col = toZeroIdx(Number(m1[2]));
    const box = getBoxIndex(row, col);
    return { row, col, box };
  }
  return null;
}

function parsePosDigit(token: string): { pos: CellPosition; digit: Digit } | null {
  const t = token.trim().toLowerCase();
  const m = t.match(/^([1-9])([1-9])([1-9])$/);
  if (m) {
    const row = toZeroIdx(Number(m[1]));
    const col = toZeroIdx(Number(m[2]));
    const box = getBoxIndex(row, col);
    const digit = Number(m[3]) as Digit;
    return {
      pos: { row, col, box },
      digit,
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
  setCellColor,
  setCandidateColor,
  addLink,
  clearLinks,
  clearCell,
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

  const execSingle = useCallback(
    (raw: string): CmdResult => {
      const s = raw.trim();
      if (!s) return { ok: false, msg: '空命令' };
      const parts = s.split(/\s+/);
      const cmd = parts[0].toLowerCase();

      if (cmd === 'u' || cmd === 'undo') {
        doUndo();
        return { ok: true };
      }
      if (cmd === 'r' || cmd === 'redo') {
        doRedo();
        return { ok: true };
      }

      // s r1c1 5 - 设置格子的值
      if (cmd === 's') {
        const pos = parsePos(parts[1]);
        const d = Number(parts[2]);
        if (!pos || !(d >= 1 && d <= 9)) {
          return { ok: false, msg: '用法: s r1c1 5' };
        }
        const res = validateSet(schema, pos, d as Digit);
        if (!res.ok) return res;
        pushUndo();
        setCellValue(pos, d as Digit);
        return { ok: true };
      }

      // c r1c1 - 清除格子
      if (cmd === 'c' || cmd === 'clear') {
        const pos = parsePos(parts[1]);
        if (!pos) {
          return { ok: false, msg: '用法: c r1c1' };
        }
        const res = validateClear(schema, pos);
        if (!res.ok) return res;
        pushUndo();
        clearCell(pos);
        return { ok: true };
      }

      // k r1c1 3 或 k r1c1 - 切换候选数（有数字则切换，无则点击格子）
      if (cmd === 'k') {
        const pos = parsePos(parts[1]);
        if (!pos) {
          return { ok: false, msg: '用法: k r1c1 [数字]' };
        }
        pushUndo();
        if (parts[2]) {
          const d = Number(parts[2]);
          if (d >= 1 && d <= 9) {
            toggleCornerCandidate(pos, d as Digit);
          }
        } else {
          selectCell(pos);
        }
        return { ok: true };
      }

      // h 1-9 或 h off - 高亮数字
      if (cmd === 'h') {
        const v = parts[1]?.toLowerCase();
        if (!v || v === 'off') {
          replaceSchema(clearAllHighlighted(schema));
        } else {
          const d = Number(v);
          if (d >= 1 && d <= 9) {
            replaceSchema(setHighlightedDigit(schema, d as Digit));
          }
        }
        return { ok: true };
      }

      // H 1-9 - 高亮行
      if (cmd === 'H' && parts[1]) {
        const r = Number(parts[1]);
        if (r >= 1 && r <= 9) {
          replaceSchema(setHighlightedRow(schema, r - 1));
          return { ok: true };
        }
        return { ok: false, msg: '用法: H 1-9' };
      }

      // V 1-9 - 高亮列
      if (cmd === 'V' && parts[1]) {
        const c = Number(parts[1]);
        if (c >= 1 && c <= 9) {
          replaceSchema(setHighlightedCol(schema, c - 1));
          return { ok: true };
        }
        return { ok: false, msg: '用法: V 1-9' };
      }

      // B 1-9 - 高亮宫
      if (cmd === 'B' && parts[1]) {
        const b = Number(parts[1]);
        if (b >= 1 && b <= 9) {
          replaceSchema(setHighlightedBox(schema, b - 1));
          return { ok: true };
        }
        return { ok: false, msg: '用法: B 1-9' };
      }

      // cc r1c1 3 - 设置单元格颜色
      if (cmd === 'cc') {
        const pos = parsePos(parts[1]);
        const k = Number(parts[2]);
        if (!pos) {
          return { ok: false, msg: '用法: cc r1c1 1-8' };
        }
        const color = k >= 1 && k <= 8 ? (k as CellColor) : null;
        replaceSchema(addCellColor(schema, pos.row, pos.col, color));
        return { ok: true };
      }

      // kc r1c1 5 2 - 设置候选数颜色
      if (cmd === 'kc') {
        const pos = parsePos(parts[1]);
        const d = Number(parts[2]);
        const k = Number(parts[3]);
        if (!pos || !(d >= 1 && d <= 9)) {
          return { ok: false, msg: '用法: kc r1c1 5 1-6' };
        }
        const color = k >= 1 && k <= 6 ? (k as CandidateColor) : null;
        replaceSchema(addCandidateColor(schema, pos.row, pos.col, d as Digit, color));
        return { ok: true };
      }

      // l r1c1:5 r2c2:5 strong|weak - 添加链
      if (cmd === 'l' || cmd === 'link') {
        const a = parsePosDigit(parts[1] || '');
        const b = parsePosDigit(parts[2] || '');
        const t = (parts[3] || '').toLowerCase();
        if (!a || !b) {
          return { ok: false, msg: '用法: l r1c1:5 r2c2:5 [strong|weak]' };
        }
        const link = createLink(
          a.digit,
          a.pos.row,
          a.pos.col,
          b.digit,
          b.pos.row,
          b.pos.col,
          t === 'strong' || t === 's'
        );
        const res = validateLink(schema, link);
        if (!res.ok) return res;
        pushUndo();
        addLink(link);
        return { ok: true };
      }

      // lc - 清除链
      if (cmd === 'lc') {
        clearLinks();
        return { ok: true };
      }

      // solve - 求解
      if (cmd === 'solve') {
        const solution = solve(schema);
        if (!solution) return { ok: false, msg: '当前题目无解' };
        pushUndo();
        replaceSchema(applySolutionToSchema(schema, solution));
        return { ok: true };
      }

      // new 或 generate - 生成新题目
      if (cmd === 'new' || cmd === 'generate') {
        const n = parseInt(parts[1] ?? '', 10);
        const minClues = Number.isNaN(n) ? 25 : Math.max(17, Math.min(81, n));
        pushUndo();
        replaceSchema(gridToSchema(generatePuzzle(minClues)));
        return { ok: true };
      }

      // auto - 自动填充唯一候选数
      if (cmd === 'auto') {
        const result = autofillUniqueCandidates(schema);
        if (result === schema) {
          return { ok: false, msg: '没有可自动填充的格子' };
        }
        pushUndo();
        replaceSchema(result);
        return { ok: true };
      }

      // last r 1-9 - 行最后一位
      if (cmd === 'last' && parts[1]) {
        const unit = parts[1].toLowerCase();
        const d = Number(parts[2]);
        if (!(d >= 1 && d <= 9)) {
          return { ok: false, msg: '用法: last r|c|b 1-9 1-9' };
        }
        let result = schema;
        if (unit === 'r') {
          result = lastDigitRow(schema, parts[2] - 1, d as Digit);
        } else if (unit === 'c') {
          result = lastDigitCol(schema, parts[2] - 1, d as Digit);
        } else if (unit === 'b') {
          result = lastDigitBox(schema, parts[2] - 1, d as Digit);
        }
        if (result === schema) {
          return { ok: false, msg: '没有可填充的格子' };
        }
        pushUndo();
        replaceSchema(result);
        return { ok: true };
      }

      // nakedpair r1c1:5 r2c2:6 - 裸对
      if (cmd === 'np') {
        const a = parsePosDigit(parts[1] || '');
        const b = parsePosDigit(parts[2] || '');
        if (!a || !b) {
          return { ok: false, msg: '用法: np r1c1:5 r2c2:6' };
        }
        const result = nakedPair(schema, a.digit, b.digit, a.pos, b.pos);
        if (result === schema) {
          return { ok: false, msg: '不满足裸对条件' };
        }
        pushUndo();
        replaceSchema(result);
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
      replaceSchema,
      schema,
      selectCell,
      setCellColor,
      setCellValue,
      setCandidateColor,
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
          placeholder="示例: s r1c1 5; k r1c1 3"
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
        <div>s r1c1 5 - 设置格子值</div>
        <div>c r1c1 - 清除格子</div>
        <div>k r1c1 [3] - 切换候选数</div>
        <div>h 1-9/off - 高亮数字</div>
        <div>H 1-9 - 高亮行</div>
        <div>V 1-9 - 高亮列</div>
        <div>B 1-9 - 高亮宫</div>
        <div>cc r1c1 1-8 - 单元格颜色</div>
        <div>kc r1c1 5 1-6 - 候选数颜色</div>
        <div>l r1c1:5 r2c2:5 [s|w] - 添加链</div>
        <div>lc - 清除链</div>
        <div>auto - 自动填充</div>
        <div>last r|c|b 1-9 1-9 - 最后一位</div>
        <div>np r1c1:5 r2c2:6 - 裸对</div>
        <div>u/r - 撤销/重做</div>
      </div>
    </div>
  );
};
