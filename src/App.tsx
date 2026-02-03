import { useState, useEffect, useCallback } from 'react';
import SudokuBoard from './components/SudokuBoard/SudokuBoard';
import { sampleSudoku } from './data/sampleSudoku';
import { SudokuState } from './types/schema';
import './App.css';

function App() {
  const [sudokuData, setSudokuData] = useState<SudokuState>(sampleSudoku);
  const [selection, setSelection] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const handleCellClick = (row: number, col: number) => {
    setSelection({ row, col });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selection) return;

      const { row, col } = selection;
      const idx = row * 9 + col;

      // Navigation
      if (e.key === 'ArrowUp') {
        setSelection({ row: (row - 1 + 9) % 9, col });
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        setSelection({ row: (row + 1) % 9, col });
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowLeft') {
        setSelection({ row, col: (col - 1 + 9) % 9 });
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowRight') {
        setSelection({ row, col: (col + 1) % 9 });
        e.preventDefault();
        return;
      }

      // Input (1-9)
      if (e.key >= '1' && e.key <= '9') {
        const val = parseInt(e.key, 10);
        // Do not overwrite givens
        if (sudokuData.cells[idx].isGiven) return;

        const newCells = [...sudokuData.cells];
        newCells[idx] = { ...newCells[idx], value: val, candidates: [] }; // Clear candidates on value set
        setSudokuData({ ...sudokuData, cells: newCells });
        return;
      }

      // Delete / Backspace
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (sudokuData.cells[idx].isGiven) return;

        const newCells = [...sudokuData.cells];
        newCells[idx] = { ...newCells[idx], value: null };
        setSudokuData({ ...sudokuData, cells: newCells });
        return;
      }
    },
    [selection, sudokuData]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="app-container">
      <div className="board-container">
        <SudokuBoard
          data={sudokuData}
          size={600}
          selection={selection}
          onCellClick={handleCellClick}
        />
      </div>
      <p className="description">
        <strong>Interaction Demo:</strong> Click to select a cell. Use Arrow keys
        to move. Type 1-9 to fill a number. Use Backspace/Delete to clear.
      </p>
    </div>
  );
}

export default App;
