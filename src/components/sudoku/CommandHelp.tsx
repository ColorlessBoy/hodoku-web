/**
 * CommandHelp - 命令帮助组件
 *
 * 动态从命令注册中心获取帮助信息，支持分类显示和搜索
 * 自动适应高度，内容过多时内部滚动，不超出视口
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { CommandCategory } from '@/lib/commands/types';

// 从命令注册中心导入
import { getAllCommands, getCategories } from '@/lib/commands/registry';

interface CommandHelpProps {
  searchable?: boolean;
  collapsible?: boolean;
}

const categoryColors: Record<CommandCategory, string> = {
  basic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  highlight: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  select: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  solve: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  fill: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  auto: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  new: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  history: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const categoryNames: Record<CommandCategory, string> = {
  basic: '基础操作',
  highlight: '高亮',
  select: '选择',
  color: '染色',
  solve: '解题技巧',
  fill: '填充',
  auto: '自动填充',
  new: '新题目',
  history: '撤销/重做',
};

export const CommandHelp: React.FC<CommandHelpProps> = ({
  searchable = true,
  collapsible = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(['basic', 'highlight']) // 默认展开常用类别
  );

  const allCommands = useMemo(() => getAllCommands(), []);
  const categories = useMemo(() => getCategories(), []);

  // 按类别分组命令
  const groupedCommands = useMemo(() => {
    const filtered = allCommands.filter((cmd) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        cmd.name.toLowerCase().includes(searchLower) ||
        cmd.aliases.some((a) => a.toLowerCase().includes(searchLower)) ||
        cmd.description.toLowerCase().includes(searchLower)
      );
    });
    console.log('filtered', filtered);
    const grouped: Record<string, typeof allCommands> = {};
    for (const cmd of filtered) {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    }
    console.log('grouped', grouped);
    return grouped;
  }, [allCommands, searchTerm]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border flex flex-col overflow-hidden h-full">
      {searchable && (
        <div className="p-2 border-b border-border flex-shrink-0">
          <input
            type="text"
            placeholder="搜索命令..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-sm rounded border border-input bg-background"
          />
        </div>
      )}

      <div className="overflow-y-auto flex-1">
        {categories.map(({ id }) => {
          const commands = groupedCommands[id];
          if (!commands || commands.length === 0) return null;

          const isExpanded = expandedCategories.has(id);
          const colorClass = categoryColors[id as CommandCategory];

          return (
            <div key={id} className="border-b border-border last:border-b-0">
              {collapsible ? (
                <button
                  onClick={() => toggleCategory(id)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', colorClass)}>
                      {categoryNames[id as CommandCategory]}
                    </span>
                    <span className="text-xs text-muted-foreground">({commands.length})</span>
                  </div>
                  <span className="text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
                </button>
              ) : (
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', colorClass)}>
                    {categoryNames[id as CommandCategory]}
                  </span>
                </div>
              )}

              {(!collapsible || isExpanded) && (
                <div className="px-3 pb-2 space-y-1">
                  {commands.map((cmd) => (
                    <div key={cmd.name} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <code className="font-semibold text-primary">{cmd.name}</code>
                        {cmd.aliases.length > 0 && (
                          <span className="text-muted-foreground">({cmd.aliases.join(', ')})</span>
                        )}
                      </div>
                      <p className="text-muted-foreground pl-1">{cmd.description}</p>
                      {cmd.examples.length > 0 && (
                        <div className="pl-1 text-[10px] text-muted-foreground/70">
                          例: {cmd.examples.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
