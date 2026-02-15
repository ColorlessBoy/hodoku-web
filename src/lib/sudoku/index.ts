export type { Color, Cell, Link, Digit, Position, SudokuSchema, Candidate } from './types';
export { getBoxIndex, cloneSchema, cloneCells, createNewSchema, setCell } from './basic';

export {
  checkHighlighted,
  setCellHighlighted,
  cleanCellHighlighted,
  cleanAllCellsHighlighted,
  setDigitHighlighted,
  setRowHighlighted,
  setColHighlighted,
  setBoxHighlighted,
  setXYHighlighted,
  highlightSelected,
} from './highlight';
export {
  checkSelected,
  setCellSelected,
  cleanCellSelected,
  cleanAllCellsSelected,
  setDigitSelected,
  setRowSelected,
  setColSelected,
  setBoxSelected,
  setXYSelected,
  selectHighlighted,
} from './select';
export {
  fillLastCandidateAuto as fillUniqueCandidateAuto,
  fillLastDigitInRow,
  fillLastDigitInCol,
  fillLastDigitInBox,
} from './fill';
export {
  setCellColor,
  setCellCandidateColor,
  setRowCandidateColor,
  setColCandidateColor,
  setBoxCandidateColor,
} from './color';
