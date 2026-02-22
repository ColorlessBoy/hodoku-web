import { set } from 'date-fns';
import { getRowCells, hasCandidate, hasDigit } from './basic';
import { checkSelected } from './select';
import type { Candidate, Cell } from './types';

export function checkHighlighted(cell: Cell, highlighted: boolean = true): boolean {
  let isTrue = false;
  if (cell.isHighlighted === true) {
    isTrue = true;
  }
  if (cell.candidates?.length > 0) {
    for (const c of cell.candidates) {
      if (c.isHighlighted === true) {
        isTrue = true;
      }
    }
  }
  if (isTrue === true) {
    return highlighted;
  }
  return !highlighted;
}
function setCandidatesHighlighted(
  candidates: Candidate[] | undefined,
  highlighted: boolean = true,
  digit?: number
) {
  if (candidates?.length > 0) {
    for (const c of candidates) {
      if (c.digit === digit) {
        c.isHighlighted = highlighted;
      }
    }
  }
}

export function setCellHighlighted(
  cell: Cell,
  highlighted: boolean = true,
  digit?: number
): boolean {
  const changed = !checkHighlighted(cell, highlighted);
  if (digit === undefined) {
    // 只针对单元格的设置
    cell.isHighlighted = highlighted;
    // 针对没有数的格子
    if (cell.candidates) {
      for (const c of cell.candidates) {
        c.isHighlighted = undefined;
      }
    }
  }
  // 针对有数的格子
  if (cell.digit === digit) {
    cell.isHighlighted = highlighted;
    // 没有候选数，所以不用处理
  } else {
    if (hasCandidate(cell, digit)) {
      // 针对命中的候选数的格子
      setCandidatesHighlighted(cell.candidates, highlighted, digit);
      // 候选数设置了 Highlighted 后，消去 Cell 的 Highlighted 状态
      cell.isHighlighted = undefined;
    }
  }
  return changed;
}

function setAllCellsHighlighted(cells: Cell[], highlighted: boolean = true): boolean {
  let changed = false;
  for (const cell of cells) {
    if (setCellHighlighted(cell, highlighted)) {
      changed = true;
    }
  }
  return changed;
}

export function cleanCellHighlighted(cell: Cell): boolean {
  return setCellHighlighted(cell, false);
}

export function cleanAllCellsHighlighted(cells: Cell[]): boolean {
  return setAllCellsHighlighted(cells, false);
}

export function setDigitHighlighted(
  cells: Cell[],
  digit: number,
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (const cell of cells) {
      if (!hasDigit(cell, digit)) {
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (const cell of cells) {
      if (setCellHighlighted(cell, highlighted, digit)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function setRowHighlighted(
  cells: Cell[],
  row: number,
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (const cell of cells) {
      if (cell.position.row !== row) {
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (const cell of cells) {
      if (cell.position.row === row) {
        if (setCellHighlighted(cell, highlighted)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function setColHighlighted(
  cells: Cell[],
  col: number,
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    for (const cell of cells) {
      if (cell.position.col !== col) {
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (const cell of cells) {
      if (cell.position.col === col) {
        if (setCellHighlighted(cell, highlighted)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function setBoxHighlighted(
  cells: Cell[],
  box: number,
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (const cell of cells) {
      if (cell.position.box !== box) {
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (const cell of cells) {
      if (cell.position.box === box) {
        if (setCellHighlighted(cell, highlighted)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function setXYHighlighted(
  cells: Cell[],
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    // 如果是联合选择，针对未命中的格子反向设置
    for (const cell of cells) {
      if (cell.candidates?.length !== 2) {
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (const cell of cells) {
      if (cell.candidates?.length === 2) {
        if (setCellHighlighted(cell, highlighted)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function highlightSelected(
  cells: Cell[],
  highlighted: boolean = true,
  isJoin: boolean = false
): boolean {
  let changed = false;
  if (isJoin) {
    for (const cell of cells) {
      if (!checkSelected(cell)) {
        if (setCellHighlighted(cell, !highlighted)) {
          changed = true;
        }
      }
    }
  } else {
    for (const cell of cells) {
      if (checkSelected(cell)) {
        if (setCellHighlighted(cell, highlighted)) {
          changed = true;
        }
      }
    }
  }
  return changed;
}
