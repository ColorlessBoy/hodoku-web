import { Cell, Link, LinkNode } from '../../types/schema';

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  size: number,
  cellSize: number
) => {
  ctx.strokeStyle = '#000';

  // 1. Draw Thin Lines (Sub-grid lines)
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 9; i++) {
    if (i % 3 === 0) continue; // Skip block boundaries
    const pos = Math.floor(i * cellSize) + 0.5; // Pixel perfect alignment

    // Horizontal
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);

    // Vertical
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
  }
  ctx.stroke();

  // 2. Draw Thick Lines (Block boundaries)
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 9; i++) {
    if (i % 3 !== 0) continue; // Skip non-block boundaries
    const pos = Math.floor(i * cellSize);

    // Horizontal
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);

    // Vertical
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
  }
  ctx.stroke();

  // 3. Draw Thick Rect (Grid boundaries)
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.strokeRect(0, 0, size, size);
  ctx.stroke();
};

const drawCandidates = (
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  x: number,
  y: number,
  cellSize: number
) => {
  const fontSize = cellSize / 4;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 3x3 grid for candidates
  // 1 2 3
  // 4 5 6
  // 7 8 9
  cell.candidates?.forEach((cand) => {
    const r = Math.floor((cand.value - 1) / 3);
    const c = (cand.value - 1) % 3;

    const cx = x + (c + 0.5) * (cellSize / 3);
    const cy = y + (r + 0.5) * (cellSize / 3);

    if (cand.background) {
      ctx.fillStyle = cand.background;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      const padding = 2;
      const rectSize = cellSize / 3 - padding * 2;
      const rectX = cx - cellSize / 6 + padding;
      const rectY = cy - cellSize / 6 + padding;

      ctx.fillRect(rectX, rectY, rectSize, rectSize);
      ctx.strokeRect(rectX, rectY, rectSize, rectSize);
    }

    ctx.fillStyle = '#111'; // Default candidate color
    if (cand.color) {
      ctx.fillStyle = cand.color;
    }

    if (cand.background) {
      // 文字添加白边
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fff';
      ctx.strokeText(cand.value.toString(), cx, cy);
    }

    ctx.fillText(cand.value.toString(), cx, cy);
  });
};

export const drawCells = (
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  cellSize: number
) => {
  cells.forEach((cell) => {
    const x = cell.col * cellSize;
    const y = cell.row * cellSize;

    // 1. Draw Background Color
    if (cell.colors?.background) {
      ctx.fillStyle = cell.colors.background;
      ctx.fillRect(x, y, cellSize, cellSize);
    }

    // 2. Draw Value (Big Digit)
    if (cell.value) {
      ctx.fillStyle = cell.isGiven ? '#000' : '#0000ff'; // Given black, User blue
      if (cell.colors?.digit) {
        ctx.fillStyle = cell.colors.digit;
      }
      ctx.font = `${cellSize * 0.7}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        cell.value.toString(),
        x + cellSize / 2,
        y + cellSize / 2 + 2
      );
    } else if (cell.candidates && cell.candidates.length > 0) {
      // 3. Draw Candidates (Small Digits)
      drawCandidates(ctx, cell, x, y, cellSize);
    }
  });
};

export const drawSelection = (
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  cellSize: number
) => {
  const x = col * cellSize;
  const y = row * cellSize;

  ctx.strokeStyle = '#1176E3'; // Blue
  ctx.lineWidth = 4;
  ctx.strokeRect(x+ctx.lineWidth/2, y+ctx.lineWidth/2, cellSize-ctx.lineWidth/2, cellSize-ctx.lineWidth/2);
};


export const drawLinks = (
  ctx: CanvasRenderingContext2D,
  links: Link[] | undefined,
  cellSize: number
) => {
  if (!links) return;

  links.forEach((link) => {
    // Adjust start/end positions slightly if they are candidates
    // For simplicity, we currently draw from center to center
    // Ideally we should offset to the specific candidate position if digit is provided

    const getCandidatePos = (node: LinkNode) => {
      if (!node.digit)
        return {
          x: (node.col + 0.5) * cellSize,
          y: (node.row + 0.5) * cellSize,
        };
      const r = Math.floor((node.digit - 1) / 3);
      const c = (node.digit - 1) % 3;
      const cx = node.col * cellSize + (c + 0.5) * (cellSize / 3);
      const cy = node.row * cellSize + (r + 0.5) * (cellSize / 3);
      return { x: cx, y: cy };
    };

    const startPos = getCandidatePos(link.start);
    const endPos = getCandidatePos(link.end);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle =
      link.color || (link.type === 'strong' ? '#ff0000' : '#00ff00'); // Strong Red, Weak Green
    if (link.type === 'weak') {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.stroke();

    // Reset dash
    ctx.setLineDash([]);

    // Draw arrow head (optional, simplified)
    // drawArrowHead(ctx, startPos, endPos);
  });
};
