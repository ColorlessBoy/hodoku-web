/**
 * 将前端渲染用 SudokuRenderSchema 与引擎用 SudokuSchema 互相转换，
 * 供 operator 校验（如强弱链）、solver、generator 使用。
 */
import type {
  SudokuSchema,
  Cell,
  CellPosition,
  Link,
  LinkEndpoint,
  Digit,
  Candidate,
} from '@/lib/SudokuEngine';
import { getBoxIndex } from '@/lib/SudokuEngine';
import type { SudokuRenderSchema, ChainLink } from '@/types/sudoku';

function withBox(pos: { row: number; col: number }): CellPosition {
  return {
    row: pos.row,
    col: pos.col,
    box: getBoxIndex(pos.row, pos.col),
  };
}

/**
 * 将 Render 的 81 格状态转为 Engine 的 SudokuSchema（仅 cells，links 由调用方按需转换）
 */
export function renderSchemaToEngineSchema(render: SudokuRenderSchema): SudokuSchema {
  const cells: Cell[][] = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col): Cell => {
      const c = render.cells[row][col];
      const cornerCandidates: Candidate[] = [
        ...(c.cornerCandidates ?? []).map((cc) => ({ digit: cc.digit as Digit, color: cc.color })),
      ];
      return {
        position: withBox({ row, col }),
        digit: c.value ?? undefined,
        isGiven: c.isGiven,
        cornerCandidates: cornerCandidates.length ? cornerCandidates : undefined,
      };
    })
  );

  const links: Link[] = (render.links ?? []).map(chainLinkToEngineLink);

  return {
    cells,
    links,
    superLinks: [],
  };
}

/**
 * 将前端的 ChainLink（candidate 字段）转为引擎的 Link（digit 字段）
 */
export function chainLinkToEngineLink(link: ChainLink): Link {
  const d1 = link.from.candidate ?? 1;
  const d2 = link.to.candidate ?? 1;
  return {
    from: {
      position: withBox(link.from.position),
      digit: d1 as Digit,
    },
    to: {
      position: withBox(link.to.position),
      digit: d2 as Digit,
    },
    isStrong: link.isStrong,
    color: link.color,
  };
}

/**
 * 从引擎 Link 转回前端 ChainLink（用于需要回写时）
 */
export function engineLinkToChainLink(link: Link): ChainLink {
  return {
    from: {
      position: { row: link.from.position.row, col: link.from.position.col },
      candidate: link.from.digit,
    },
    to: {
      position: { row: link.to.position.row, col: link.to.position.col },
      candidate: link.to.digit,
    },
    isStrong: link.isStrong,
    color: link.color,
  };
}

/**
 * 仅用渲染 schema 的 cells 部分生成引擎 schema（不包含 links），用于 solver/generator
 */
export function renderCellsToEngineSchema(render: SudokuRenderSchema): SudokuSchema {
  return renderSchemaToEngineSchema({
    ...render,
    links: [],
  });
}
