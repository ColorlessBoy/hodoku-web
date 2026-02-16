import { getBoxCells, hasCandidate, hasDigit } from './basic';
import { Cell, Digit, Position, SuperLink } from './types';

export function isStrongLink(
  cells: Cell[][],
  position1: Position,
  digit1: Digit,
  position2: Position,
  digit2: Digit
): [boolean, string] {
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  if (!hasCandidate(cell1, digit1) || !hasCandidate(cell2, digit2)) {
    return [false, '数都不在格子的candidates中'];
  }
  if (digit1 !== digit2) {
    // 异数链
    if (cell1 === cell2 && cell1.candidates.length === 2) {
      // 前面验证过两个数都在cell的candidates中，所以这里一定是两个不同的数
      return [true, ''];
    }
    return [false, '异数强链不成立'];
  }
  // 同数链
  if (position1.row === position2.row && position1.col === position2.col) {
    // 自己和自己不成链
    return [false, '自己和自己不成链'];
  }
  if (position1.row === position2.row) {
    // 可以尝试是否在同一行内成强链
    const row = position1.row;
    let cnt = 0;
    for (let c = 0; c < 9; c++) {
      const cell = cells[row][c];
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === 2) {
      return [true, ''];
    }
  }
  if (position1.col === position2.col) {
    // 可以尝试是否在同一列内成强链
    const col = position1.col;
    let cnt = 0;
    for (let r = 0; r < 9; r++) {
      const cell = cells[r][col];
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === 2) {
      return [true, ''];
    }
  }
  if (position1.box === position2.box) {
    // 可以尝试是否在同一宫内成强链
    const box = position1.box;
    let cnt = 0;
    for (const cell of getBoxCells(cells, box)) {
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === 2) {
      return [true, ''];
    }
  }
  return [false, '同数强链不成立'];
}

export function isWeakLink(
  cells: Cell[][],
  position1: Position,
  digit1: Digit,
  position2: Position,
  digit2: Digit
): [boolean, string] {
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  if (!hasCandidate(cell1, digit1) || !hasCandidate(cell2, digit2)) {
    return [false, '数都不在格子的candidates中'];
  }
  if (digit1 !== digit2) {
    // 异数链
    if (positionEq(position1, position2)) {
      // 前面验证过两个数都在cell的candidates中，所以这里一定是两个不同的数
      return [true, ''];
    }
    return [false, '异数弱链不成立'];
  }
  // 同数链
  if (positionEq(position1, position2)) {
    // 自己和自己不成链
    return [false, '自己和自己不成链'];
  }
  if (
    position1.row === position2.row ||
    position1.col === position2.col ||
    position1.box === position2.box
  ) {
    return [true, ''];
  }
  return [false, '同数弱链不成立'];
}

export function positionEq(pos1: Position, pos2: Position): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

export function normalizePositions(
  positions: Position[],
  usedPositions: Position[] = undefined
): Position[] {
  const positionSet: Set<number> = new Set(
    usedPositions?.map((pos) => pos.row * 9 + pos.col) || []
  );
  const newPositions: Position[] = [];
  for (const position of positions) {
    const code = position.row * 9 + position.col;
    if (positionSet.has(code)) {
      continue;
    }
    positionSet.add(code);
    newPositions.push(position);
  }
  return newPositions;
}

