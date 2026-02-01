export const drawGrid = (ctx, size, cellSize) => {
  ctx.strokeStyle = '#000';
  ctx.beginPath();

  for (let i = 0; i <= 9; i++) {
    const pos = i * cellSize;
    // 每3条线加粗
    ctx.lineWidth = i % 3 === 0 ? 3 : 1;

    // Horizontal
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);

    // Vertical
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
  }

  ctx.stroke();
};

export const drawCells = (ctx, cells, cellSize) => {
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
      ctx.fillText(cell.value.toString(), x + cellSize / 2, y + cellSize / 2 + 2);
    } else if (cell.candidates && cell.candidates.length > 0) {
      // 3. Draw Candidates (Small Digits)
      drawCandidates(ctx, cell, x, y, cellSize);
    }
  });
};

const drawCandidates = (ctx, cell, x, y, cellSize) => {
  const fontSize = cellSize / 3.5;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 3x3 grid for candidates
  // 1 2 3
  // 4 5 6
  // 7 8 9
  cell.candidates.forEach((digit) => {
    const r = Math.floor((digit - 1) / 3);
    const c = (digit - 1) % 3;
    
    const cx = x + (c + 0.5) * (cellSize / 3);
    const cy = y + (r + 0.5) * (cellSize / 3);

    ctx.fillStyle = '#666'; // Default candidate color
    if (cell.colors?.candidates?.[digit]) {
      ctx.fillStyle = cell.colors.candidates[digit];
    }
    
    ctx.fillText(digit.toString(), cx, cy + 1);
  });
};

export const drawLinks = (ctx, links, cellSize) => {
  if (!links) return;

  links.forEach((link) => {
    // Adjust start/end positions slightly if they are candidates
    // For simplicity, we currently draw from center to center
    // Ideally we should offset to the specific candidate position if digit is provided
    
    const getCandidatePos = (node) => {
        if (!node.digit) return { x: (node.col + 0.5) * cellSize, y: (node.row + 0.5) * cellSize };
        const r = Math.floor((node.digit - 1) / 3);
        const c = (node.digit - 1) % 3;
        const cx = node.col * cellSize + (c + 0.5) * (cellSize / 3);
        const cy = node.row * cellSize + (r + 0.5) * (cellSize / 3);
        return { x: cx, y: cy };
    }

    const startPos = getCandidatePos(link.start);
    const endPos = getCandidatePos(link.end);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = link.color || (link.type === 'strong' ? '#ff0000' : '#00ff00'); // Strong Red, Weak Green
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
