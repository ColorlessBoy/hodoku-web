import React from 'react';
import { SudokuGrid } from './SudokuGrid';
import { CommandPad } from './CommandPad';
import { useSudokuState } from '@/hooks/useSudokuState';
import { CellPosition, Digit } from '@/types/sudoku';

export const SudokuApp: React.FC = () => {
  const {
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
  } = useSudokuState();

  const [selectedCell, setSelectedCell] = React.useState<CellPosition | null>(null);
  const [mode, setMode] = React.useState<'normal' | 'corner'>('normal');

  const handleCellClick = (position: CellPosition) => {
    setSelectedCell(position);
    selectCell(position);
  };

  const handleNumberClick = (digit: Digit) => {
    if (!selectedCell) return;

    if (mode === 'normal') {
      setCellValue(selectedCell, digit);
    } else if (mode === 'corner') {
      toggleCornerCandidate(selectedCell, digit);
    }
  };

  const handleClear = () => {
    if (!selectedCell) return;
    clearCell(selectedCell);
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-start">
        {/* 数独盘面 */}
        <div className="flex flex-col gap-4">
          <SudokuGrid
            schema={schema}
            onCellClick={handleCellClick}
            onCandidateClick={(position, digit) => toggleCornerCandidate(position, digit)}
            size={Math.min(window.innerHeight - 64, window.innerWidth - 64)}
          />
        </div>
      </div>
      {/* 数独操作面板 */}
      <div className="flex flex-col gap-4">
        <CommandPad
          schema={schema}
          replaceSchema={replaceSchema}
        />
        {/* NumberPad with state */}
        <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
          <div className="flex gap-2">
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'normal'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              onClick={() => setMode('normal')}
            >
              正常
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'corner'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              onClick={() => setMode('corner')}
            >
              角注
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                className="aspect-square flex items-center justify-center text-xl font-semibold rounded-lg transition-all bg-card hover:bg-accent border border-border shadow-sm hover:shadow-md active:scale-95"
                onClick={() => handleNumberClick(digit as Digit)}
              >
                {digit}
              </button>
            ))}
            <button
              className="aspect-square flex items-center justify-center rounded-lg transition-all bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 shadow-sm
              hover:shadow-md active:scale-95 text-destructive"
              onClick={handleClear}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
