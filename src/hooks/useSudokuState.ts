import { useState, useCallback } from 'react';
import {
  SudokuSchema,
  Cell,
  CellPosition,
  Digit,
  CellColor,
  CandidateColor,
  Link,
  examplePuzzle,
  getBoxIndex,
  isInSameUnit,
} from '@/types/sudoku';

// 创建空的 schema
const createEmptySchema = (): SudokuSchema => ({
  cells: Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col): Cell => ({
      position: { row, col, box: Math.floor(row / 3) * 3 + Math.floor(col / 3) },
      isGiven: false,
      cornerCandidates: [],
    }))
  ),
  links: [],
  superLinks: [],
});

export const useSudokuState = () => {
  const [schema, setSchema] = useState<SudokuSchema>(() => {
    const initial = createEmptySchema();

    // 加载示例题目
    examplePuzzle.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (value !== null) {
          initial.cells[rowIndex][colIndex] = {
            ...initial.cells[rowIndex][colIndex],
            digit: value,
            isGiven: true,
          };
        }
      });
    });

    return initial;
  });

  // 更新高亮状态
  const updateHighlights = useCallback(
    (
      cells: Cell[][],
      selectedCell: CellPosition | null,
      highlightedDigit: Digit | null
    ): Cell[][] => {
      return cells.map((row, rowIndex) =>
        row.map((cell, colIndex): Cell => {
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isRelated = selectedCell
            ? isInSameUnit({ row: rowIndex, col: colIndex }, selectedCell) && !isSelected
            : false;
          const isSameValue =
            selectedCell && cells[selectedCell.row][selectedCell.col].digit
              ? cell.digit === cells[selectedCell.row][selectedCell.col].digit
              : highlightedDigit
                ? cell.digit === highlightedDigit
                : false;

          return {
            ...cell,
            isSelected,
            isRelated,
            isSameValue: isSameValue && !isSelected,
            isHighlighted: highlightedDigit ? cell.digit === highlightedDigit : false,
          };
        })
      );
    },
    []
  );

  // 选择格子
  const selectCell = useCallback(
    (position: CellPosition | null) => {
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
    (position: CellPosition, value: Digit | null) => {
      setSchema((prev) => {
        const cell = prev.cells[position.row][position.col];
        if (cell.isGiven) return prev;

        const newCells = prev.cells.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === position.row && colIndex === position.col) {
              return {
                ...c,
                digit: value ?? undefined,
                cornerCandidates: value ? [] : c.cornerCandidates,
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

  // 切换角注
  const toggleCornerCandidate = useCallback((position: CellPosition, digit: Digit) => {
    setSchema((prev) => {
      const cell = prev.cells[position.row][position.col];
      if (cell.isGiven || cell.digit) return prev;

      const existing = (cell.cornerCandidates ?? []).find((cc) => cc.digit === digit);
      const newCornerCandidates = existing
        ? (cell.cornerCandidates ?? []).filter((cc) => cc.digit !== digit)
        : [...(cell.cornerCandidates ?? []), { digit }].sort((a, b) => a.digit - b.digit);

      const newCells = prev.cells.map((row, rowIndex) =>
        row.map((c, colIndex) => {
          if (rowIndex === position.row && colIndex === position.col) {
            return { ...c, cornerCandidates: newCornerCandidates };
          }
          return c;
        })
      );

      return { ...prev, cells: newCells };
    });
  }, []);

  // 切换中心候选数（SudokuEngine 不支持 centerCandidates，暂时保留但可能需要后续处理）
  const toggleCenterCandidate = useCallback((position: CellPosition, digit: Digit) => {
    // SudokuEngine 只支持 cornerCandidates，这里暂时不实现
    console.warn('toggleCenterCandidate not supported by SudokuEngine');
  }, []);

  // 设置单元格颜色
  const setCellColor = useCallback((position: CellPosition, color: CellColor) => {
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
    (position: CellPosition, digit: Digit, color: CandidateColor, isCorner: boolean) => {
      if (!isCorner) {
        console.warn('setCandidateColor for center candidates not supported by SudokuEngine');
        return;
      }
      setSchema((prev) => {
        const newCells = prev.cells.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === position.row && colIndex === position.col) {
              const newCornerCandidates = (c.cornerCandidates ?? []).map((cc) =>
                cc.digit === digit ? { ...cc, color } : cc
              );
              return { ...c, cornerCandidates: newCornerCandidates };
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
    (position: CellPosition) => {
      setSchema((prev) => {
        const cell = prev.cells[position.row][position.col];
        if (cell.isGiven) return prev;

        const newCells = prev.cells.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === position.row && colIndex === position.col) {
              return {
                ...c,
                digit: undefined,
                cornerCandidates: [],
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
    toggleCornerCandidate,
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
