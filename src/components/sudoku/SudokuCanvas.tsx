import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  SudokuSchema,
  CellPosition,
  Digit,
  Candidate,
  Cell,
  getBoxIndex,
} from '@/types/sudoku';

interface SudokuCanvasProps {
  schema: SudokuSchema;
  onCellClick: (position: CellPosition) => void;
  onCandidateClick?: (position: CellPosition, digit: Digit) => void;
  size?: number;
}

// 获取CSS变量值并转换为颜色
const getCSSColor = (varName: string): string => {
  const style = getComputedStyle(document.documentElement);
  const value = style.getPropertyValue(varName).trim();
  if (value) {
    return `hsl(${value})`;
  }
  return '#000';
};

// 颜色缓存
let colorsCache: Record<string, string> | null = null;

const getColors = () => {
  if (colorsCache) return colorsCache;

  colorsCache = {
    gridBg: getCSSColor('--sudoku-grid-bg'),
    cellBg: getCSSColor('--sudoku-cell-bg'),
    cellHover: getCSSColor('--sudoku-cell-hover'),
    cellSelected: getCSSColor('--sudoku-cell-selected'),
    cellHighlighted: getCSSColor('--sudoku-cell-highlighted'),
    cellSameValue: getCSSColor('--sudoku-cell-same-value'),
    cellRelated: getCSSColor('--sudoku-cell-same-row-col-box'),
    borderThin: getCSSColor('--sudoku-border-thin'),
    borderThick: getCSSColor('--sudoku-border-thick'),
    selectedCellBorder: getCSSColor('--sudoku-selected-cell-border'),
    given: getCSSColor('--sudoku-given'),
    filled: getCSSColor('--sudoku-filled'),
    error: getCSSColor('--sudoku-error'),
    errorBg: getCSSColor('--sudoku-error-bg'),
    muted: getCSSColor('--muted-foreground'),
    // Cell colors
    color1: getCSSColor('--sudoku-color-1'),
    color2: getCSSColor('--sudoku-color-2'),
    color3: getCSSColor('--sudoku-color-3'),
    color4: getCSSColor('--sudoku-color-4'),
    color5: getCSSColor('--sudoku-color-5'),
    color6: getCSSColor('--sudoku-color-6'),
    color7: getCSSColor('--sudoku-color-7'),
    color8: getCSSColor('--sudoku-color-8'),
    // Candidate colors
    candidate1: getCSSColor('--sudoku-candidate-color-1'),
    candidate2: getCSSColor('--sudoku-candidate-color-2'),
    candidate3: getCSSColor('--sudoku-candidate-color-3'),
    candidate4: getCSSColor('--sudoku-candidate-color-4'),
    candidate5: getCSSColor('--sudoku-candidate-color-5'),
    candidate6: getCSSColor('--sudoku-candidate-color-6'),
    candidate7: getCSSColor('--sudoku-candidate-color-7'),
    candidate8: getCSSColor('--sudoku-candidate-color-8'),
    candidate9: getCSSColor('--sudoku-candidate-color-9'),
    // Links
    linkStrong: getCSSColor('--sudoku-link-strong'),
    linkWeak: getCSSColor('--sudoku-link-weak'),
  };

  return colorsCache;
};

// 清除颜色缓存（用于主题切换）
const clearColorCache = () => {
  colorsCache = null;
};

// 单元格颜色映射
const getCellColorKey = (colorIndex: number): string => {
  const keys: Record<number, string> = {
    1: 'color1',
    2: 'color2',
    3: 'color3',
    4: 'color4',
    5: 'color5',
    6: 'color6',
    7: 'color7',
    8: 'color8',
  };
  return keys[colorIndex] || 'cellBg';
};

// 候选数颜色映射 - 9种颜色（1灰+4对互补色）
const getCandidateColorKey = (colorIndex: number): string => {
  const keys: Record<number, string> = {
    1: 'candidate1',  // Gray
    2: 'candidate2',  // Red
    3: 'candidate3',  // Cyan
    4: 'candidate4',  // Orange
    5: 'candidate5',  // Blue
    6: 'candidate6',  // Yellow
    7: 'candidate7',  // Purple
    8: 'candidate8',  // Green
    9: 'candidate9',  // Magenta
  };
  return keys[colorIndex] || 'muted';
};

// 角注固定位置（九宫格布局：1左上到9右下）
const getCornerPosition = (digit: Digit): { x: number; y: number } => {
  // digit 1-9 对应九宫格位置
  // 1 2 3
  // 4 5 6
  // 7 8 9
  const index = digit - 1;
  const row = Math.floor(index / 3);
  const col = index % 3;
  return { x: col, y: row };
};

