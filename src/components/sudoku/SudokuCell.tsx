import React from 'react';
import { CellRenderState, CellPosition, CellColor } from '@/types/sudoku';
import { cn } from '@/lib/utils';

interface SudokuCellProps {
  cell: CellRenderState;
  position: CellPosition;
  onClick: (position: CellPosition) => void;
  cellSize: number;
}

const colorClasses: Record<number, string> = {
  1: 'bg-sudoku-color-1',
  2: 'bg-sudoku-color-2',
  3: 'bg-sudoku-color-3',
  4: 'bg-sudoku-color-4',
  5: 'bg-sudoku-color-5',
  6: 'bg-sudoku-color-6',
  7: 'bg-sudoku-color-7',
  8: 'bg-sudoku-color-8',
};

const candidateColorClasses: Record<number, string> = {
  1: 'text-sudoku-candidate-1',
  2: 'text-sudoku-candidate-2',
  3: 'text-sudoku-candidate-3',
  4: 'text-sudoku-candidate-4',
  5: 'text-sudoku-candidate-5',
  6: 'text-sudoku-candidate-6',
};

export const SudokuCell: React.FC<SudokuCellProps> = ({ cell, position, onClick, cellSize }) => {
  const handleClick = () => onClick(position);

  // 计算边框样式
  const borderClasses = cn(
    'border-sudoku-border-thin',
    // 右边框
    (position.col + 1) % 3 === 0 && position.col !== 8 && 'border-r-2 border-r-sudoku-border-thick',
    // 下边框
    (position.row + 1) % 3 === 0 && position.row !== 8 && 'border-b-2 border-b-sudoku-border-thick',
    // 常规边框
    position.col !== 8 && !((position.col + 1) % 3 === 0) && 'border-r',
    position.row !== 8 && !((position.row + 1) % 3 === 0) && 'border-b'
  );

  // 计算背景色优先级
  const getBackgroundClass = () => {
    if (cell.hasConflict) return 'bg-sudoku-error-bg';
    if (cell.backgroundColor) return colorClasses[cell.backgroundColor];
    if (cell.isSelected) return 'bg-sudoku-cell-selected';
    if (cell.isSameValue) return 'bg-sudoku-cell-same-value';
    if (cell.isRelated) return 'bg-sudoku-cell-related';
    if (cell.isHighlighted) return 'bg-sudoku-cell-highlighted';
    return 'bg-sudoku-cell hover:bg-sudoku-cell-hover';
  };

  // 渲染主值
  const renderValue = () => {
    if (!cell.value) return null;

    return (
      <span
        className={cn(
          'text-center font-medium transition-all',
          cell.isGiven ? 'text-sudoku-given font-semibold' : 'text-sudoku-filled',
          cell.hasConflict && 'text-sudoku-error animate-error-shake'
        )}
        style={{ fontSize: cellSize * 0.55 }}
      >
        {cell.value}
      </span>
    );
  };

  // 渲染角注（四角）
  const renderCornerCandidates = () => {
    if (cell.value || cell.cornerCandidates.length === 0) return null;

    const positions = [
      'top-0.5 left-1', // 左上
      'top-0.5 right-1', // 右上
      'bottom-0.5 left-1', // 左下
      'bottom-0.5 right-1', // 右下
      'top-0.5 left-1/2 -translate-x-1/2', // 上中
      'bottom-0.5 left-1/2 -translate-x-1/2', // 下中
      'top-1/2 left-1 -translate-y-1/2', // 左中
      'top-1/2 right-1 -translate-y-1/2', // 右中
      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', // 中心
    ];

    return cell.cornerCandidates.slice(0, 9).map((candidate, index) => (
      <span
        key={candidate.digit}
        className={cn(
          'absolute font-medium',
          positions[index],
          candidate.color ? candidateColorClasses[candidate.color] : 'text-muted-foreground',
          candidate.eliminated && 'line-through opacity-50'
        )}
        style={{ fontSize: cellSize * 0.22 }}
      >
        {candidate.digit}
      </span>
    ));
  };

  // 渲染中心候选数
  const renderCenterCandidates = () => {
    if (cell.value || cell.centerCandidates.length === 0) return null;

    return (
      <div
        className="flex flex-wrap justify-center items-center gap-0"
        style={{ fontSize: cellSize * 0.2 }}
      >
        {cell.centerCandidates.map((candidate) => (
          <span
            key={candidate.digit}
            className={cn(
              'font-medium leading-none',
              candidate.color ? candidateColorClasses[candidate.color] : 'text-muted-foreground',
              candidate.eliminated && 'line-through opacity-50'
            )}
          >
            {candidate.digit}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center cursor-pointer select-none transition-colors duration-100',
        borderClasses,
        getBackgroundClass()
      )}
      style={{
        width: cellSize,
        height: cellSize,
      }}
      onClick={handleClick}
    >
      {renderValue()}
      {renderCornerCandidates()}
      {!cell.value && cell.cornerCandidates.length === 0 && renderCenterCandidates()}
    </div>
  );
};
