import {
  getBoxCells,
  getBoxIndex,
  getRelatedCells,
  getRelatedPositions,
  hasCandidate,
  hasDigit,
  isRelated,
  removeCandidate,
  removeCandidates,
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
  if (positions.length === 0) {
    return [];
  }
  let commonRelatedPositionSet: Set<number> = new Set(
    getRelatedPositions(positions[0].row, positions[0].col).map((p) => p.row * 9 + p.col)
  );
  for (const position of positions.slice(1)) {
    const relations = new Set(
      getRelatedPositions(position.row, position.col).map((pos) => pos.row * 9 + pos.col)
    );
    commonRelatedPositionSet = new Set(
      [...commonRelatedPositionSet].filter((pos) => relations.has(pos))
    );
  }
  return [...commonRelatedPositionSet].map((value) => ({
    row: Math.floor(value / 9),
    col: value % 9,
    box: getBoxIndex(Math.floor(value / 9), value % 9),
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
  console.log('removeChangeCandidate same digit', head, tail, commonPositions);
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

export function WWingsInRow(
  cells: Cell[][],
  digit: Digit,
  row: number,
  position1: Position,
  position2: Position
): [boolean, string] {
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  if (positionEq(position1, position2)) {
    return [
      false,
      `(${position1.row},${position1.col}) is equal to (${position2.row},${position2.col})`,
    ];
  }
  if (position1.row === row) {
    return [false, `(${position1.row},${position1.col}) should not in row ${row}`];
  }
  if (position2.row === row) {
    return [false, `(${position2.row},${position2.col}) should not in row ${row}`];
  }
  if (cell1.candidates?.length !== 2) {
    return [false, `(${position1.row},${position1.col}) candidates length is not 2`];
  }
  if (cell2.candidates?.length !== 2) {
    return [false, `(${position2.row},${position2.col}) candidates length is not 2`];
  }
  const unionCandidates = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell2.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates.size !== 2) {
    return [
      false,
      `(${position1.row},${position1.col}) and (${position2.row},${position2.col}) should have same candidates`,
    ];
  }
  if (!unionCandidates.has(digit)) {
    return [
      false,
      `(${position1.row},${position1.col}) and (${position2.row},${position2.col}) should have digit ${digit}`,
    ];
  }
  const relatedCells1OfDigit1 = getRelatedCells(cells, position1.row, position1.col).filter(
    (c) => c.position.row === row && hasCandidate(c, digit)
  );
  const relatedCells2OfDigit1 = getRelatedCells(cells, position2.row, position2.col).filter(
    (c) => c.position.row === row && hasCandidate(c, digit) && !relatedCells2OfDigit1.includes(c)
  );

  const digit2 = [...unionCandidates].filter((d) => d !== digit)[0];

  if (
    relatedCells1OfDigit1.length > 0 &&
    relatedCells2OfDigit1.length > 0 &&
    isSuperLink(
      cells,
      relatedCells1OfDigit1.map((c) => c.position),
      digit,
      relatedCells2OfDigit1.map((c) => c.position),
      digit
    ) === 2
  ) {
    if (
      removeChainCandidateByEndpoint(
        cells,
        {
          positions: [position1],
          digit: digit2,
        },
        {
          positions: [position2],
          digit: digit2,
        }
      )
    ) {
      return [true, ''];
    }
  }
  return [false, '不是有效的W-Wings'];
}

export function WWingsInCol(
  cells: Cell[][],
  digit: Digit,
  col: number,
  position1: Position,
  position2: Position
): [boolean, string] {
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  if (positionEq(position1, position2)) {
    return [
      false,
      `(${position1.row},${position1.col}) is equal to (${position2.row},${position2.col})`,
    ];
  }
  if (position1.col === col) {
    return [false, `(${position1.row},${position1.col}) should not in col ${col}`];
  }
  if (position2.col === col) {
    return [false, `(${position2.row},${position2.col}) should not in col ${col}`];
  }
  if (cell1.candidates?.length !== 2) {
    return [false, `(${position1.row},${position1.col}) candidates length is not 2`];
  }
  if (cell2.candidates?.length !== 2) {
    return [false, `(${position2.row},${position2.col}) candidates length is not 2`];
  }
  const unionCandidates = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell2.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates.size !== 2) {
    return [
      false,
      `(${position1.row},${position1.col}) and (${position2.row},${position2.col}) should have same candidates`,
    ];
  }
  if (!unionCandidates.has(digit)) {
    return [
      false,
      `(${position1.row},${position1.col}) and (${position2.row},${position2.col}) should have digit ${digit}`,
    ];
  }
  const relatedCells1OfDigit1 = getRelatedCells(cells, position1.row, position1.col).filter(
    (c) => c.position.col === col && hasCandidate(c, digit)
  );
  const relatedCells2OfDigit1 = getRelatedCells(cells, position2.row, position2.col).filter(
    (c) => c.position.col === col && hasCandidate(c, digit) && !relatedCells1OfDigit1.includes(c)
  );

  const digit2 = [...unionCandidates].filter((d) => d !== digit)[0];

  if (
    relatedCells1OfDigit1.length > 0 &&
    relatedCells2OfDigit1.length > 0 &&
    isSuperLink(
      cells,
      relatedCells1OfDigit1.map((c) => c.position),
      digit,
      relatedCells2OfDigit1.map((c) => c.position),
      digit
    ) === 2
  ) {
    if (
      removeChainCandidateByEndpoint(
        cells,
        {
          positions: [position1],
          digit: digit2,
        },
        {
          positions: [position2],
          digit: digit2,
        }
      )
    ) {
      return [true, ''];
    }
  }
  return [false, '不是有效的W-Wings'];
}

export function WWingsInBox(
  cells: Cell[][],
  digit: Digit,
  box: number,
  position1: Position,
  position2: Position
): [boolean, string] {
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  if (positionEq(position1, position2)) {
    return [
      false,
      `(${position1.row},${position1.col}) is equal to (${position2.row},${position2.col})`,
    ];
  }
  if (position1.box === box) {
    return [false, `(${position1.row},${position1.col}) should not in box ${box}`];
  }
  if (position2.box === box) {
    return [false, `(${position2.row},${position2.col}) should not in box ${box}`];
  }
  if (cell1.candidates?.length !== 2) {
    return [false, `(${position1.row},${position1.col}) candidates length is not 2`];
  }
  if (cell2.candidates?.length !== 2) {
    return [false, `(${position2.row},${position2.col}) candidates length is not 2`];
  }
  const unionCandidates = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell2.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates.size !== 2) {
    return [
      false,
      `(${position1.row},${position1.col}) and (${position2.row},${position2.col}) should have same candidates`,
    ];
  }
  if (!unionCandidates.has(digit)) {
    return [
      false,
      `(${position1.row},${position1.col}) and (${position2.row},${position2.col}) should have digit ${digit}`,
    ];
  }
  const relatedCells1OfDigit1 = getRelatedCells(cells, position1.row, position1.col).filter(
    (c) => c.position.box === box && hasCandidate(c, digit)
  );
  const relatedCells2OfDigit1 = getRelatedCells(cells, position2.row, position2.col).filter(
    (c) => c.position.box === box && hasCandidate(c, digit) && !relatedCells1OfDigit1.includes(c)
  );

  console.log('WWingsInBox', relatedCells1OfDigit1, relatedCells2OfDigit1);

  const digit2 = [...unionCandidates].filter((d) => d !== digit)[0];

  if (
    relatedCells1OfDigit1.length > 0 &&
    relatedCells2OfDigit1.length > 0 &&
    isSuperLink(
      cells,
      relatedCells1OfDigit1.map((c) => c.position),
      digit,
      relatedCells2OfDigit1.map((c) => c.position),
      digit
    ) === 2
  ) {
    if (
      removeChainCandidateByEndpoint(
        cells,
        {
          positions: [position1],
          digit: digit2,
        },
        {
          positions: [position2],
          digit: digit2,
        }
      )
    ) {
      return [true, ''];
    }
  }
  return [false, '不是有效的W-Wings'];
}

export function XYWings(
  cells: Cell[][],
  position1: Position,
  position2: Position,
  position3: Position
): [boolean, string] {
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  const cell3 = cells[position3.row][position3.col];
  if (
    cell1.candidates?.length !== 2 ||
    cell2.candidates?.length !== 2 ||
    cell3.candidates?.length !== 2
  ) {
    return [false, 'XYWings需要每个格子2个候选数'];
  }
  const unionCandidates12 = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell2.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates12.size !== 3) {
    return [false, 'XYWings的1、2格子候选数并集必需是3个候选数'];
  }
  const unionCandidates23 = new Set([
    ...cell2.candidates.map((c) => c.digit),
    ...cell3.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates23.size !== 3) {
    return [false, 'XYWings的1、3格子候选数并集必需是3个候选数'];
  }
  const unionCandidates13 = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell3.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates13.size !== 3) {
    return [false, 'XYWings的1、3格子候选数并集必需是3个候选数'];
  }
  const unionCandidates123 = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell2.candidates.map((c) => c.digit),
    ...cell3.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates123.size !== 3) {
    return [false, 'XYWings的1、2、3格子候选数并集必需是3个候选数'];
  }
  const isRelated12 = isRelated(position1, position2);
  const isRelated23 = isRelated(position2, position3);
  const isRelated13 = isRelated(position1, position3);
  if (isRelated12 && isRelated23 && isRelated13) {
    // naked triple
    const relatedPositions1 = getRelatedPositions(position1.row, position1.col);
    const relatedPositions2 = getRelatedPositions(position2.row, position2.col);
    const relatedPositions3 = getRelatedPositions(position3.row, position3.col);
    const relatedPositions = relatedPositions1.filter(
      (pos) => relatedPositions2.includes(pos) && relatedPositions3.includes(pos)
    );
    if (relatedPositions.length >= 0) {
      let changed = false;
      for (const pos of relatedPositions) {
        const preCnt = cells[pos.row][pos.col].candidates?.length || 0;
        removeCandidates(cells[pos.row][pos.col], [...unionCandidates123]);
        if (preCnt !== cells[pos.row][pos.col].candidates?.length || 0) {
          changed = true;
        }
      }
      if (changed) {
        return [true, ''];
      }
    }
    return [false, '裸三数对，没有有效的候选数被删除'];
  }
  let relationShipCnt = 0;
  if (isRelated12) {
    relationShipCnt++;
  }
  if (isRelated23) {
    relationShipCnt++;
  }
  if (isRelated13) {
    relationShipCnt++;
  }
  if (relationShipCnt !== 2) {
    return [false, 'XY-Wings需要有2对弱关系'];
  }
  let wingCell1 = cell1;
  let wingCell2 = cell2;
  if (!isRelated23) {
    wingCell1 = cell3;
  } else if (!isRelated13) {
    wingCell2 = cell3;
  }

  const digit = wingCell1.candidates.filter((c) =>
    wingCell2.candidates.some((c2) => c2.digit === c.digit)
  )[0].digit;
  if (
    removeChainCandidateByEndpoint(
      cells,
      { positions: [wingCell1.position], digit },
      { positions: [wingCell2.position], digit }
    )
  ) {
    return [true, ''];
  }
  return [false, '没有有效的候选数被删除'];
}

