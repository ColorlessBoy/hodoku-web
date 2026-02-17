import React from 'react';
import { SudokuGrid } from './SudokuGrid';
import { CommandPad } from './CommandPad';
import { useSudokuState } from '@/hooks/useSudokuState';
import { Position, Digit, SudokuSchema } from '@/lib/sudoku';

export const SudokuApp: React.FC = () => {
  const { schema, selectCell, setCellValue, clearCell, replaceSchema } = useSudokuState();

  const [selectedCell, setSelectedCell] = React.useState<Position | null>(null);
  const [mode, setMode] = React.useState<'normal' | 'corner'>('normal');
  const [overlaySchema, setOverlaySchema] = React.useState<SudokuSchema | null>(null);

  const handleCellClick = (position: Position) => {
    setSelectedCell(position);
    selectCell(position);
  };

  return (
    <div className="h-screen bg-background flex items-start justify-center p-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-start w-full max-w-7xl h-full">
        {/* 数独盘面 */}
        <div className="flex flex-col gap-4 flex-shrink-0">
          <SudokuGrid
            schema={schema}
            onCellClick={handleCellClick}
            onCandidateClick={(position, digit) => {}}
            size={Math.min(window.innerHeight - 64, window.innerWidth - 64)}
            overlaySchema={overlaySchema}
          />
        </div>

        {/* 数独操作面板 */}
        <div className="flex flex-col gap-4 flex-1 min-w-0 h-full overflow-hidden">
          <CommandPad
            schema={schema}
            replaceSchema={replaceSchema}
            onIntermediateSchema={setOverlaySchema}
          />
        </div>
      </div>
    </div>
  );
};
