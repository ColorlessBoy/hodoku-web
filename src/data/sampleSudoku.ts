import { Cell, Link, SudokuState } from '../types/schema';

const createEmptyCells = (): Cell[] => {
  const cells: Cell[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells.push({
        row: r,
        col: c,
        value: null,
        candidates: [],
        colors: {},
      });
    }
  }
  return cells;
};

const cells = createEmptyCells();

// 1. Set some givens (Classic Easy)
const givens = [
  { r: 0, c: 0, v: 5 },
  { r: 0, c: 1, v: 3 },
  { r: 0, c: 4, v: 7 },
  { r: 1, c: 0, v: 6 },
  { r: 1, c: 3, v: 1 },
  { r: 1, c: 4, v: 9 },
  { r: 1, c: 5, v: 5 },
  { r: 2, c: 1, v: 9 },
  { r: 2, c: 2, v: 8 },
  { r: 2, c: 7, v: 6 },
  { r: 3, c: 0, v: 8 },
  { r: 3, c: 4, v: 6 },
  { r: 3, c: 8, v: 3 },
  { r: 4, c: 0, v: 4 },
  { r: 4, c: 3, v: 8 },
  { r: 4, c: 5, v: 3 },
  { r: 4, c: 8, v: 1 },
  { r: 5, c: 0, v: 7 },
  { r: 5, c: 4, v: 2 },
  { r: 5, c: 8, v: 6 },
  { r: 6, c: 1, v: 6 },
  { r: 6, c: 6, v: 2 },
  { r: 6, c: 7, v: 8 },
  { r: 7, c: 3, v: 4 },
  { r: 7, c: 4, v: 1 },
  { r: 7, c: 5, v: 9 },
  { r: 7, c: 8, v: 5 },
  { r: 8, c: 4, v: 8 },
  { r: 8, c: 7, v: 7 },
  { r: 8, c: 8, v: 9 },
];

givens.forEach(({ r, c, v }) => {
  const idx = r * 9 + c;
  cells[idx].value = v;
  cells[idx].isGiven = true;
});

// 2. Set some user filled values
cells[2 * 9 + 0].value = 2; // r2c0

// 3. Set candidates
const idxWithCandidates = 0 * 9 + 2; // r0c2
cells[idxWithCandidates].candidates = [
  { value: 1, background: '#ff0000' },
  { value: 2 },
  { value: 4 },
];

// 4. Color a cell background (e.g., highlighting a focused house or logic)
if (!cells[4 * 9 + 4].colors) cells[4 * 9 + 4].colors = {};
cells[4 * 9 + 4].colors!.background = 'rgba(255, 255, 0, 0.3)'; // Center cell yellow

// 5. Color specific candidates (e.g., coloring for Chains)
const cellChain1 = cells[0 * 9 + 8]; // r0c8
cellChain1.candidates = [{ value: 1, color: '#ff0000' }, { value: 4, color: '#00ff00' }];

const cellChain2 = cells[8 * 9 + 0]; // r8c0
cellChain2.candidates = [{ value: 1, color: '#ff0000' }, { value: 5, color: '#00ff00' }];

// 6. Add Links (AIC or Strong/Weak links)
const links: Link[] = [
  {
    start: { row: 0, col: 8, digit: 1 },
    end: { row: 8, col: 0, digit: 1 },
    type: 'strong',
    color: '#ff0000', // Red link for digit 1
  },
  {
    start: { row: 8, col: 0, digit: 1 },
    end: { row: 8, col: 4, digit: 8 }, // Just random connection for demo
    type: 'weak',
    color: '#00aa00',
  },
];

export const sampleSudoku: SudokuState = {
  cells,
  links,
};
