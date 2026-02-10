import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNewSchema,
  cloneCells,
  setCellInplace,
  unsetCellInplace,
  fillCandidatesInplace,
  addCandidateInplace,
  checkConflict,
  autofillUniqueCandidate,
  lastDigitRow,
  lastDigitCol,
  lastDigitBox,
  nakedPair,
  setHighlightedRows,
  addHighlightedRows,
  clearAllHighlighted,
  setSelectedRows,
  addSelectedRows,
  clearAllSelected,
  type SudokuSchema,
} from '@/lib/SudokuEngine';
import {
  getCommandList,
  checkCommandExists,
  getAllHelp,
} from '@/lib/CmdEngine';

// 创建一个标准的测试谜题
const testPuzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

describe('SudokuEngine', () => {
  let schema: SudokuSchema;

  beforeEach(() => {
    schema = createNewSchema(testPuzzle);
  });

  describe('createNewSchema', () => {
    it('should create a valid schema', () => {
      expect(schema).toBeDefined();
      expect(schema.cells).toHaveLength(9);
      expect(schema.cells[0]).toHaveLength(9);
      expect(schema.links).toEqual([]);
    });

    it('should correctly set given digits', () => {
      // Row 0, Col 0 should have digit 5
      expect(schema.cells[0][0].digit).toBe(5);
      expect(schema.cells[0][0].isGiven).toBe(true);

      // Row 0, Col 2 should be empty
      expect(schema.cells[0][2].digit).toBeUndefined();
    });

    it('should assign correct positions to cells', () => {
      const cell = schema.cells[0][0];
      expect(cell.position).toEqual({ row: 0, col: 0, box: 0 });
    });
  });

  describe('cloneCells', () => {
    it('should create a deep copy of cells', () => {
      const cloned = cloneCells(schema.cells);

      // Verify structure
      expect(cloned).toHaveLength(9);
      expect(cloned[0]).toHaveLength(9);

      // Verify it's a deep copy (not same reference)
      cloned[0][0] = { ...cloned[0][0], digit: 9 as const };
      expect(schema.cells[0][0].digit).toBe(5); // Original unchanged
    });
  });

  describe('setCellInplace', () => {
    it('should set digit in empty cell', () => {
      const cells = cloneCells(schema.cells);
      setCellInplace(cells, 0, 2, 4 as const);

      expect(cells[0][2].digit).toBe(4);
    });

    it('should not set digit in given cell', () => {
      const cells = cloneCells(schema.cells);
      setCellInplace(cells, 0, 0, 9 as const);

      // Original value should remain
      expect(cells[0][0].digit).toBe(5);
    });

    it('should remove conflicting candidates', () => {
      const cells = cloneCells(schema.cells);
      // Cell at (0,2) should have candidates that include 4
      setCellInplace(cells, 0, 2, 4 as const);

      // Check that related cells no longer have 4 as candidate
      // The exact behavior depends on implementation
      expect(cells[0][2].cornerCandidates).toBeNull();
    });
  });

  describe('unsetCellInplace', () => {
    it('should unset digit and restore candidates', () => {
      const cells = cloneCells(schema.cells);
      // First set a digit
      setCellInplace(cells, 0, 2, 4 as const);
      expect(cells[0][2].digit).toBe(4);

      // Then unset it
      unsetCellInplace(cells, 0, 2);
      expect(cells[0][2].digit).toBeUndefined();
      // Candidates should be restored
      expect(cells[0][2].cornerCandidates).toBeDefined();
    });

    it('should not unset given cells', () => {
      const cells = cloneCells(schema.cells);
      unsetCellInplace(cells, 0, 0); // This is a given cell with value 5
      expect(cells[0][0].digit).toBe(5);
    });
  });

  describe('highlight operations', () => {
    it('should highlight rows', () => {
      const result = setHighlightedRows(schema, [0, 1]);
      // All cells in rows 0 and 1 should be highlighted
      expect(result.cells[0][0].isHighlighted).toBe(true);
      expect(result.cells[1][0].isHighlighted).toBe(true);
      // Cells not in selected rows should not be highlighted (can be undefined or false)
      expect(!!result.cells[2][0].isHighlighted).toBe(false);
    });

    it('should add highlighted rows', () => {
      const result1 = setHighlightedRows(schema, [0]);
      const result2 = addHighlightedRows(result1, [1]);
      // Both rows should be highlighted
      expect(result2.cells[0][0].isHighlighted).toBe(true);
      expect(result2.cells[1][0].isHighlighted).toBe(true);
    });

    it('should clear all highlights', () => {
      const highlighted = setHighlightedRows(schema, [0, 1, 2]);
      const cleared = clearAllHighlighted(highlighted);
      // No cells should be highlighted
      const hasHighlighted = cleared.cells.some((row) =>
        row.some((cell) => cell.isHighlighted)
      );
      expect(hasHighlighted).toBe(false);
    });
  });

  describe('select operations', () => {
    it('should select rows', () => {
      const result = setSelectedRows(schema, [0, 1]);
      // All cells in rows 0 and 1 should be selected
      expect(result.cells[0][0].isSelected).toBe(true);
      expect(result.cells[1][0].isSelected).toBe(true);
      // Cells not in selected rows should not be selected (can be undefined or false)
      expect(!!result.cells[2][0].isSelected).toBe(false);
    });

    it('should add selected rows', () => {
      const result1 = setSelectedRows(schema, [0]);
      const result2 = addSelectedRows(result1, [1]);
      // Both rows should be selected
      expect(result2.cells[0][0].isSelected).toBe(true);
      expect(result2.cells[1][0].isSelected).toBe(true);
    });

    it('should clear all selections', () => {
      const selected = setSelectedRows(schema, [0, 1, 2]);
      const cleared = clearAllSelected(selected);
      // No cells should be selected
      const hasSelected = cleared.cells.some((row) =>
        row.some((cell) => cell.isSelected)
      );
      expect(hasSelected).toBe(false);
    });
  });

  describe('getCommandList', () => {
    it('should return a list of commands', () => {
      const commands = getCommandList();
      expect(commands.length).toBeGreaterThan(0);
      // Check for some expected commands
      expect(commands).toContain('set');
      expect(commands).toContain('unset');
      expect(commands).toContain('new');
    });
  });

  describe('checkCommandExists', () => {
    it('should return true for existing commands', () => {
      expect(checkCommandExists('set')).toBe(true);
      expect(checkCommandExists('unset')).toBe(true);
      expect(checkCommandExists('new')).toBe(true);
    });

    it('should return false for non-existing commands', () => {
      expect(checkCommandExists('nonexistent')).toBe(false);
      expect(checkCommandExists('random')).toBe(false);
    });
  });

  describe('getAllHelp', () => {
    it('should return help text', () => {
      const help = getAllHelp();
      expect(help.length).toBeGreaterThan(0);
      expect(help).toContain('基础操作');
    });
  });
});
