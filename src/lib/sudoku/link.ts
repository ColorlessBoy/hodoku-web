import {
  getBoxCells,
  getBoxIndex,
  getRelatedPositions,
  hasCandidate,
  hasDigit,
  removeCandidate,
} from './basic';
import { Cell, Digit, LinkEndpoint, Position, SuperLink, SuperLinkEndpoint } from './types';

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
  newPositions.sort((a, b) => a.row * 9 + a.col - b.row * 9 - b.col);
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
  const normPositions2 =
    digit1 == digit2
      ? normalizePositions(positions2, normPositions1)
      : normalizePositions(positions2);
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

export function buildXChain(
  cells: Cell[][],
  positions: Position[],
  digit: Digit
): [SuperLink[], string] {
  return buildChain(
    cells,
    positions.map((pos) => [pos]),
    positions.map((pos) => digit)
  );
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

export function getCommonRelatedPositions(positions: Position[]): Position[] {
  let commonRelatedPositionSet: Set<number> = new Set();
  for (const position of positions) {
    const relations = new Set(
      getRelatedPositions(position.row, position.col).map((pos) => pos.row * 10 + pos.col)
    );
    commonRelatedPositionSet = new Set(
      [...commonRelatedPositionSet].filter((pos) => relations.has(pos))
    );
  }
  return [...commonRelatedPositionSet].map((value) => ({
    row: Math.floor(value / 10),
    col: value % 10,
    box: getBoxIndex(Math.floor(value / 10), value % 10),
  }));
}

export function getCommonRelatedCells(cells: Cell[][], positions: Position[]): Cell[] {
  return getCommonRelatedPositions(positions).map((pos) => cells[pos.row][pos.col]);
}

function removeChainCandidateByEndpoint(
  cells: Cell[][],
  head: SuperLinkEndpoint,
  tail: SuperLinkEndpoint
): [boolean, string] {
  if (head.digit !== tail.digit) {
    // 异数链，如果在同一格
    if (head.positions.length !== 1 || tail.positions.length !== 1) {
      return [false, '异数链首尾不支持多格'];
    }
    if (positionEq(head.positions[0], tail.positions[0])) {
      // 异数链在同一格
      const cell = cells[head.positions[0].row][head.positions[0].col];
      const changed = cell.candidates?.length > 2;
      if (!changed) {
        return [false, '异数链没有候选数可删'];
      }
      cell.candidates?.filter((c) => c.digit !== head.digit && c.digit !== tail.digit);
    } else {
      // 异数链不在同一格
      const headCell = cells[head.positions[0].row][head.positions[0].col];
      const tailCell = cells[head.positions[0].row][head.positions[0].col];
      let changed = false;
      if (hasCandidate(headCell, tail.digit)) {
        removeCandidate(headCell, tail.digit);
        changed = true;
      }
      if (hasCandidate(tailCell, head.digit)) {
        removeCandidate(tailCell, head.digit);
        changed = true;
      }
      if (!changed) {
        return [false, `没有候选数可删除`];
      }
    }
    return [true, ''];
  }
  // 同数链，必定不在同一格
  const commonPositions = getCommonRelatedPositions([...head.positions, ...tail.positions]);
  const digit = head.digit;
  let changed = false;
  for (const position of commonPositions) {
    const cell = cells[position.row][position.col];
    if (hasCandidate(cell, head.digit)) {
      removeCandidate(cell, digit);
      changed = true;
    }
  }
  if (!changed) {
    return [false, '没有移除的候选数'];
  }
  return [true, ''];
}

export function removeCandidatesByChains(cells: Cell[][], links: SuperLink[]): [boolean, string] {
  // links is build by buildChain, so we don't need to check link's internal conditions.
  // check weak-strong condition first (external condition)
  if (links.length % 2 === 0) {
    return [false, '强链开始强链结束，所以强弱链总数必须为奇数'];
  }
  for (let i = 0; i < links.length - 1; i++) {
    const link = links[i];
    const mustBeStrong = i % 2 === 0;
    if (mustBeStrong && !link.isStrong) {
      return [
        false,
        `弱链(${link.from.positions}:${link.from.digit})和(${link.to.positions}:${link.to.digit})不能成强链`,
      ];
    }
  }
  const head = links[0].from;
  const tail = links[links.length - 1].to;
  if (isSuperLink(cells, head.positions, head.digit, tail.positions, tail.digit) > 0) {
    // 数环
    // 需要找到第一个弱链
    let weakLinkIndex = -1;
    for (let i = 0; i < links.length - 1; i++) {
      if (!links[i].isStrong) {
        weakLinkIndex = i;
        break;
      }
    }
    if (weakLinkIndex === -1) {
      // 任何链都能当做弱链
      let totalChanged = false;
      let totalMsg = '';
      for (let i = 0; i < links.length - 1; i += 2) {
        const link = links[i];
        const [changed, msg] = removeChainCandidateByEndpoint(cells, link.from, link.to);
        if (changed) {
          totalChanged = true;
        } else {
          totalMsg += '\n' + msg;
        }
      }
      return totalChanged ? [true, totalMsg] : [false, ''];
    } else {
      // 每隔一个就是一个弱链
      let totalChanged = false;
      let totalMsg = '';
      for (; weakLinkIndex < links.length - 1; weakLinkIndex += 2) {
        const link = links[weakLinkIndex];
        const [changed, msg] = removeChainCandidateByEndpoint(cells, link.from, link.to);
        if (changed) {
          totalChanged = true;
        } else {
          totalMsg += '\n' + msg;
        }
      }
      return totalChanged ? [true, ''] : [totalChanged, totalMsg];
    }
  }
  const [changed, msg] = removeChainCandidateByEndpoint(cells, head, tail);
  if (!changed) {
    return [false, msg];
  }
  return [true, ''];
}
