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

  // 更新高亮状态
  const updateHighlights = useCallback(
    (cells: Cell[][], selectedCell: Position | null, highlightedDigit: Digit | null): Cell[][] => {
      return cells.map((row, rowIndex) =>
        row.map((cell, colIndex): Cell => {
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

          return {
            ...cell,
            isSelected,
            isHighlighted: highlightedDigit ? cell.digit === highlightedDigit : false,
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
        const newCells = updateHighlights(prev.cells, position, null);
        return {
          ...prev,
          cells: newCells,
        };
      });
    },
    [updateHighlights]
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

        const cellsWithHighlights = updateHighlights(newCells, null, null);

        return {
          ...prev,
          cells: cellsWithHighlights,
        };
      });
    },
    [updateHighlights]
  );

  // 切换中心候选数（SudokuEngine 不支持 centerCandidates，暂时保留但可能需要后续处理）
  const toggleCenterCandidate = useCallback((position: Position, digit: Digit) => {
    // SudokuEngine 只支持 candidates，这里暂时不实现
    console.warn('toggleCenterCandidate not supported by SudokuEngine');
  }, []);

  // 设置单元格颜色
  const setCellColor = useCallback((position: Position, color: Color) => {
    setSchema((prev) => {
      const newCells = prev.cells.map((row, rowIndex) =>
        row.map((c, colIndex) => {
          if (rowIndex === position.row && colIndex === position.col) {
            return { ...c, color };
          }
          return c;
        })
      );
      return { ...prev, cells: newCells };
    });
  }, []);

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
        return { ...prev, cells: newCells };
      });
    },
    []
  );

  // 设置高亮数字
  const setHighlightedDigit = useCallback(
    (digit: Digit | null) => {
      setSchema((prev) => {
        const newCells = updateHighlights(prev.cells, null, digit);
        return {
          ...prev,
          cells: newCells,
        };
      });
    },
    [updateHighlights]
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

        const cellsWithHighlights = updateHighlights(newCells, null, null);

        return { ...prev, cells: cellsWithHighlights };
      });
    },
    [updateHighlights]
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