export const SudokuCanvas: React.FC<SudokuCanvasProps> = ({
  schema,
  onCellClick,
  onCandidateClick,
  size = 450,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = window.devicePixelRatio || 1;
  const cellSize = useMemo(() => size / 9, [size]);
  const padding = 2; // Canvas内边距，避免圆角裁切边框
  const actualSize = size - padding * 2;
  const actualCellSize = actualSize / 9;

  // 处理点击
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - padding;
      const y = e.clientY - rect.top - padding;

      const col = Math.floor(x / actualCellSize);
      const row = Math.floor(y / actualCellSize);

      if (row >= 0 && row < 9 && col >= 0 && col < 9) {
        // 检查是否点击了候选数
        if (onCandidateClick) {
          const cell = schema.cells[row][col];
          if (!cell.digit && cell.cornerCandidates.length > 0) {
            const cellX = col * actualCellSize;
            const cellY = row * actualCellSize;
            const localX = x - cellX;
            const localY = y - cellY;

            // 检查九宫格位置
            const gridCol = Math.floor((localX / actualCellSize) * 3);
            const gridRow = Math.floor((localY / actualCellSize) * 3);
            const clickedDigit = (gridRow * 3 + gridCol + 1) as Digit;

            // 检查该候选数是否存在
            const candidate = cell.cornerCandidates.find((c) => c.digit === clickedDigit);
            if (candidate) {
              onCandidateClick({ row, col, box: getBoxIndex(row, col) }, clickedDigit);
              return;
            }
          }
        }

        onCellClick({ row, col, box: getBoxIndex(row, col) });
      }
    },
    [actualCellSize, onCellClick, onCandidateClick, schema.cells, padding]
  );

  // 渲染函数
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除颜色缓存以获取最新主题色
    clearColorCache();
    const colors = getColors();

    // 设置高清渲染
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 清除画布并绘制圆角矩形背景
    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // 绘制圆角裁切区域
    const radius = 8;
    ctx.beginPath();
    ctx.rect(padding, padding, actualSize, actualSize);
    ctx.clip();

    // 绘制背景
    ctx.fillStyle = colors.gridBg;
    ctx.fillRect(padding, padding, actualSize, actualSize);

    // 渲染所有单元格
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = schema.cells && schema.cells.length === 9? schema.cells[row][col] : {};
        const x = padding + col * actualCellSize;
        const y = padding + row * actualCellSize;

        drawCell(ctx, cell, x, y, actualCellSize, colors);
      }
    }

    // 渲染网格线
    drawGridLines(ctx, actualSize, actualCellSize, colors, padding);

    // 渲染链条
    drawLinks(ctx, schema.links, actualCellSize, colors, padding);

    ctx.restore();
  }, [schema, size, actualCellSize, actualSize, dpr, padding]);

  return (
    <canvas
      ref={canvasRef}
      width={size * dpr}
      height={size * dpr}
      style={{
        width: size,
        height: size,
        cursor: 'pointer',
      }}
      onClick={handleClick}
    />
  );
};

