import React, { useRef, useEffect } from 'react';
import { drawGrid, drawCells, drawLinks } from './drawUtils';
import { SudokuState } from '../../types/schema';

interface SudokuBoardProps {
  data: SudokuState;
  size?: number;
}

const SudokuBoard: React.FC<SudokuBoardProps> = ({ data, size = 600 }) => {
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

    // 2. Draw Grid Lines
    drawGrid(ctx, size, cellSize);

    // 3. Draw Links (Overlay)
    if (data.links) {
      drawLinks(ctx, data.links, cellSize);
    }
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      className="sudoku-board"
      // Accessibility
      role="img"
      aria-label="Sudoku Board"
    />
  );
};

export default SudokuBoard;