export function isSuperStrongLink(
  cells: Cell[][],
  positions1: Position[],
  digit1: Digit,
  positions2: Position[],
  digit2: Digit
): [boolean, string] {
  // 检查positions1和positions2是否有且只有一个位置上有digit1
  const normPositions1 = normalizePositions(positions1);
  if (normPositions1.length === 0) {
    return [false, 'position1不能为空'];
  }
  for (const position of normPositions1) {
    const cell = cells[position.row][position.col];
    if (!hasCandidate(cell, digit1)) {
      return [false, `位置${position.row + 1},${position.col + 1}上没有${digit1}`];
    }
  }
  const normPositions2 = normalizePositions(positions2, normPositions1);
  if (normPositions2.length === 0) {
    return [false, 'position2不能为空'];
  }
  for (const position of normPositions2) {
    const cell = cells[position.row][position.col];
    if (!hasCandidate(cell, digit2)) {
      return [false, `位置${position.row + 1},${position.col + 1}上没有${digit2}`];
    }
  }
  if (digit1 !== digit2) {
    // 异数链
    if (
      normPositions1.length === 1 &&
      normPositions2.length === 1 &&
      positionEq(normPositions1[0], normPositions2[0]) &&
      cells[normPositions1[0].row][normPositions1[0].col].candidates?.length === 2
    ) {
      // 前面验证过两个数都在cell的candidates中，所以这里一定是两个不同的数
      return [true, ''];
    }
    return [false, '异数强链条件不满足'];
  }
  // 同数链
  const position0 = normPositions1[0];
  const normPositions = [...normPositions1, ...normPositions2];
  let inSameRow = true;
  let inSameCol = true;
  let inSameBox = true;
  for (const position of normPositions) {
    if (position.row !== position0.row) {
      inSameRow = false;
    }
    if (position.col !== position0.col) {
      inSameCol = false;
    }
    if (position.box !== position0.box) {
      inSameBox = false;
    }
  }
  if (inSameRow) {
    // 可以尝试是否在同一行内成强链
    let cnt = 0;
    for (let c = 0; c < 9; c++) {
      const cell = cells[position0.row][c];
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === normPositions.length) {
      return [true, ''];
    }
  }
  if (inSameCol) {
    // 可以尝试是否在同一列内成强链
    let cnt = 0;
    for (let r = 0; r < 9; r++) {
      const cell = cells[r][position0.col];
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === normPositions.length) {
      return [true, ''];
    }
  }
  if (inSameBox) {
    // 可以尝试是否在同一宫内成强链
    let cnt = 0;
    for (const cell of getBoxCells(cells, position0.box)) {
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === normPositions.length) {
      return [true, ''];
    }
  }
  return [false, '同数强链条件不满足'];
}

export function isSuperWeakLink(
  cells: Cell[][],
  positions1: Position[],
  digit1: Digit,
  positions2: Position[],
  digit2: Digit
): [boolean, string] {
  // 检查positions1和positions2是否有且只有一个位置上有digit1
  const normPositions1 = normalizePositions(positions1);
  if (normPositions1.length === 0) {
    return [false, 'position1不能为空'];
  }
  for (const position of normPositions1) {
    const cell = cells[position.row][position.col];
    if (!hasCandidate(cell, digit1)) {
      return [false, `位置${position.row + 1},${position.col + 1}上没有${digit1}`];
    }
  }
  const normPositions2 = normalizePositions(positions2, normPositions1);
  if (normPositions2.length === 0) {
    return [false, 'position2不能为空'];
  }
  for (const position of normPositions2) {
    const cell = cells[position.row][position.col];
    if (!hasCandidate(cell, digit2)) {
      return [false, `位置${position.row + 1},${position.col + 1}上没有${digit2}`];
    }
  }
  if (digit1 !== digit2) {
    // 异数链
    if (
      normPositions1.length === 1 &&
      normPositions2.length === 1 &&
      positionEq(normPositions1[0], normPositions2[0])
    ) {
      // 前面验证过两个数都在cell的candidates中，所以这里一定是两个不同的数
      return [true, ''];
    }
    return [false, '异数弱链条件不满足'];
  }
  // 同数链
  const position0 = normPositions1[0];
  const normPositions = [...normPositions1, ...normPositions2];
  let inSameRow = true;
  let inSameCol = true;
  let inSameBox = true;
  for (const position of normPositions) {
    if (position.row !== position0.row) {
      inSameRow = false;
    }
    if (position.col !== position0.col) {
      inSameCol = false;
    }
    if (position.box !== position0.box) {
      inSameBox = false;
    }
  }
  if (inSameRow || inSameCol || inSameBox) {
    return [true, ''];
  }
  return [false, '同数弱链条件不满足'];
}

