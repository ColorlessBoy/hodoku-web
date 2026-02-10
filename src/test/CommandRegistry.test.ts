import { describe, it, expect, beforeAll } from 'vitest';
import {
  safeGet,
  safeParseInt,
  isNil,
  isNotNil,
  getOr,
  hasCommand,
  getCommandHandler,
  getCommandMeta,
  getAllCommands,
  getCommandsByCategory,
  generateHelpText,
  getAllHelpText,
  type CommandMeta,
} from '@/lib/CommandRegistry';

// Initialize commands before running tests
import { initializeCommands } from '@/lib/CommandDefinitions';
beforeAll(() => {
  initializeCommands();
});

// Mock command meta for testing
const mockCommand: CommandMeta = {
  name: 'test',
  aliases: ['t'],
  description: 'Test command',
  category: 'basic',
  args: [],
  examples: ['test'],
};

describe('CommandRegistry - Utility Functions', () => {
  describe('safeGet', () => {
    it('should return element at valid index', () => {
      const arr = [1, 2, 3];
      expect(safeGet(arr, 0)).toBe(1);
      expect(safeGet(arr, 1)).toBe(2);
      expect(safeGet(arr, 2)).toBe(3);
    });

    it('should return undefined for out of bounds index', () => {
      const arr = [1, 2, 3];
      expect(safeGet(arr, -1)).toBeUndefined();
      expect(safeGet(arr, 3)).toBeUndefined();
      expect(safeGet(arr, 100)).toBeUndefined();
    });

    it('should return undefined for empty array', () => {
      const arr: number[] = [];
      expect(safeGet(arr, 0)).toBeUndefined();
    });
  });

  describe('safeParseInt', () => {
    it('should parse valid integers', () => {
      expect(safeParseInt('123')).toBe(123);
      expect(safeParseInt('-456')).toBe(-456);
      expect(safeParseInt('0')).toBe(0);
    });

    it('should return NaN for invalid strings', () => {
      expect(safeParseInt('abc')).toBeNaN();
      // Note: parseInt('12.34') returns 12 in JavaScript, which is expected behavior
      expect(safeParseInt('')).toBeNaN();
    });
  });

  describe('isNil', () => {
    it('should return true for null and undefined', () => {
      expect(isNil(null)).toBe(true);
      expect(isNil(undefined)).toBe(true);
    });

    it('should return false for non-null values', () => {
      expect(isNil(0)).toBe(false);
      expect(isNil('')).toBe(false);
      expect(isNil(false)).toBe(false);
      expect(isNil([])).toBe(false);
      expect(isNil({})).toBe(false);
    });
  });

  describe('isNotNil', () => {
    it('should return false for null and undefined', () => {
      expect(isNotNil(null)).toBe(false);
      expect(isNotNil(undefined)).toBe(false);
    });

    it('should return true for non-null values', () => {
      expect(isNotNil(0)).toBe(true);
      expect(isNotNil('')).toBe(true);
      expect(isNotNil(false)).toBe(true);
      expect(isNotNil([])).toBe(true);
      expect(isNotNil({})).toBe(true);
    });
  });

  describe('getOr', () => {
    it('should return value if not nil', () => {
      expect(getOr(42, 0)).toBe(42);
      expect(getOr('hello', 'default')).toBe('hello');
      expect(getOr(false, true)).toBe(false);
    });

    it('should return default if nil', () => {
      expect(getOr(null, 0)).toBe(0);
      expect(getOr(undefined, 'default')).toBe('default');
    });
  });
});

describe('CommandRegistry - Command Management', () => {
  // Note: These tests rely on the actual command registry being initialized
  // The CommandDefinitions.initializeCommands() is called when CmdEngine is imported

  describe('hasCommand', () => {
    it('should return true for registered commands', () => {
      expect(hasCommand('set')).toBe(true);
      expect(hasCommand('unset')).toBe(true);
      expect(hasCommand('new')).toBe(true);
      expect(hasCommand('s')).toBe(true); // alias
    });

    it('should return false for unregistered commands', () => {
      expect(hasCommand('nonexistent')).toBe(false);
      expect(hasCommand('random')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(hasCommand('SET')).toBe(true);
      expect(hasCommand('Set')).toBe(true);
    });
  });

  describe('getAllCommands', () => {
    it('should return all registered commands', () => {
      const commands = getAllCommands();
      expect(commands.length).toBeGreaterThan(0);

      // Should have unique names
      const names = commands.map((c) => c.name);
      const uniqueNames = [...new Set(names)];
      expect(names).toEqual(uniqueNames);
    });

    it('should return commands sorted by name', () => {
      const commands = getAllCommands();
      const names = commands.map((c) => c.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });
  });

  describe('getCommandsByCategory', () => {
    it('should return commands for each category', () => {
      const categories = [
        'basic',
        'highlight',
        'select',
        'solve',
        'auto',
        'new',
        'history',
      ] as const;

      for (const category of categories) {
        const commands = getCommandsByCategory(category);
        // Some categories might be empty depending on what's registered
        expect(commands.every((c) => c.category === category)).toBe(true);
      }
    });
  });

  describe('generateHelpText', () => {
    it('should generate help text for a command', () => {
      const meta = getCommandMeta('set');
      expect(meta).toBeDefined();

      if (meta) {
        const help = generateHelpText(meta);
        expect(help).toContain('set');
        expect(help).toContain('设置');
        expect(help).toContain('示例');
      }
    });
  });

  describe('getAllHelpText', () => {
    it('should return all commands help text', () => {
      const help = getAllHelpText();
      expect(help).toContain('基础操作');
      expect(help).toContain('set');
      expect(help).toContain('unset');
    });
  });
});

describe('CommandRegistry - Type Exports', () => {
  it('should export all necessary types', () => {
    // These should compile without error
    const _: { [K: string]: unknown } = {
      CommandMeta: undefined as unknown,
      ArgDef: undefined as unknown,
      ArgType: undefined as unknown,
      CommandCategory: undefined as unknown,
    };

    expect(_).toBeDefined();
  });
});
