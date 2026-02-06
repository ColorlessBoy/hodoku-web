import React from 'react';
import { ChainLink } from '@/types/sudoku';

interface SudokuLinksProps {
  links: ChainLink[];
  cellSize: number;
  gridOffset: { x: number; y: number };
}

export const SudokuLinks: React.FC<SudokuLinksProps> = ({ links, cellSize, gridOffset }) => {
  if (links.length === 0) return null;

  const getCellCenter = (row: number, col: number, candidate?: number) => {
    const baseX = gridOffset.x + col * cellSize + cellSize / 2;
    const baseY = gridOffset.y + row * cellSize + cellSize / 2;

    // 如果是候选数链，稍微偏移位置
    if (candidate) {
      const candidateOffset = cellSize * 0.25;
      const positions = [
        { x: -candidateOffset, y: -candidateOffset }, // 1
        { x: 0, y: -candidateOffset }, // 2
        { x: candidateOffset, y: -candidateOffset }, // 3
        { x: -candidateOffset, y: 0 }, // 4
        { x: 0, y: 0 }, // 5
        { x: candidateOffset, y: 0 }, // 6
        { x: -candidateOffset, y: candidateOffset }, // 7
        { x: 0, y: candidateOffset }, // 8
        { x: candidateOffset, y: candidateOffset }, // 9
      ];
      const pos = positions[candidate - 1];
      return { x: baseX + pos.x, y: baseY + pos.y };
    }

    return { x: baseX, y: baseY };
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* 强链箭头 */}
        <marker
          id="arrowhead-strong"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--sudoku-link-strong))" />
        </marker>
        {/* 弱链箭头 */}
        <marker
          id="arrowhead-weak"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--sudoku-link-weak))" />
        </marker>
      </defs>

      {links.map((link, index) => {
        const from = getCellCenter(
          link.from.position.row,
          link.from.position.col,
          link.from.candidate
        );
        const to = getCellCenter(link.to.position.row, link.to.position.col, link.to.candidate);

        return (
          <line
            key={index}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className={link.isStrong ? 'sudoku-link-strong' : 'sudoku-link-weak'}
            markerEnd={`url(#arrowhead-${link.isStrong ? 'strong' : 'weak'})`}
            style={link.color ? { stroke: link.color } : undefined}
          />
        );
      })}
    </svg>
  );
};
