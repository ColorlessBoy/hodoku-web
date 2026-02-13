# Command 系统重构总结

## 重构目标

将原有的配置化命令系统重构为类继承架构，解决以下问题：
1. 错误提示重复（每个命令都要手写 `err('用法: xxx')`）
2. 手动组装 `CommandConfig`
3. 缺乏类型安全的强制约束

## 核心改进

### 1. 新增基类和装饰器 (`Command.ts`)

```typescript
// 抽象基类 - 定义命令骨架
abstract class BaseCommand {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: CommandCategory;
  abstract execute(schema: SudokuSchema, args: string[]): CmdResult;

  // 模板方法 - 自动处理参数验证和错误提示
  handle(schema: SudokuSchema, args: string[]): CmdResult {
    if (args.length === 0 && this.args.length > 0 && !this.args[0].optional) {
      return err(`用法: ${this.getUsage()}`);  // 自动生成！
    }
    return this.execute(schema, args);
  }

  // 自动生成用法字符串
  getUsage(): string { ... }

  // 自动生成元数据
  getMeta(): CommandMeta { ... }
}

// 装饰器 - 简化配置
function Command(options: CommandOptions) { ... }
```

### 2. 重构后的命令定义示例

重构前（`basicCommands.ts`）:
```typescript
const cmdSet = (schema: SudokuSchema, args: string[]): CmdResult => {
  if (args.length === 0) return err('用法: s 115 327 781');  // 重复！
  // ... 逻辑
};

export const basicCommands: CommandConfig = {
  set: {
    meta: {
      name: 'set',
      aliases: ['s'],
      description: '设置格子值（行+列+数字 格式）',
      category: 'basic',
      args: [...],
      examples: ['set 115 326', 's 115 326'],
    },
    handler: cmdSet,
  },
  // ... 手动组装每个命令
};
```

重构后：
```typescript
@Command({
  name: 'set',
  aliases: ['s'],
  category: 'basic',
  description: '设置格子值（行+列+数字 格式）',
  args: [posArg],
  examples: ['set 115 326', 's 115 326'],
})
class SetCommand extends BaseCommand {
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    // 无需再写参数检查，基类已处理
    const newCells = cloneCells(schema.cells);
    // ... 只需关注业务逻辑
    return ok({ ...schema, cells: newCells });
  }
}

// 自动收集导出
const setCommand = new SetCommand();
export const basicCommands = {
  [setCommand.name]: {
    meta: setCommand.getMeta(),
    handler: setCommand.handle.bind(setCommand),
  },
};
```

## 重构优势

| 方面 | 重构前 | 重构后 |
|-----|-------|-------|
| **错误提示** | 每个命令手写 `err('用法: xxx')` | 基类 `handle()` 自动生成 |
| **用法字符串** | 手动编写 | `getUsage()` 从 `args` 自动生成 |
| **元数据** | 手动组装 | `getMeta()` 自动生成 |
| **类型安全** | 接口约束，易被绕过 | 抽象类强制实现 |
| **代码复用** | 每个命令独立 | 基类统一处理公共逻辑 |
| **注册方式** | 手动组装 `CommandConfig` | 实例化后自动收集 |

## 文件变更

### 新增文件
- `src/lib/commands/Command.ts` - 基类、装饰器和注册表

### 重构的文件
- `src/lib/commands/basicCommands.ts` - 基础命令
- `src/lib/commands/colorCommands.ts` - 染色命令
- `src/lib/commands/autoCommands.ts` - 自动填充命令
- `src/lib/commands/historyCommands.ts` - 历史命令

### 待重构的文件（保持兼容）
- `src/lib/commands/highlightCommands.ts` - 高亮命令（保持原有配置方式，仍可正常工作）
- `src/lib/commands/selectCommands.ts` - 选择命令（保持原有配置方式，仍可正常工作）

### 更新的文件
- `src/lib/commands/index.ts` - 添加新导出

## 测试结果

```bash
$ npm run test

 ✓ src/test/CommandRegistry.test.ts (5)
 ✓ src/test/CmdEngine.test.ts (5)
 ✓ src/test/SudokuEngine.test.ts (7)

 Test Files  3 passed (3)
      Tests  17 passed (17)
```

```bash
$ npm run check

====================================
✓ no errors
```

## 迁移指南

如需将现有命令迁移到新架构：

1. 导入基类和装饰器：
```typescript
import { BaseCommand, Command } from './Command';
```

2. 创建类并添加装饰器：
```typescript
@Command({
  name: 'commandName',
  aliases: ['alias'],
  category: 'category',
  description: 'Description',
  args: [...],
})
class MyCommand extends BaseCommand {
  execute(schema: SudokuSchema, args: string[]): CmdResult {
    // 实现逻辑，无需处理参数验证
  }
}
```

3. 导出配置：
```typescript
const myCommand = new MyCommand();
export const myCommands = {
  [myCommand.name]: {
    meta: myCommand.getMeta(),
    handler: myCommand.handle.bind(myCommand),
  },
};
```