// 绘制单元格
function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  x: number,
  y: number,
  cellSize: number,
  colors: Record<string, string>
) {
  // 背景色优先级：冲突 > 染色 > 选中 > 同值 > 相关 > 高亮 > 默认
  let bgColor = colors.cellBg;

  if (cell.hasConflict) {
    bgColor = colors.errorBg;
  } else if (cell.color) {
    bgColor = colors[getCellColorKey(cell.color)];
  } else if (cell.isHighlighted) {
    bgColor = colors.cellHighlighted;
  }

  // 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, cellSize, cellSize);

  if (cell.isSelected) {
    // 加粗边框
    ctx.lineWidth = 4;
    ctx.strokeStyle = colors.selectedCellBorder;
    ctx.strokeRect(x+ctx.lineWidth/2, y+ctx.lineWidth/2, cellSize-ctx.lineWidth, cellSize-ctx.lineWidth);
  }

  // 绘制主值
  if (cell.digit) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${cell.isGiven ? '600' : '500'} ${cellSize * 0.55}px Inter, system-ui, sans-serif`;

    if (cell.isGiven) {
      ctx.fillStyle = colors.given;
    } else if (cell.hasConflict) {
      ctx.fillStyle = colors.error;
    } else {
      ctx.fillStyle = colors.filled;
    }

    ctx.fillText(String(cell.digit), x + cellSize / 2, y + cellSize / 2);
    return; // 有主值时不渲染候选数
  }

  // 绘制角注（九宫格布局）
  if (cell.cornerCandidates && cell.cornerCandidates.length > 0) {
    drawCornerCandidates(ctx, cell.cornerCandidates, x, y, cellSize, colors);
  }
}

// 绘制角注（九宫格固定布局）
function drawCornerCandidates(
  ctx: CanvasRenderingContext2D,
  candidates: Candidate[],
  cellX: number,
  cellY: number,
  cellSize: number,
  colors: Record<string, string>
) {
  const fontSize = cellSize * 0.22;
  const padding = cellSize * 0.08;
  const gridSize = (cellSize - padding * 2) / 3;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  candidates.forEach((candidate) => {
    const pos = getCornerPosition(candidate.digit);
    const x = cellX + padding + gridSize * pos.x + gridSize / 2;
    const y = cellY + padding + gridSize * pos.y + gridSize / 2;

    // 如果有颜色，绘制背景方块
    if (candidate.color) {
      const bgSize = gridSize * 0.85;
      ctx.fillStyle = colors[getCandidateColorKey(candidate.color)];
      ctx.beginPath();
      ctx.rect(x - bgSize / 2, y - bgSize / 2, bgSize, bgSize);
      ctx.fill();
    }

    // 设置字体
    if (candidate.color) {
      ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
      // 绘制白色描边增加区分度
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeText(String(candidate.digit), x, y);
      ctx.fillStyle = 'white';
    } else {
      ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = colors.muted;
    }

    ctx.fillText(String(candidate.digit), x, y);
  });
}

// 绘制网格线
function drawGridLines(
  ctx: CanvasRenderingContext2D,
  size: number,
  cellSize: number,
  colors: Record<string, string>,
  offset: number = 0
) {
  // 细线
  ctx.strokeStyle = colors.borderThin;
  ctx.lineWidth = 1;

  for (let i = 1; i < 9; i++) {
    if (i % 3 !== 0) {
      // 垂直线
      ctx.beginPath();
      ctx.moveTo(offset + i * cellSize, offset);
      ctx.lineTo(offset + i * cellSize, offset + size);
      ctx.stroke();

      // 水平线
      ctx.beginPath();
      ctx.moveTo(offset, offset + i * cellSize);
      ctx.lineTo(offset + size, offset + i * cellSize);
      ctx.stroke();
    }
  }

  // 粗线（3x3宫格边界）
  ctx.strokeStyle = colors.borderThick;
  ctx.lineWidth = 2;

  for (let i = 0; i <= 3; i++) {
    const pos = i * cellSize * 3;

    // 垂直线
    ctx.beginPath();
    ctx.moveTo(offset + pos, offset);
    ctx.lineTo(offset + pos, offset + size);
    ctx.stroke();

    // 水平线
    ctx.beginPath();
    ctx.moveTo(offset, offset + pos);
    ctx.lineTo(offset + size, offset + pos);
    ctx.stroke();
  }
}

// 绘制链条
function drawLinks(
  ctx: CanvasRenderingContext2D,
  links: import('@/types/sudoku').Link[],
  cellSize: number,
  colors: Record<string, string>,
  offset: number = 0
) {
  // 获取候选数在单元格中的位置
  const getCandidatePosition = (row: number, col: number, candidate?: number) => {
    const cellX = offset + col * cellSize;
    const cellY = offset + row * cellSize;

    if (candidate) {
      const padding = cellSize * 0.08;
      const gridSize = (cellSize - padding * 2) / 3;
      const pos = getCornerPosition(candidate as Digit);
      return {
        x: cellX + padding + gridSize * pos.x + gridSize / 2,
        y: cellY + padding + gridSize * pos.y + gridSize / 2,
      };
    }

    return {
      x: cellX + cellSize / 2,
      y: cellY + cellSize / 2,
    };
  };

  // 绘制箭头
  const drawArrowHead = (fromX: number, fromY: number, toX: number, toY: number, size: number) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowAngle = Math.PI / 6; // 30度

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - size * Math.cos(angle - arrowAngle),
      toY - size * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      toX - size * Math.cos(angle + arrowAngle),
      toY - size * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  };

  links.forEach((link) => {
    const from = getCandidatePosition(
      link.from.position.row,
      link.from.position.col,
      link.from.digit
    );
    const to = getCandidatePosition(link.to.position.row, link.to.position.col, link.to.digit);

    // 计算缩短的终点（给箭头留空间）
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const arrowSize = 8;
    const endX = to.x - arrowSize * 0.5 * Math.cos(angle);
    const endY = to.y - arrowSize * 0.5 * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(endX, endY);

    if (link.isStrong) {
      ctx.strokeStyle = link.color || colors.linkStrong;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = link.color || colors.linkWeak;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制箭头
    ctx.fillStyle = ctx.strokeStyle;
    drawArrowHead(from.x, from.y, to.x, to.y, arrowSize);

    // 绘制起点圆圈
    ctx.beginPath();
    ctx.arc(from.x, from.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}
