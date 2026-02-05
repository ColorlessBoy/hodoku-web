import React from 'react';
import { CellColor, CandidateColor } from '@/types/sudoku';
import { cn } from '@/lib/utils';
import { X, Palette, Type } from 'lucide-react';

interface ColorPaletteProps {
  onCellColorSelect: (color: CellColor) => void;
  activeTab: 'cell' | 'candidate';
  onTabChange: (tab: 'cell' | 'candidate') => void;
  selectedCandidateColor: CandidateColor;
  onCandidateColorChange: (color: CandidateColor) => void;
}

const cellColors: { color: CellColor; class: string }[] = [
  { color: 1, class: 'bg-sudoku-color-1' },
  { color: 2, class: 'bg-sudoku-color-2' },
  { color: 3, class: 'bg-sudoku-color-3' },
  { color: 4, class: 'bg-sudoku-color-4' },
  { color: 5, class: 'bg-sudoku-color-5' },
  { color: 6, class: 'bg-sudoku-color-6' },
  { color: 7, class: 'bg-sudoku-color-7' },
  { color: 8, class: 'bg-sudoku-color-8' },
];

const candidateColors: { color: CandidateColor; class: string }[] = [
  { color: 1, class: 'bg-sudoku-candidate-1' },
  { color: 2, class: 'bg-sudoku-candidate-2' },
  { color: 3, class: 'bg-sudoku-candidate-3' },
  { color: 4, class: 'bg-sudoku-candidate-4' },
  { color: 5, class: 'bg-sudoku-candidate-5' },
  { color: 6, class: 'bg-sudoku-candidate-6' },
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  onCellColorSelect,
  activeTab,
  onTabChange,
  selectedCandidateColor,
  onCandidateColorChange,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* 标签切换 */}
      <div className="flex gap-2">
        <button
          className={cn(
            'flex-1 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'cell'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
          onClick={() => onTabChange('cell')}
        >
          <Palette className="w-4 h-4" />
          单元格
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'candidate'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
          onClick={() => onTabChange('candidate')}
        >
          <Type className="w-4 h-4" />
          候选数
        </button>
      </div>

      {/* 颜色选择器 */}
      {activeTab === 'cell' ? (
        <div className="flex gap-2 flex-wrap">
          {cellColors.map(({ color, class: colorClass }) => (
            <button
              key={color}
              className={cn(
                'w-8 h-8 rounded-lg transition-all border-2 border-transparent',
                'hover:scale-110 hover:border-foreground/30 active:scale-95',
                'shadow-sm',
                colorClass
              )}
              onClick={() => onCellColorSelect(color)}
            />
          ))}
          <button
            className={cn(
              'w-8 h-8 rounded-lg transition-all border-2 border-dashed border-muted-foreground/40',
              'hover:scale-110 hover:border-foreground/50 active:scale-95',
              'flex items-center justify-center bg-background'
            )}
            onClick={() => onCellColorSelect(null)}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {candidateColors.map(({ color, class: colorClass }) => (
            <button
              key={color}
              className={cn(
                'w-8 h-8 rounded-lg transition-all border-2',
                selectedCandidateColor === color
                  ? 'border-foreground scale-110'
                  : 'border-transparent',
                'hover:scale-110 hover:border-foreground/30 active:scale-95',
                'shadow-sm',
                colorClass
              )}
              onClick={() => onCandidateColorChange(color)}
            />
          ))}
          <button
            className={cn(
              'w-8 h-8 rounded-lg transition-all border-2',
              selectedCandidateColor === null
                ? 'border-foreground scale-110 border-dashed'
                : 'border-dashed border-muted-foreground/40',
              'hover:scale-110 hover:border-foreground/50 active:scale-95',
              'flex items-center justify-center bg-background'
            )}
            onClick={() => onCandidateColorChange(null)}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
      
      {/* 候选数染色提示 */}
      {activeTab === 'candidate' && selectedCandidateColor && (
        <p className="text-xs text-muted-foreground">
          点击盘面上的候选数进行染色
        </p>
      )}
    </div>
  );
};
