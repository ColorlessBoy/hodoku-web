import React from 'react';
import { SudokuGrid } from './SudokuGrid';
import { useSudokuState } from '@/hooks/useSudokuState';
import { CellPosition, Digit } from '@/types/sudoku';

export const SudokuApp: React.FC = () => {
  const { schema } = useSudokuState();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        {/* 数独盘面 */}
        <div className="flex flex-col gap-4">
          <SudokuGrid
            schema={{
              ...schema,
            }}
            onCellClick={(position: CellPosition) => {
              console.log(position);
            }}
            onCandidateClick={(position: CellPosition, digit: Digit) => {
              console.log(position, digit);
            }}
            size={Math.min(window.innerHeight - 64, window.innerWidth - 64)}
          />
        </div>
      </div>
    </div>
  );
};
