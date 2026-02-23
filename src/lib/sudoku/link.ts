import { link } from 'fs';
import {
  cloneCells,
  getIndexByRowCol,
  getRelatedCells,
  getRelatedPositions,
  hasCandidate,
  isRelatedPositions,
  removeCandidate,
  removeCandidates,
} from './basic';
import { Cell, Position, Link, LinkNode } from './types';

export function positionEq(pos1: Position, pos2: Position): boolean {
  return pos1.index === pos2.index;
}

export function normalizePositions(positions: Position[]): Position[] {
  // position 是从同一个object件创建的，所以可以直接用 Set 去重
  const newPositions = Array.from(new Set(positions));
  newPositions.sort((a, b) => a.index - b.index);
  return newPositions;
}

function normalizeLinkNode(cells: Cell[], linkNode: LinkNode): LinkNode | undefined {
  const normPositions = normalizePositions(linkNode.positions);
  if (normPositions.length === 0) return undefined;
  for (const position of normPositions) {
    const cell = cells[position.index];
    if (!hasCandidate(cell, linkNode.digit)) {
      return undefined;
    }
  }
  return {
    digit: linkNode.digit,
    positions: normPositions,
  };
}

// 目前只支持普通链，暂时不支持 ALS 和 AUR 链
// 0 不是链；1 弱链；2 强链
export function checkLinkType(cells: Cell[], linkNode1: LinkNode, linkNode2: LinkNode): number {
  // 检查positions1和positions2是否有且只有一个位置上有digit1
  const normNode1 = normalizeLinkNode(cells, linkNode1);
  if (normNode1 === undefined) {
    return 0;
  }
  const normNode2 = normalizeLinkNode(cells, linkNode2);
  if (normNode2 === undefined) {
    return 0;
  }
  if (linkNode1.digit !== linkNode2.digit) {
    // 异数链
    if (
      normNode1.positions.length === 1 &&
      normNode2.positions.length === 1 &&
      positionEq(normNode1.positions[0], normNode2.positions[0])
    ) {
      if (cells[normNode1.positions[0].index].candidates?.length === 2) {
        // 是异数强链
        return 2;
      }
      // 异数弱链
      return 1;
    }
    return 0;
  }
  // 同数链
  const position0 = normNode1.positions[0];
  const normPositions = Array.from(new Set([...normNode1.positions, ...normNode2.positions]));
  if (normNode1.positions.length + normNode2.positions.length !== normPositions.length) {
    return 0; // 有重复位置，不是同数链
  }
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
    for (const cell of cells) {
      if (cell.position.row === position0.row && hasCandidate(cell, linkNode1.digit)) {
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
    for (const cell of cells) {
      if (cell.position.col === position0.col && hasCandidate(cell, linkNode1.digit)) {
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
    for (const cell of cells) {
      if (cell.position.box === position0.box && hasCandidate(cell, linkNode1.digit)) {
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

export function buildXChain(cells: Cell[], digit: number, positions: Position[]): [Link[], string] {
  return buildChain(
    cells,
    positions.map((pos) => ({
      positions: [pos],
      digit,
    }))
  );
}

export function buildChain(cells: Cell[], linkNodes: LinkNode[]): [Link[], string] {
  const links: Link[] = [];
  for (let i = 0; i < linkNodes.length - 1; i++) {
    const flag = checkLinkType(cells, linkNodes[i], linkNodes[i + 1]);
    if (flag === 0) {
      return [
        links,
        `(${linkNodes[i].positions[0]}:${linkNodes[i].digit})和(${linkNodes[i + 1].positions[0]}:${linkNodes[i + 1].digit})不成链`,
      ];
    }
    links.push({
      from: linkNodes[i],
      to: linkNodes[i + 1],
      isStrong: flag === 2,
      type: 'normal',
    });
  }
  return [links, ''];
}

function getCommonRelatedPositions(positions: Position[]): Position[] {
  if (positions.length === 0) {
    return [];
  }
  let commonRelatedPositions = getRelatedPositions(positions[0]);
  for (const position of positions) {
    const relatedPositions = getRelatedPositions(position);
    commonRelatedPositions = commonRelatedPositions.filter((pos) =>
      relatedPositions.some((p) => p.index === pos.index)
    );
  }
  return commonRelatedPositions;
}

function removeChainCandidateByEndpoint(
  cells: Cell[],
  head: LinkNode,
  tail: LinkNode
): [boolean, string] {
  if (head.digit !== tail.digit) {
    // 异数链，如果在同一格
    if (head.positions.length !== 1 || tail.positions.length !== 1) {
      return [false, '异数链首尾不支持多格'];
    }
    if (positionEq(head.positions[0], tail.positions[0])) {
      // 异数链在同一格
      const cell = cells[head.positions[0].index];
      const changed = cell.candidates?.length > 2;
      if (cell.candidates?.length <= 2) {
        return [false, '异数链没有候选数可删'];
      }
      cell.candidates = cell.candidates?.filter(
        (c) => c.digit === head.digit || c.digit !== tail.digit
      );
    } else {
      // 异数链不在同一格
      const headCell = cells[head.positions[0].index];
      const tailCell = cells[tail.positions[0].index];
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

export function removeCandidatesByChains(cells: Cell[], links: Link[]): [boolean, string] {
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
  const headTailLinkType = checkLinkType(cells, head, tail);
  if (headTailLinkType === 0) {
    const [changed, msg] = removeChainCandidateByEndpoint(cells, head, tail);
    if (!changed) {
      return [false, msg];
    }
  } else if (headTailLinkType === 1) {
    // 弱链首尾相连，形成数环
    // 每隔一个就是一个弱链
    let totalChanged = false;
    for (let weakLinkIndex = 1; weakLinkIndex < links.length; weakLinkIndex += 2) {
      const link = links[weakLinkIndex];
      const [changed, msg] = removeChainCandidateByEndpoint(cells, link.from, link.to);
      if (changed) {
        totalChanged = true;
      }
    }
    const [changed, _] = removeChainCandidateByEndpoint(cells, head, tail);
    if (changed) {
      totalChanged = true;
    }
    return totalChanged ? [true, ''] : [totalChanged, '形成数环但是没有移除任何候选数'];
  } else if (headTailLinkType === 2) {
    // 强链形成弱环
    let weakLinkIndex = -1;
    for (let i = 0; i < links.length - 1; i++) {
      if (!links[i].isStrong) {
        weakLinkIndex = i;
        break;
      }
    }
    if (weakLinkIndex === -1) {
      // 全部是强链
      let totalChanged = false;
      for (let i = 0; i < links.length - 1; i += 2) {
        const link = links[i];
        const [changed, _] = removeChainCandidateByEndpoint(cells, link.from, link.to);
        if (changed) {
          totalChanged = true;
        }
      }
      const [changed, _] = removeChainCandidateByEndpoint(cells, head, tail);
      if (changed) {
        totalChanged = true;
      }
      return totalChanged ? [true, ''] : [false, ''];
    } else {
      // 每隔一个就是一个弱链
      let totalChanged = false;
      if (weakLinkIndex % 2 === 0) {
        // 弱链在偶数位
        for (let weakLinkIndex = 0; weakLinkIndex < links.length; weakLinkIndex += 2) {
          const link = links[weakLinkIndex];
          const [changed, msg] = removeChainCandidateByEndpoint(cells, link.from, link.to);
          if (changed) {
            totalChanged = true;
          }
        }
      } else {
        // 弱链在奇数位
        for (let weakLinkIndex = 1; weakLinkIndex < links.length; weakLinkIndex += 2) {
          const link = links[weakLinkIndex];
          const [changed, msg] = removeChainCandidateByEndpoint(cells, link.from, link.to);
          if (changed) {
            totalChanged = true;
          }
        }
        const [changed, msg] = removeChainCandidateByEndpoint(cells, head, tail);
        if (changed) {
          totalChanged = true;
        }
      }
      return totalChanged ? [true, ''] : [false, '形成数环，但是没有可以删去的候选数'];
    }
  }
  return [true, ''];
}

export function findStrongLinkInRow(cells: Cell[], digit: number, row: number): Link | undefined {
  const digitPositions = cells
    .filter((cell) => cell.position.row === row && hasCandidate(cell, digit))
    .map((c) => c.position);
  if (digitPositions.length === 2) {
    return {
      from: { digit, positions: [digitPositions[0]] },
      to: { digit, positions: [digitPositions[1]] },
      isStrong: true,
      type: 'normal',
    };
  }
  const boxes = Array.from(new Set(digitPositions.map((p) => p.box)));
  if (boxes.length === 2) {
    return {
      from: {
        digit,
        positions: digitPositions.filter((p) => p.box === boxes[0]),
      },
      to: {
        digit,
        positions: digitPositions.filter((p) => p.box === boxes[1]),
      },
      isStrong: true,
      type: 'normal',
    };
  }
  return undefined;
}

export function findStrongLinkInCol(cells: Cell[], digit: number, col: number): Link | undefined {
  const digitPositions = cells
    .filter((cell) => cell.position.col === col && hasCandidate(cell, digit))
    .map((c) => c.position);
  if (digitPositions.length < 2) {
    return null;
  }
  if (digitPositions.length === 2) {
    return {
      from: { digit, positions: [digitPositions[0]] },
      to: { digit, positions: [digitPositions[1]] },
      isStrong: true,
      type: 'normal',
    };
  }
  const boxes = Array.from(new Set(digitPositions.map((p) => p.box)));
  if (boxes.length === 2) {
    return {
      from: {
        digit,
        positions: digitPositions.filter((p) => p.box === boxes[0]),
      },
      to: {
        digit,
        positions: digitPositions.filter((p) => p.box === boxes[1]),
      },
      isStrong: true,
      type: 'normal',
    };
  }
  return undefined;
}

// 行信息 + 列信息，-1表示不在同一行列
function isPositionsInSameLine(positions: Position[]): [number, number] {
  if (positions.length === 0) {
    return [-1, -1];
  }
  if (positions.length === 1) {
    return [-1, -1];
  }
  const rowSet = new Set(positions.map((p) => p.row));
  const colSet = new Set(positions.map((p) => p.col));
  return [
    rowSet.size === 1 ? rowSet.values().next().value : -1,
    colSet.size === 1 ? colSet.values().next().value : -1,
  ];
}
function linkNodeToString(linkNode: LinkNode): string {
  return `${linkNode.digit} ${linkNode.positions.map((p) => p.index).join(' ')}`;
}
function linkToString(link: Link): string {
  return `${linkNodeToString(link.from)};${linkNodeToString(link.to)}`;
}
function removeDuplicateLink(links: Link[]): Link[] {
  const linkSet = new Set<string>();
  const result: Link[] = [];
  for (const link of links) {
    if (linkSet.has(linkToString(link))) {
      result.push(link);
    }
    if (link.isStrong) {
      linkSet.add(`${linkNodeToString(link.from)};${linkNodeToString(link.to)}`);
      linkSet.add(`${linkNodeToString(link.to)};${linkNodeToString(link.from)}`);
    } else {
      linkSet.add(`${linkNodeToString(link.from)};${linkNodeToString(link.to)}`);
    }
  }
  return result;
}
export function findStrongLinkInBox(cells: Cell[], digit: number, box: number): Link[] {
  const digitPositions = cells
    .filter((cell) => cell.position.box === box && hasCandidate(cell, digit))
    .map((c) => c.position);
  if (digitPositions.length < 2) {
    return null;
  }
  if (digitPositions.length === 2) {
    return [
      {
        from: { digit, positions: [digitPositions[0]] },
        to: { digit, positions: [digitPositions[1]] },
        isStrong: true,
        type: 'normal',
      },
    ];
  }
  const links: Link[] = [];
  const rows = Array.from(new Set(digitPositions.map((p) => p.row)));
  for (const row of rows) {
    // 去除该行，检查剩余格子是否满足 group 条件
    const rowDigitPositions = digitPositions.filter((p) => p.row === row);
    const remainDigitPositions = digitPositions.filter((p) => p.row !== row);
    const [rowIndex, colIndex] = isPositionsInSameLine(remainDigitPositions);
    if (rowIndex !== -1 || colIndex !== -1) {
      links.push({
        from: {
          digit,
          positions: rowDigitPositions,
        },
        to: {
          digit,
          positions: remainDigitPositions,
        },
        isStrong: true,
        type: 'normal',
      });
    }
  }
  const cols = Array.from(new Set(digitPositions.map((p) => p.col)));
  for (const col of cols) {
    const rowDigitPositions = digitPositions.filter((p) => p.col === col);
    const remainDigitPositions = digitPositions.filter((p) => p.col !== col);
    if (isPositionsInSameLine(remainDigitPositions)) {
      links.push({
        from: {
          digit,
          positions: rowDigitPositions,
        },
        to: {
          digit,
          positions: remainDigitPositions,
        },
        isStrong: true,
        type: 'normal',
      });
    }
  }
  return removeDuplicateLink(links);
}
export function findStrongLinkInCell(cell: Cell, digit?: number): Link {
  if (
    cell.candidates?.length === 2 &&
    (digit === undefined || cell.candidates.some((c) => c.digit === digit))
  ) {
    let [d1, d2] = [cell.candidates[0].digit, cell.candidates[1].digit];
    if (d1 !== digit) {
      // digit === undefined 也没有问题
      d2 = d1;
      d1 = digit;
    }
    return {
      from: {
        digit: d1,
        positions: [cell.position],
      },
      to: {
        digit: d2,
        positions: [cell.position],
      },
      isStrong: true,
      type: 'normal',
    };
  }
  return undefined;
}

export function findStrongLink(
  cells: Cell[],
  digit: number,
  row?: number,
  col?: number,
  box?: number
): Link[] {
  const result: Link[] = [];
  if (row !== undefined && col !== undefined) {
    const link = findStrongLinkInCell(cells[getIndexByRowCol(row, col)], digit);
    if (link) {
      result.push(link);
    }
  } else if (row !== undefined) {
    const link = findStrongLinkInRow(cells, digit, row);
    if (link) {
      result.push(link);
    }
    return result;
  } else if (col !== undefined) {
    const link = findStrongLinkInCol(cells, digit, col);
    if (link) {
      result.push(link);
    }
    return result;
  } else if (box !== undefined) {
    const links = findStrongLinkInBox(cells, digit, box);
    return links;
  }
  return [];
}

export function chainAddStrongLinks(cells: Cell[], links: Link[], link2: Link): Link[] {
  if (links.length === 0) {
    throw new Error('connectStrongLinks: links is empty');
  }
  const head = links[0];
  const tail = links[links.length - 1];
  if (!head.isStrong && !tail.isStrong) {
    throw new Error('connectStrongLinks: links (head and tail) are all not strong');
  }
  if (!link2.isStrong) {
    throw new Error('connectStrongLinks: link2 is strong');
  }
  let linkType = checkLinkType(cells, tail.to, link2.from);
  if (linkType > 0) {
    return [
      ...links,
      { from: tail.to, to: link2.from, isStrong: linkType === 3, type: 'normal' },
      link2,
    ];
  }
  linkType = checkLinkType(cells, tail.to, link2.to);
  if (linkType > 0) {
    return [
      ...links,
      { from: tail.to, to: link2.to, isStrong: linkType === 3, type: 'normal' },
      { ...link2, from: link2.to, to: link2.from },
    ];
  }
  linkType = checkLinkType(cells, head.from, link2.to);
  if (linkType > 0) {
    return [
      link2,
      { from: link2.to, to: head.from, isStrong: linkType === 3, type: 'normal' },
      ...links,
    ];
  }
  linkType = checkLinkType(cells, head.from, link2.from);
  if (linkType > 0) {
    return [
      { ...link2, from: link2.to, to: link2.from },
      { from: link2.from, to: head.from, isStrong: linkType === 3, type: 'normal' },
      ...links,
    ];
  }
  return links;
}

export function constructWWing(
  cells: Cell[],
  position1: Position,
  position2: Position,
  digit: number,
  row?: number,
  col?: number,
  box?: number
): Link[] {
  if (row === undefined || col === undefined || box === undefined) {
    throw new Error('WWings: row, col and box are all undefined.');
  }
  const cell1 = cells[position1.index];
  const cell2 = cells[position2.index];
  if (positionEq(position1, position2)) {
    throw new Error('WWings: position1 and position2 cannot be the same');
  }
  if (cell1.candidates?.length !== 2) {
    throw new Error('WWings: cell1 candidates length is not 2');
  }
  if (cell2.candidates?.length !== 2) {
    throw new Error('WWings: cell2 candidates length is not 2');
  }
  const unionCandidates = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell2.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates.size !== 2) {
    throw new Error('WWings: cell1 and cell candidates are not same.');
  }
  const headLink = findStrongLinkInCell(cells[position1.index]);
  const tailLink = findStrongLinkInCell(cells[position2.index]);
  const links = findStrongLink(cells, digit, row, col, box);
  for (const link of links) {
    let chain = [link];
    chain = chainAddStrongLinks(cells, chain, headLink);
    chain = chainAddStrongLinks(cells, chain, tailLink);
    if (chain.length == 5) {
      return chain;
    }
  }
  throw new Error('Not valid w-wing.');
}

export function constructYWing(
  cells: Cell[],
  position1: Position,
  position2: Position,
  position3: Position
): Link[] {
  const cell1 = cells[position1.index];
  const cell2 = cells[position2.index];
  const cell3 = cells[position3.index];
  if (
    cell1.candidates?.length !== 2 ||
    cell2.candidates?.length !== 2 ||
    cell3.candidates?.length !== 2
  ) {
    throw new Error('XYWings: cells must have 2 candidates');
  }
  const unionCandidates12 = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell2.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates12.size !== 3) {
    throw new Error('XYWings: unionCandidates of cell1 and cell2 must be 3');
  }
  const unionCandidates23 = new Set([
    ...cell2.candidates.map((c) => c.digit),
    ...cell3.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates23.size !== 3) {
    throw new Error('XYWings: unionCandidates of cell2 and cell3 must be 3');
  }
  const unionCandidates13 = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell3.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates13.size !== 3) {
    throw new Error('XYWings: unionCandidates of cell1 and cell3 must be 3');
  }
  const unionCandidates123 = new Set([
    ...cell1.candidates.map((c) => c.digit),
    ...cell2.candidates.map((c) => c.digit),
    ...cell3.candidates.map((c) => c.digit),
  ]);
  if (unionCandidates123.size !== 3) {
    throw new Error('XYWings: unionCandidates of cell1, cell2 and cell3 must be 3');
  }
  const link1 = findStrongLinkInCell(cell1);
  const link2 = findStrongLinkInCell(cell2);
  const link3 = findStrongLinkInCell(cell3);
  let chain = [link1];
  chain = chainAddStrongLinks(cells, chain, link2);
  chain = chainAddStrongLinks(cells, chain, link3);
  if (chain.length !== 5) {
    throw new Error('XYWings: not valid y-wing.');
  }
  return chain;
}

export function removeCandidateButNewCells(cells: Cell[], index: number, digit: number) {
  const newCell = cloneCells(cells);
  removeCandidate(newCell[index], digit);
  return newCell;
}

// Almost Y-Wing
export function AlmostYWings(
  cells: Cell[],
  position1: Position,
  position2: Position,
  position3: Position
): Link[] | null {
  const cell1 = cells[position1.index];
  const cell2 = cells[position2.index];
  const cell3 = cells[position3.index];
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
    throw new Error('Almost-Y-Wing 需要一个格子满足3个候选数，两个格子满足2个候选数');
  }
  const wingCells = cell3s.filter((_, index) => index !== rootCellIndex);
  const rootCell = cell3s[rootCellIndex];
  const wingCandidates = new Set([
    ...wingCells[0].candidates!.map((c) => c.digit),
    ...wingCells[1].candidates!.map((c) => c.digit),
  ]);
  if (wingCandidates.size !== 3) {
    throw new Error('Almost-Y-Wing 需要两个翼候选数并集是3个候选数');
  }
  const totalCandidates = new Set([...wingCandidates, ...rootCell.candidates!.map((c) => c.digit)]);
  if (totalCandidates.size !== 3) {
    throw new Error('Almost-Y-Wing 需要三个格子的候选数并集是3个候选数');
  }
  let almostDigit = -1;
  for (const digit of totalCandidates) {
    let cnt = 0;
    for (const cell of cell3s) {
      if (hasCandidate(cell, digit)) {
        cnt++;
      }
    }
    if (cnt === 3) {
      almostDigit = digit;
      break;
    }
  }
  // 一定会有 almostDigit
  const newCell = removeCandidateButNewCells(cells, rootCellIndex, almostDigit);
  const links = constructYWing(newCell, position1, position2, position3);
  if (links.length !== 5) {
    throw new Error('Almost-Y-Wings 去掉 Almost 格子后，不成 Y-Wing');
  }
  return links;
}

export function isALS(cells: Cell[], positions: Position[]): boolean {
  if (positions.length === 0) {
    return false;
  }
  const alsCells = positions.map((pos) => cells[pos.index]);
  if (!alsCells.every((cell) => cell.candidates?.length > 0)) {
    // 都需要有候选数
    return false;
  }
  const rows = new Set(positions.map((pos) => pos.row));
  const cols = new Set(positions.map((pos) => pos.col));
  const boxes = new Set(positions.map((pos) => pos.box));
  if (rows.size !== 1 && cols.size !== 1 && boxes.size !== 1) {
    // 所有节点都需要在同一个作用域内，也就是弱相关
    return false;
  }
  const alsCandidates = new Set(alsCells.flatMap((cell) => cell.candidates!.map((c) => c.digit)));
  if (alsCandidates.size === positions.length + 1) {
    return true;
  }
  return false;
}

export function WXYZWings(
  cells: Cell[],
  xz: Position, // xy节点
  als: Position[] // 其他als节点(与枢纽节点组成als)
): [boolean, string] {
  if (cells[xz.row][xz.col].candidates?.length !== 2) {
    return [false, 'xz节点不是2个候选数'];
  }
  if (!isALS(cells, als)) {
    return [false, `${als}没有组成ALS(Almost Locked Set)`];
  }
  const relatedPoses = als.filter((pos) => isRelatedPositions(xz, pos));
  const unRelatedPoses = als.filter((pos) => !isRelatedPositions(xz, pos));
  if (relatedPoses.length + unRelatedPoses.length !== als.length) {
    return [false, 'xz节点需要不在als中'];
  }
  if (relatedPoses.length === 0) {
    return [false, 'xz节点需要至少有一个关联的als节点'];
  }
  if (unRelatedPoses.length === 0) {
    return [false, 'xz节点需要至少有一个不关联的als节点'];
  }
  let sameDigits = cells[xz.row][xz.col].candidates.map((c) => c.digit);
  for (const pos of relatedPoses) {
    sameDigits = sameDigits.filter((digit) => hasCandidate(cells[pos.row][pos.col], digit));
    if (sameDigits.length === 0) {
      return [false, 'xz节点需要有一个关联的als节点有候选数'];
    }
  }
  if (sameDigits.length !== 1) {
    return [false, 'xz节点需要有一个候选数和als节点相同'];
  }
  const sameDigit = sameDigits[0];
  for (const pos of unRelatedPoses) {
    if (cells[pos.row][pos.col].candidates.some((c) => c.digit === sameDigit)) {
      return [false, `xz节点的候选数${sameDigit}不是RCC`];
    }
  }
  const diffDigit = cells[xz.row][xz.col].candidates.find((c) => c.digit !== sameDigit)?.digit;
  const sameCandidateInUnRelatedPoses: Position[] = [];
  for (const pos of unRelatedPoses) {
    if (cells[pos.row][pos.col].candidates.some((c) => c.digit === diffDigit)) {
      sameCandidateInUnRelatedPoses.push(pos);
    }
  }
  if (sameCandidateInUnRelatedPoses.length === 0) {
    return [false, `xz 的候选数 ${diffDigit} 没有出现在非关联的翼中`];
  }
  const [isSuccess, msg] = removeChainCandidateByEndpoint(
    cells,
    { positions: [xz], digit: diffDigit },
    { positions: sameCandidateInUnRelatedPoses, digit: diffDigit }
  );
  if (!isSuccess) {
    return [false, msg];
  }
  return [true, ''];
}
