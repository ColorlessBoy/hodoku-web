import { useState, useCallback } from 'react';
import { SudokuSchema, Cell, Position, Digit, Color, Link, getBoxIndex } from '@/lib/sudoku';

// 创建空的 schema
const createEmptySchema = (): SudokuSchema => ({
  cells: [],
  links: [],
  superLinks: [],
});

export const useSudokuState = () => {
  const [schema, setSchema] = useState<SudokuSchema>(() => {
    const initial = createEmptySchema();

    return initial;
  });

  // 辅助函数：确保创建新对象并更新高亮状态
  const updateCellsWithHighlights = useCallback(
    (cells: Cell[][], selectedCell: Position | null, highlightedDigit: Digit | null): Cell[][] => {
      return cells.map((row, rowIndex) =>
        row.map((cell, colIndex): Cell => {
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isHighlighted = highlightedDigit ? cell.digit === highlightedDigit : false;

          // 只有当选中状态改变时才创建新对象
          if (cell.isSelected === isSelected && cell.isHighlighted === isHighlighted) {
            return cell;
          }

          return {
            ...cell,
            isSelected,
            isHighlighted,
          };
        })
      );
    },
    []
  );

  // 选择格子
  const selectCell = useCallback(
    (position: Position | null) => {
      setSchema((prev) => {
        const newCells = updateCellsWithHighlights(prev.cells, position, null);
        return {
          ...prev,
          cells: newCells,
        };
      });
    },
    [updateCellsWithHighlights]
  );

  // 设置格子的值
  const setCellValue = useCallback(
    (position: Position, value: Digit | null) => {
      setSchema((prev) => {
        const cell = prev.cells[position.row][position.col];
        if (cell.isGiven) return prev;

        const newCells = prev.cells.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === position.row && colIndex === position.col) {
              return {
                ...c,
                digit: value ?? undefined,
                candidates: value ? [] : c.candidates,
              };
            }
            return c;
          })
        );

        const cellsWithHighlights = updateCellsWithHighlights(newCells, null, null);

        return {
          ...prev,
          cells: cellsWithHighlights,
        };
      });
    },
    [updateCellsWithHighlights]
  );

  // 切换中心候选数（SudokuEngine 不支持 centerCandidates，暂时保留但可能需要后续处理）
  const toggleCenterCandidate = useCallback((position: Position, digit: Digit) => {
    // SudokuEngine 只支持 candidates，这里暂时不实现
    console.warn('toggleCenterCandidate not supported by SudokuEngine');
  }, []);

  // 设置单元格颜色
  const setCellColor = useCallback(
    (position: Position, color: Color) => {
      setSchema((prev) => {
        let changed = false;
        const newCells = prev.cells.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === position.row && colIndex === position.col) {
              if (c.color !== color) changed = true;
              return { ...c, color };
            }
            return c;
          })
        );

        if (!changed) return prev;

        const cellsWithHighlights = updateCellsWithHighlights(newCells, null, null);

        return { ...prev, cells: cellsWithHighlights };
      });
    },
    [updateCellsWithHighlights]
  );

  // 设置候选数颜色
  const setCandidateColor = useCallback(
    (position: Position, digit: Digit, color: Color, isCorner: boolean) => {
      if (!isCorner) {
        console.warn('setCandidateColor for center candidates not supported by SudokuEngine');
        return;
      }
      setSchema((prev) => {
        const newCells = prev.cells.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === position.row && colIndex === position.col) {
              const newcandidates = (c.candidates ?? []).map((cc) =>
                cc.digit === digit ? { ...cc, color } : cc
              );
              return { ...c, candidates: newcandidates };
            }
            return c;
          })
        );

        const cellsWithHighlights = updateCellsWithHighlights(newCells, null, null);

        return { ...prev, cells: cellsWithHighlights };
      });
    },
    [updateCellsWithHighlights]
  );

  // 设置高亮数字
  const setHighlightedDigit = useCallback(
    (digit: Digit | null) => {
      setSchema((prev) => {
        const newCells = updateCellsWithHighlights(prev.cells, null, digit);
        return {
          ...prev,
          cells: newCells,
        };
      });
    },
    [updateCellsWithHighlights]
  );

  // 添加链
  const addLink = useCallback((link: Link) => {
    setSchema((prev) => ({
      ...prev,
      links: [...prev.links, link],
    }));
  }, []);

  // 清除链
  const clearLinks = useCallback(() => {
    setSchema((prev) => ({
      ...prev,
      links: [],
    }));
  }, []);

  // 清除格子
  const clearCell = useCallback(
    (position: Position) => {
      setSchema((prev) => {
        const cell = prev.cells[position.row][position.col];
        if (cell.isGiven) return prev;

        const newCells = prev.cells.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === position.row && colIndex === position.col) {
              return {
                ...c,
                digit: undefined,
                candidates: [],
                color: undefined,
              };
            }
            return c;
          })
        );

        const cellsWithHighlights = updateCellsWithHighlights(newCells, null, null);

        return { ...prev, cells: cellsWithHighlights };
      });
    },
    [updateCellsWithHighlights]
  );

  const replaceSchema = useCallback((next: SudokuSchema) => {
    setSchema(next);
  }, []);

  return {
    schema,
    selectCell,
    setCellValue,
    toggleCenterCandidate,
    setCellColor,
    setCandidateColor,
    setHighlightedDigit,
    addLink,
    clearLinks,
    clearCell,
    replaceSchema,
  };
};