export function WeakXYWings(
  cells: Cell[][],
  position1: Position,
  position2: Position,
  position3: Position
): [boolean, string] {
  const cell1 = cells[position1.row][position1.col];
  const cell2 = cells[position2.row][position2.col];
  const cell3 = cells[position3.row][position3.col];
  const cell3s = [cell1, cell2, cell3];
  let count3 = 0;
  let rootCellIndex = -1;
  let count2 = 0;
  for (const [index, cell] of cell3s.entries()) {
    if (cell.candidates?.length === 3) {
      count3++;
      rootCellIndex = index;
    }
    if (cell.candidates?.length === 2) {
      count2++;
    }
  }
  if (count3 !== 1 || count2 !== 2) {
    return [false, 'Weak-XY-Wing 需要一个格子满足3个候选数，两个格子满足2个候选数'];
  }
  const wingCells = cell3s.filter((_, index) => index !== rootCellIndex);
  const rootCell = cell3s[rootCellIndex];
  const wingCandidates = new Set([
    ...wingCells[0].candidates!.map((c) => c.digit),
    ...wingCells[1].candidates!.map((c) => c.digit),
  ]);
  if (wingCandidates.size !== 3) {
    return [false, 'Weak-XY-Wing 需要两个翼候选数并集是3个候选数'];
  }
  const totalCandidates = new Set([...wingCandidates, ...rootCell.candidates!.map((c) => c.digit)]);
  if (totalCandidates.size !== 3) {
    return [false, 'Weak-XY-Wing 需要三个格子的候选数并集是3个候选数'];
  }
  console.log('WeakXYWings', { rootCell, wingCells });
  const isRelated12 = isRelated(rootCell.position!, wingCells[0].position!);
  const isRelated13 = isRelated(rootCell.position!, wingCells[1].position!);
  const isRelated23 = isRelated(wingCells[0].position!, wingCells[1].position!);
  const relatedPositions1 = getRelatedPositions(position1.row, position1.col);
  const relatedPositions2 = getRelatedPositions(position2.row, position2.col);
  const relatedPositions3 = getRelatedPositions(position3.row, position3.col);
  const relatedPositions = relatedPositions1.filter(
    (pos) => relatedPositions2.some(p => p.row === pos.row && p.col === pos.col) && relatedPositions3.some(p => p.row === pos.row && p.col === pos.col)
  );
  if (isRelated12 && isRelated13 && isRelated23) {
    // naked triple
    if (relatedPositions.length >= 0) {
      let changed = false;
      for (const pos of relatedPositions) {
        const preCnt = cells[pos.row][pos.col].candidates?.length || 0;
        removeCandidates(cells[pos.row][pos.col], [...totalCandidates]);
        if (preCnt !== cells[pos.row][pos.col].candidates?.length || 0) {
          changed = true;
        }
      }
      if (changed) {
        return [true, ''];
      }
    }
    return [false, '裸三数对，没有有效的候选数被删除'];
  }
  if (!isRelated12 || !isRelated13) {
    return [false, 'Weak-XY-Wing 需要两个翼格子分别和根节点处于弱关系'];
  }
  const digit = rootCell.candidates!.filter(
    (c) =>
      wingCells[0].candidates?.some((c2) => c2.digit === c.digit) &&
      wingCells[1].candidates?.some((c2) => c2.digit === c.digit)
  )[0].digit;
  console.log('WeakXyWings', {digit, relatedPositions})
  if (relatedPositions.length >= 0) {
    let changed = false;
    for (const pos of relatedPositions) {
      const preCnt = cells[pos.row][pos.col].candidates?.length || 0;
      removeCandidates(cells[pos.row][pos.col], [digit]);
      if (preCnt !== cells[pos.row][pos.col].candidates?.length || 0) {
        changed = true;
      }
    }
    if (changed) {
      return [true, ''];
    }
  }
  return [false, 'Weak-XY-Wings 没有有效的候选数被删除'];
}
