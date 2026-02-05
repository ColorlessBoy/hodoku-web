import React from 'react';
import { Digit } from '@/types/sudoku';
import { cn } from '@/lib/utils';
import { Eraser } from 'lucide-react';

interface NumberPadProps {
  onNumberClick: (digit: Digit) => void;
  onClear: () => void;
  mode: 'normal' | 'corner' | 'center';
  onModeChange: (mode: 'normal' | 'corner' | 'center') => void;
  highlightedDigit: Digit | null;
  onHighlightDigit: (digit: Digit | null) => void;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  onNumberClick,
  onClear,
  mode,
  onModeChange,
  highlightedDigit,
  onHighlightDigit,
}) => {
  const digits: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="flex flex-col gap-4">
      {/* 模式选择 */}
      <div className="flex gap-2">
        <button
          className={cn(
            'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
            mode === 'normal'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
          onClick={() => onModeChange('normal')}
        >
          正常
        </button>
        <button
          className={cn(
            'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
            mode === 'corner'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
          onClick={() => onModeChange('corner')}
        >
          角注
        </button>
        <button
          className={cn(
            'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
            mode === 'center'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
          onClick={() => onModeChange('center')}
        >
          中心
        </button>
      </div>

      {/* 数字键盘 */}
      <div className="grid grid-cols-5 gap-2">
        {digits.map((digit) => (
          <button
            key={digit}
            className={cn(
              'aspect-square flex items-center justify-center text-xl font-semibold rounded-lg transition-all',
              'bg-card hover:bg-accent border border-border shadow-sm',
              'hover:shadow-md active:scale-95',
              highlightedDigit === digit && 'ring-2 ring-primary bg-primary/10'
            )}
            onClick={() => onNumberClick(digit)}
            onDoubleClick={() => onHighlightDigit(highlightedDigit === digit ? null : digit)}
          >
            {digit}
          </button>
        ))}
        <button
          className={cn(
            'aspect-square flex items-center justify-center rounded-lg transition-all',
            'bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 shadow-sm',
            'hover:shadow-md active:scale-95 text-destructive'
          )}
          onClick={onClear}
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        双击数字高亮所有相同数字
      </p>
    </div>
  );
};
