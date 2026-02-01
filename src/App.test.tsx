import { render, screen } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import App from './App';

// Mock SudokuBoard to avoid canvas issues in simple App test
vi.mock('./components/SudokuBoard/SudokuBoard', () => ({
  default: () => <div data-testid="mock-board">Board</div>,
}));

test('renders Hodoku Web title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Hodoku Web Canvas Renderer/i);
expect(titleElement).not.toBeNull();
});
