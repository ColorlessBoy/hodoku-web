import React, { useState, useCallback, useEffect } from 'react';
import { SudokuGrid } from './SudokuGrid';
import { NumberPad } from './NumberPad';
import { ColorPalette } from './ColorPalette';
import { useSudokuState } from '@/hooks/useSudokuState';
import { CellPosition, Digit, CellColor, CandidateColor } from '@/types/sudoku';
import { Link2, Link2Off, Undo2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SudokuApp: React.FC = () => {
  const {
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
  } = useSudokuState();

  const [inputMode, setInputMode] = useState<'normal' | 'corner' | 'center'>('normal');
  const [colorTab, setColorTab] = useState<'cell' | 'candidate'>('cell');
  const [showLinks, setShowLinks] = useState(true);
  const [selectedCandidateColor, setSelectedCandidateColor] = useState<CandidateColor>(null);

  // 处理格子点击
  const handleCellClick = useCallback((position: CellPosition) => {
    selectCell(position);
  }, [selectCell]);
  
  // 处理候选数点击（用于染色）
  const handleCandidateClick = useCallback((position: CellPosition, digit: Digit) => {
    if (colorTab === 'candidate' && selectedCandidateColor !== null) {
      // 检查是角注还是中心候选数
      const cell = schema.cells[position.row][position.col];
      const isCorner = cell.cornerCandidates.some(c => c.digit === digit);
      const isCenter = cell.centerCandidates.some(c => c.digit === digit);
      
      if (isCorner) {
        setCandidateColor(position, digit, selectedCandidateColor, true);
      } else if (isCenter) {
        setCandidateColor(position, digit, selectedCandidateColor, false);
      }
    } else {
      // 非染色模式时，点击候选数等同于点击格子
      selectCell(position);
    }
  }, [colorTab, selectedCandidateColor, schema.cells, setCandidateColor, selectCell]);

  // 处理数字输入
  const handleNumberClick = useCallback((digit: Digit) => {
    if (!schema.selectedCell) return;

    switch (inputMode) {
      case 'normal':
        setCellValue(schema.selectedCell, digit);
        break;
      case 'corner':
        toggleCornerCandidate(schema.selectedCell, digit);
        break;
      case 'center':
        toggleCenterCandidate(schema.selectedCell, digit);
        break;
    }
  }, [schema.selectedCell, inputMode, setCellValue, toggleCornerCandidate, toggleCenterCandidate]);

  // 处理清除
  const handleClear = useCallback(() => {
    if (!schema.selectedCell) return;
    clearCell(schema.selectedCell);
  }, [schema.selectedCell, clearCell]);

  // 处理单元格颜色
  const handleCellColorSelect = useCallback((color: CellColor) => {
    if (!schema.selectedCell) return;
    setCellColor(schema.selectedCell, color);
  }, [schema.selectedCell, setCellColor]);

  // 处理候选数颜色选择（切换当前选中的颜色）
  const handleCandidateColorChange = useCallback((color: CandidateColor) => {
    setSelectedCandidateColor(color);
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 数字键 1-9
      if (e.key >= '1' && e.key <= '9') {
        handleNumberClick(parseInt(e.key) as Digit);
        return;
      }

      // 删除键
      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClear();
        return;
      }

      // 方向键移动
      if (schema.selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const { row, col } = schema.selectedCell;
        let newRow = row;
        let newCol = col;

        switch (e.key) {
          case 'ArrowUp':
            newRow = Math.max(0, row - 1);
            break;
          case 'ArrowDown':
            newRow = Math.min(8, row + 1);
            break;
          case 'ArrowLeft':
            newCol = Math.max(0, col - 1);
            break;
          case 'ArrowRight':
            newCol = Math.min(8, col + 1);
            break;
        }

        if (newRow !== row || newCol !== col) {
          selectCell({ row: newRow, col: newCol });
        }
      }

      // 模式切换快捷键
      if (e.key === 'z' || e.key === 'Z') {
        setInputMode('normal');
      } else if (e.key === 'x' || e.key === 'X') {
        setInputMode('corner');
      } else if (e.key === 'c' || e.key === 'C') {
        setInputMode('center');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [schema.selectedCell, handleNumberClick, handleClear, selectCell]);

  // 演示链条功能
  const handleDemoLinks = () => {
    clearLinks();
    // 添加一些演示链条
    addLink({
      from: { position: { row: 0, col: 2 }, candidate: 4 },
      to: { position: { row: 0, col: 5 }, candidate: 4 },
      isStrong: true,
    });
    addLink({
      from: { position: { row: 0, col: 5 }, candidate: 4 },
      to: { position: { row: 2, col: 5 }, candidate: 4 },
      isStrong: false,
    });
    addLink({
      from: { position: { row: 2, col: 5 }, candidate: 4 },
      to: { position: { row: 2, col: 2 }, candidate: 4 },
      isStrong: true,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        {/* 数独盘面 */}
        <div className="flex flex-col gap-4">
          <SudokuGrid
            schema={{
              ...schema,
              links: showLinks ? schema.links : [],
            }}
            onCellClick={handleCellClick}
            onCandidateClick={handleCandidateClick}
            size={Math.min(450, window.innerWidth - 32)}
          />
          
          {/* 链条控制 */}
          <div className="flex gap-2 justify-center">
            <button
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                'shadow-sm hover:shadow-md active:scale-95'
              )}
              onClick={handleDemoLinks}
            >
              <Link2 className="w-4 h-4" />
              演示链条
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                showLinks
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                'shadow-sm hover:shadow-md active:scale-95'
              )}
              onClick={() => setShowLinks(!showLinks)}
            >
              {showLinks ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
              {showLinks ? '显示链条' : '隐藏链条'}
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                'shadow-sm hover:shadow-md active:scale-95'
              )}
              onClick={clearLinks}
            >
              <RotateCcw className="w-4 h-4" />
              清除链条
            </button>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="flex flex-col gap-6 w-72">
          {/* 数字键盘 */}
          <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">输入</h3>
            <NumberPad
              onNumberClick={handleNumberClick}
              onClear={handleClear}
              mode={inputMode}
              onModeChange={setInputMode}
              highlightedDigit={schema.highlightedDigit}
              onHighlightDigit={setHighlightedDigit}
            />
          </div>

          {/* 颜色面板 */}
          <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">染色</h3>
            <ColorPalette
              onCellColorSelect={handleCellColorSelect}
              activeTab={colorTab}
              onTabChange={setColorTab}
              selectedCandidateColor={selectedCandidateColor}
              onCandidateColorChange={handleCandidateColorChange}
            />
          </div>

          {/* 快捷键提示 */}
          <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">快捷键</h3>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <div className="flex justify-between">
                <span>1-9</span>
                <span>输入数字</span>
              </div>
              <div className="flex justify-between">
                <span>方向键</span>
                <span>移动选择</span>
              </div>
              <div className="flex justify-between">
                <span>Delete / Backspace</span>
                <span>清除</span>
              </div>
              <div className="flex justify-between">
                <span>Z / X / C</span>
                <span>切换模式</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
