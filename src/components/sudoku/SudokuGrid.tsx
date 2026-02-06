import React from 'react';
import { SudokuRenderSchema, CellPosition, Digit } from '@/types/sudoku';
import { SudokuCanvas } from './SudokuCanvas';

interface SudokuGridProps {
  schema: SudokuRenderSchema;
  onCellClick: (position: CellPosition) => void;
  onCandidateClick?: (position: CellPosition, digit: Digit) => void;
  size?: number; // 整个网格的大小（像素）
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  schema,
  onCellClick,
  onCandidateClick,
  size = 450,
}) => {
  return (
    <SudokuCanvas
      schema={schema}
      onCellClick={onCellClick}
      onCandidateClick={onCandidateClick}
      size={size}
    />
  );
};
