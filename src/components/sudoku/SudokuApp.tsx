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
    <div className="h-screen bg-background flex items-start justify-center p-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-start w-full max-w-7xl h-full">
        {/* 数独盘面 */}
        <div className="flex flex-col gap-4 flex-shrink-0">
          <SudokuGrid
            schema={schema}
            onCellClick={handleCellClick}
            onCandidateClick={(position, digit) => toggleCornerCandidate(position, digit)}
            size={Math.min(window.innerHeight - 64, window.innerWidth - 64)}
          />
        </div>

        {/* 数独操作面板 */}
        <div className="flex flex-col gap-4 flex-1 min-w-0 h-full overflow-hidden">
          <CommandPad
            schema={schema}
            replaceSchema={replaceSchema}
          />
        </div>
      </div>
    </div>
  );
};
