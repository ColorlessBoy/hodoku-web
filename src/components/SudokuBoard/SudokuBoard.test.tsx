import { render, screen } from '@testing-library/react';
import { test, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import SudokuBoard from './SudokuBoard';
import { sampleSudoku } from '../../data/sampleSudoku';

// Mock canvas getContext
const getContextMock = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  scale: vi.fn(),
  setLineDash: vi.fn(),
});

let getContextSpy: MockInstance;

beforeEach(() => {
  getContextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(getContextMock);
});

afterEach(() => {
  getContextSpy.mockRestore();
});

test('renders sudoku board canvas', () => {
  render(<SudokuBoard data={sampleSudoku} size={600} />);
  const canvas = screen.getByRole('img', { name: /Sudoku Board/i });
  expect(canvas).toBeInTheDocument();
});

test('calls getContext on mount', () => {
  render(<SudokuBoard data={sampleSudoku} size={600} />);
  expect(getContextSpy).toHaveBeenCalledWith('2d');
});