// 0 不是链；1 弱链；2 强链
export function isSuperLink(
  cells: Cell[][],
  positions1: Position[],
  digit1: Digit,
  positions2: Position[],
  digit2: Digit
): number {
  // 检查positions1和positions2是否有且只有一个位置上有digit1
  const normPositions1 = normalizePositions(positions1);
  if (normPositions1.length === 0) {
    return 0;
  }
  for (const position of normPositions1) {
    const cell = cells[position.row][position.col];
    if (!hasCandidate(cell, digit1)) {
      return 0;
    }
  }
  const normPositions2 = normalizePositions(positions2, normPositions1);
  if (normPositions2.length === 0) {
    return 0;
  }
  for (const position of normPositions2) {
    const cell = cells[position.row][position.col];
    if (!hasCandidate(cell, digit2)) {
      return 0;
    }
  }
  if (digit1 !== digit2) {
    // 异数链
    if (
      normPositions1.length === 1 &&
      normPositions2.length === 1 &&
      positionEq(normPositions1[0], normPositions2[0])
    ) {
      if (cells[normPositions1[0].row][normPositions1[0].col].candidates?.length === 2) {
        // 是异数强链
        return 2;
      }
      // 异数弱链
      return 1;
    }
    return 0;
  }
  // 同数链
  const position0 = normPositions1[0];
  const normPositions = [...normPositions1, ...normPositions2];
  let inSameRow = true;
  let inSameCol = true;
  let inSameBox = true;
  for (const position of normPositions) {
    if (position.row !== position0.row) {
      inSameRow = false;
    }
    if (position.col !== position0.col) {
      inSameCol = false;
    }
    if (position.box !== position0.box) {
      inSameBox = false;
    }
  }
  if (inSameRow) {
    // 可以尝试是否在同一行内成强链
    let cnt = 0;
    for (let c = 0; c < 9; c++) {
      const cell = cells[position0.row][c];
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === normPositions.length) {
      // 强链
      return 2;
    }
  }
  if (inSameCol) {
    // 可以尝试是否在同一列内成强链
    let cnt = 0;
    for (let r = 0; r < 9; r++) {
      const cell = cells[r][position0.col];
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === normPositions.length) {
      // 强链
      return 2;
    }
  }
  if (inSameBox) {
    // 可以尝试是否在同一宫内成强链
    let cnt = 0;
    for (const cell of getBoxCells(cells, position0.box)) {
      if (hasDigit(cell, digit1)) {
        cnt++;
      }
    }
    if (cnt === normPositions.length) {
      // 强链
      return 2;
    }
  }
  if (inSameRow || inSameCol || inSameBox) {
    // 弱链
    return 1;
  }
  // 不是链
  return 0;
}

export function buildChain(
  cells: Cell[][],
  positions: Position[][],
  digits: Digit[]
): [SuperLink[], string] {
  // 检查positions和digits是否对应
  if (positions.length !== digits.length) {
    return [[], 'positions和digits数量不一致'];
  }
  const links: SuperLink[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const flag = isSuperLink(cells, positions[i], digits[i], positions[i + 1], digits[i + 1]);
    if (flag === 0) {
      return [
        links,
        `(${positions[i]}:${digits[i]})和(${positions[i + 1]}:${digits[i + 1]})不成链`,
      ];
    }
    links.push({
      from: {
        positions: positions[i],
        digit: digits[i],
      },
      to: {
        positions: positions[i + 1],
        digit: digits[i + 1],
      },
      isStrong: flag === 2,
    });
  }
  return [links, ''];
}

export function excludeCandidateByChain(cells: Cell[][], links: SuperLink[]): boolean {
  return false;
}
