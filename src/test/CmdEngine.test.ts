import { describe, it, expect, beforeEach } from 'vitest';
import {
  executeCommand,
  executeCommands,
  getCommandList,
  checkCommandExists,
  getAllHelp,
  parsePosDigit,
} from '@/lib/CmdEngine';
import { createNewSchema, type SudokuSchema } from '@/lib/SudokuEngine';

// 创建一个标准的测试谜题（简单数独）
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

describe('CmdEngine', () => {
  let schema: SudokuSchema;

  beforeEach(() => {
    schema = createNewSchema(testPuzzle);
  });

  describe('parsePosDigit', () => {
    it('should parse valid position with digit', () => {
      const result = parsePosDigit('115');
      expect(result).not.toBeNull();
      expect(result!.row).toBe(0);
      expect(result!.col).toBe(0);
      expect(result!.digit).toBe(5);
    });

    it('should parse valid position without digit', () => {
      const result = parsePosDigit('11');
      expect(result).not.toBeNull();
      expect(result!.row).toBe(0);
      expect(result!.col).toBe(0);
      expect(result!.digit).toBeUndefined();
    });

    it('should return null for empty string', () => {
      const result = parsePosDigit('');
      expect(result).toBeNull();
    });

    it('should return null for invalid input', () => {
      expect(parsePosDigit('a')).toBeNull();
      expect(parsePosDigit('abc')).toBeNull();
    });
  });

  describe('executeCommand', () => {
    describe('set command', () => {
      it('should set digit in empty cell', () => {
        // r1c3 (0-indexed row 0, col 2) is empty
        const result = executeCommand(schema, 'set 134');
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
          expect(result.schema.cells[0][2].digit).toBe(4);
        }
      });

      it('should return error for empty args', () => {
        const result = executeCommand(schema, 'set');
        expect(result.type).toBe('error');
      });
    });

    describe('unset command', () => {
      it('should unset digit from cell', () => {
        // First set a digit, then unset it
        let result = executeCommand(schema, 'set 134');
        expect(result.type).toBe('ok');

        result = executeCommand(
          result.type === 'ok' ? result.schema : schema,
          'unset 13'
        );
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
          expect(result.schema.cells[0][2].digit).toBeUndefined();
        }
      });
    });

    describe('highlight commands', () => {
      it('should highlight rows', () => {
        const result = executeCommand(schema, 'hrs 1 2');
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
          // Check that cells in rows 0 and 1 are highlighted
          expect(result.schema.cells[0][0].isHighlighted).toBe(true);
          expect(result.schema.cells[1][0].isHighlighted).toBe(true);
          // Check that cells in row 2 are not highlighted
          expect(result.schema.cells[2][0].isHighlighted).toBe(false);
        }
      });

      it('should clear all highlights', () => {
        // First highlight some rows
        let result = executeCommand(schema, 'hrs 1 2');
        expect(result.type).toBe('ok');

        // Then clear highlights
        result = executeCommand(
          result.type === 'ok' ? result.schema : schema,
          'uh'
        );
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
          // Check that no cells are highlighted
          const hasHighlighted = result.schema.cells.some((row) =>
            row.some((cell) => cell.isHighlighted)
          );
          expect(hasHighlighted).toBe(false);
        }
      });
    });

    describe('select commands', () => {
      it('should select cells', () => {
        const result = executeCommand(schema, 'ss 11 12');
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
          expect(result.schema.cells[0][0].isSelected).toBe(true);
          expect(result.schema.cells[0][1].isSelected).toBe(true);
        }
      });

      it('should clear all selections', () => {
        // First select some cells
        let result = executeCommand(schema, 'ss 11 12');
        expect(result.type).toBe('ok');

        // Then clear selections
        result = executeCommand(
          result.type === 'ok' ? result.schema : schema,
          'us'
        );
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
          // Check that no cells are selected
          const hasSelected = result.schema.cells.some((row) =>
            row.some((cell) => cell.isSelected)
          );
          expect(hasSelected).toBe(false);
        }
      });
    });

    describe('auto-fill commands', () => {
      it('should autofill unique candidates', () => {
        // Create a simple puzzle where a cell has only one candidate
        const simplePuzzle = [
          [1, 2, 3, 4, 5, 6, 7, 8, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const testSchema = createNewSchema(simplePuzzle);

        // The only empty cell in row 0 should have candidate 9
        const result = executeCommand(testSchema, 'autofuc');
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
          expect(result.schema.cells[0][8].digit).toBe(9);
        }
      });
    });

    describe('new command', () => {
      it('should create new puzzle', () => {
        const flatPuzzle = testPuzzle.flat().join('');
        const result = executeCommand(schema, `new ${flatPuzzle}`);
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
          // Verify first cell has the correct digit
          expect(result.schema.cells[0][0].digit).toBe(5);
        }
      });

      it('should return error for invalid puzzle', () => {
        const result = executeCommand(schema, 'new 123');
        expect(result.type).toBe('error');
      });
    });

    describe('unknown command', () => {
      it('should return error for unknown command', () => {
        const result = executeCommand(schema, 'unknown');
        expect(result.type).toBe('error');
        if (result.type === 'error') {
          expect(result.msg).toContain('未知命令');
        }
      });
    });
  });

  describe('executeCommands', () => {
    it('should execute multiple commands', () => {
      const result = executeCommands(schema, 'set 134; set 235');
      expect(result.result.type).toBe('ok');
      if (result.result.type === 'ok') {
        expect(result.finalSchema.cells[0][2].digit).toBe(4);
        expect(result.finalSchema.cells[1][2].digit).toBe(5);
      }
    });

    it('should stop on error', () => {
      // First command succeeds, second fails, third should not execute
      const result = executeCommands(schema, 'set 134; invalid; set 235');
      expect(result.result.type).toBe('error');
      // First cell should be set
      expect(result.finalSchema.cells[0][2].digit).toBe(4);
      // Second cell should NOT be set (command stopped at error)
      expect(result.finalSchema.cells[1][2].digit).toBeUndefined();
    });
  });

  describe('getCommandList', () => {
    it('should return list of commands', () => {
      const commands = getCommandList();
      expect(commands.length).toBeGreaterThan(0);
      // Check for some known commands
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
      expect(checkCommandExists('')).toBe(false);
    });
  });

  describe('getAllHelp', () => {
    it('should return help text', () => {
      const help = getAllHelp();
      expect(help.length).toBeGreaterThan(0);
      expect(help).toContain('基础操作');
      expect(help).toContain('set');
    });
  });
});
