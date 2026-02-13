# Cursor 项目内配置说明

Cursor 和 VS Code 在「项目级配置」上的行为不完全一致，可以按下面方式在项目内生效配置。

## 1. 使用 `.cursor/settings.json`（推荐）

- **路径**：项目根目录下的 `.cursor/settings.json`
- Cursor 会读取此文件作为**当前项目**的编辑器设置。
- 建议把希望在本项目内生效的配置写在这里（格式与 VS Code 的 `settings.json` 相同）。

当前已与 `.vscode/settings.json` 对齐（format on save、tabSize、formatter 等）。

## 2. 使用 `.vscode/settings.json`

- Cursor 基于 VS Code，理论上会读取 `.vscode/settings.json` 作为工作区设置。
- **前提**：必须用 **File → Open Folder** 打开**项目根目录**，而不是只打开单个文件。
- 若发现 Cursor 没有应用 `.vscode` 下的配置，请以「打开文件夹」方式重新打开本项目，或改用 `.cursor/settings.json`。

## 3. 项目内 AI 规则：`.cursor/rules/`

- 项目专属的 AI 规则放在 `.cursor/rules/` 目录下。
- 可配置按目录、文件类型等生效的规则，详见 [Cursor Rules 文档](https://docs.cursor.com/context/rules-for-ai)。

## 4. 全局用户配置（非项目内）

- 用户级配置路径（所有项目共用）：
  - **macOS**：`~/Library/Application Support/Cursor/User/settings.json`
  - **Linux**：`~/.config/Cursor/User/settings.json`
  - **Windows**：`%APPDATA%\Cursor\User\settings.json`

---

**总结**：若希望配置「只在当前项目生效」，请维护 **`.cursor/settings.json`**，并确保用「打开文件夹」方式打开项目；`.vscode/settings.json` 可继续保留给 VS Code 和团队其他编辑器使用。
