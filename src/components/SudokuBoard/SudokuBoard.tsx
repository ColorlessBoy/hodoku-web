import React, { useRef, useEffect } from 'react';
import { drawGrid, drawCells, drawLinks, drawSelection } from './drawUtils';
import { SudokuState } from '../../types/schema';

interface SudokuBoardProps {
  data: SudokuState;
  size?: number;
  selection?: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
}

const SudokuBoard: React.FC<SudokuBoardProps> = ({
  data,
  size = 600,
  selection = null,
  onCellClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Adjust canvas size for high DPI
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(dpr, dpr);

    const cellSize = size / 9;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // 1. Draw Background & Cells
    drawCells(ctx, data.cells, cellSize);

    // 3. Draw Grid Lines
    drawGrid(ctx, size, cellSize);

    // 4. Draw Links (Overlay)
    if (data.links) {
      drawLinks(ctx, data.links, cellSize);
    }

    // 5. Draw Selection (Topmost)
    if (selection) {
      drawSelection(ctx, selection.row, selection.col, cellSize);
    }
  }, [data, size, selection]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellSize = size / 9;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      onCellClick(row, col);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="sudoku-board"
      onClick={handleClick}
      // Accessibility
      role="img"
      aria-label="Sudoku Board"
    />
  );
};

export default SudokuBoard;
