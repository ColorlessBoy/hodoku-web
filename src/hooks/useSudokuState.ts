import { useState, useCallback, useMemo } from 'react';
import {
  SudokuRenderSchema,
  CellRenderState,
  CellPosition,
  Digit,
  CellColor,
  CandidateColor,
  ChainLink,
  createEmptyRenderSchema,
  examplePuzzle,
  areInSameUnit,
  getBoxIndex,
} from '@/types/sudoku';

export const useSudokuState = () => {
  const [schema, setSchema] = useState<SudokuRenderSchema>(() => {
    const initial = createEmptyRenderSchema();

    // 加载示例题目
    examplePuzzle.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (value !== null) {
          initial.cells[rowIndex][colIndex] = {
            ...initial.cells[rowIndex][colIndex],
            value,
            isGiven: true,
          };
        }
      });
    });

    return initial;
  });

  // 检测冲突
  const detectConflicts = useCallback((cells: CellRenderState[][]): CellRenderState[][] => {
    const newCells = cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        hasConflict: false,
        conflictWith: [] as CellPosition[],
      }))
    );

    // 检查每个格子
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = newCells[row][col].value;
        if (!value) continue;

        // 检查同行
        for (let c = 0; c < 9; c++) {
          if (c !== col && newCells[row][c].value === value) {
            newCells[row][col].hasConflict = true;
            newCells[row][col].conflictWith?.push({ row, col: c });
          }
        }

        // 检查同列
        for (let r = 0; r < 9; r++) {
          if (r !== row && newCells[r][col].value === value) {
            newCells[row][col].hasConflict = true;
            newCells[row][col].conflictWith?.push({ row: r, col });
          }
        }

        // 检查同宫
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartCol = Math.floor(col / 3) * 3;
        for (let r = boxStartRow; r < boxStartRow + 3; r++) {
          for (let c = boxStartCol; c < boxStartCol + 3; c++) {
            if ((r !== row || c !== col) && newCells[r][c].value === value) {
              newCells[row][col].hasConflict = true;
              newCells[row][col].conflictWith?.push({ row: r, col: c });
            }
          }
        }
      }
    }

    return newCells;
  }, []);

  // 更新高亮状态
  const updateHighlights = useCallback(
    (
      cells: CellRenderState[][],
      selectedCell: CellPosition | null,
      highlightedDigit: Digit | null
    ): CellRenderState[][] => {
      return cells.map((row, rowIndex) =>
        row.map((cell, colIndex): CellRenderState => {
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isRelated = selectedCell
            ? areInSameUnit({ row: rowIndex, col: colIndex }, selectedCell) && !isSelected
            : false;
          const isSameValue =
            selectedCell && cells[selectedCell.row][selectedCell.col].value
              ? cell.value === cells[selectedCell.row][selectedCell.col].value &&
                cell.value !== null
              : highlightedDigit
                ? cell.value === highlightedDigit
                : false;

          return {
            ...cell,
            isSelected,
            isRelated,
            isSameValue: isSameValue && !isSelected,
            isHighlighted: highlightedDigit ? cell.value === highlightedDigit : false,
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
        const newCells = updateHighlights(prev.cells, position, prev.highlightedDigit);
        return {
          ...prev,
          cells: newCells,
          selectedCell: position,
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
                value,
                centerCandidates: value ? [] : c.centerCandidates,
                cornerCandidates: value ? [] : c.cornerCandidates,
              };
            }
            return c;
          })
        );

        const cellsWithConflicts = detectConflicts(newCells);
        const cellsWithHighlights = updateHighlights(
          cellsWithConflicts,
          prev.selectedCell,
          prev.highlightedDigit
        );

        return {
          ...prev,
          cells: cellsWithHighlights,
        };
      });
    },
    [detectConflicts, updateHighlights]
  );

  // 切换角注
  const toggleCornerCandidate = useCallback((position: CellPosition, digit: Digit) => {
    setSchema((prev) => {
      const cell = prev.cells[position.row][position.col];
      if (cell.isGiven || cell.value) return prev;

      const newCells = prev.cells.map((row, rowIndex) =>
        row.map((c, colIndex) => {
          if (rowIndex === position.row && colIndex === position.col) {
            const existing = c.cornerCandidates.find((cc) => cc.digit === digit);
            return {
              ...c,
              cornerCandidates: existing
                ? c.cornerCandidates.filter((cc) => cc.digit !== digit)
                : [...c.cornerCandidates, { digit }].sort((a, b) => a.digit - b.digit),
            };
          }
          return c;
        })
      );

      return { ...prev, cells: newCells };
    });
  }, []);

  // 切换中心候选数
  const toggleCenterCandidate = useCallback((position: CellPosition, digit: Digit) => {
    setSchema((prev) => {
      const cell = prev.cells[position.row][position.col];
      if (cell.isGiven || cell.value) return prev;

      const newCells = prev.cells.map((row, rowIndex) =>
        row.map((c, colIndex) => {
          if (rowIndex === position.row && colIndex === position.col) {
            const existing = c.centerCandidates.find((cc) => cc.digit === digit);
            return {
              ...c,
              centerCandidates: existing
                ? c.centerCandidates.filter((cc) => cc.digit !== digit)
                : [...c.centerCandidates, { digit }].sort((a, b) => a.digit - b.digit),
            };
          }
          return c;
        })
      );

      return { ...prev, cells: newCells };
    });
  }, []);

  // 设置单元格颜色
  const setCellColor = useCallback((position: CellPosition, color: CellColor) => {
    setSchema((prev) => {
      const newCells = prev.cells.map((row, rowIndex) =>
        row.map((c, colIndex) => {
          if (rowIndex === position.row && colIndex === position.col) {
            return { ...c, backgroundColor: color };
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
      setSchema((prev) => {
        const newCells = prev.cells.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === position.row && colIndex === position.col) {
              const candidates = isCorner ? c.cornerCandidates : c.centerCandidates;
              const newCandidates = candidates.map((cc) =>
                cc.digit === digit ? { ...cc, color } : cc
              );
              return isCorner
                ? { ...c, cornerCandidates: newCandidates }
                : { ...c, centerCandidates: newCandidates };
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
        const newCells = updateHighlights(prev.cells, prev.selectedCell, digit);
        return {
          ...prev,
          cells: newCells,
          highlightedDigit: digit,
        };
      });
    },
    [updateHighlights]
  );

  // 添加链
  const addLink = useCallback((link: ChainLink) => {
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
                value: null,
                centerCandidates: [],
                cornerCandidates: [],
                backgroundColor: null,
              };
            }
            return c;
          })
        );

        const cellsWithConflicts = detectConflicts(newCells);
        const cellsWithHighlights = updateHighlights(
          cellsWithConflicts,
          prev.selectedCell,
          prev.highlightedDigit
        );

        return { ...prev, cells: cellsWithHighlights };
      });
    },
    [detectConflicts, updateHighlights]
  );

  const replaceSchema = useCallback((next: SudokuRenderSchema) => {
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
