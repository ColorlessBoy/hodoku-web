import React from 'react';
import { SudokuSchema, CellPosition, Digit } from '@/types/sudoku';
import { SudokuCanvas } from './SudokuCanvas';

interface SudokuGridProps {
  schema: SudokuSchema;
  onCellClick: (position: CellPosition) => void;
  onCandidateClick?: (position: CellPosition, digit: Digit) => void;
  size?: number; // 整个网格的大小（像素）
  overlaySchema?: SudokuSchema | null; // 中间状态叠加层
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  schema,
  onCellClick,
  onCandidateClick,
  size = 450,
  overlaySchema,
}) => {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 主盘面 */}
      <SudokuCanvas
        schema={schema}
        onCellClick={onCellClick}
        onCandidateClick={onCandidateClick}
        size={size}
      />
      {/* 中间状态叠加层 - 使用半透明白色背景 */}
      {overlaySchema && (
        <div
          className="absolute inset-0 bg-white/30 pointer-events-none"
          style={{ width: size, height: size }}
        >
          <SudokuCanvas
            schema={overlaySchema}
            onCellClick={() => {}}
            onCandidateClick={() => {}}
            size={size}
          />
        </div>
      )}
    </div>
  );
};
