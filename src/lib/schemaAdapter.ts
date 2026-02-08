/**
 * 将前端用 SudokuSchema 复制一份（保留原有的 links 等信息）
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

function withBox(pos: { row: number; col: number }): CellPosition {
  return {
    row: pos.row,
    col: pos.col,
    box: getBoxIndex(pos.row, pos.col),
  };
}

/**
 * 深度复制 SudokuSchema
 */

export function cloneSchema(schema: SudokuSchema): SudokuSchema {
  return {
    cells: schema.cells.map((row) =>
      row.map(
        (cell): Cell => ({
          ...cell,
          position: { ...cell.position },
          cornerCandidates: cell.cornerCandidates
            ? cell.cornerCandidates.map((c) => ({ ...c }))
            : undefined,
        })
      )
    ),
    links: schema.links.map((link) => ({ ...link })),
    superLinks: schema.superLinks.map((link) => ({ ...link })),
  };
}
