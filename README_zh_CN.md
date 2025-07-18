# 思源任务列表插件

[English Version](./README.md)
[Changelog](./CHANGELOG.md)

受 Obsidian 任务管理启发。显示一个面板，列出所有笔记本中的全部任务。

## 功能

- 在可停靠面板中列出所有任务
- 点击可跳转到对应任务
- 支持自动和手动刷新
- **任务优先级系统**：以 Jira 风格的双/单箭头图标直观显示优先级
- **任务排序**：可按创建时间、更新时间、内容或优先级排序

## 最新版本更新

### [1.3.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.3.0)

- **任务数量限制设置**：在设置中添加任务数量限制，以防大量旧任务影响性能
- **新的设置对话框**：改进的设置界面，提供更好的用户体验
- **树形结构**：允许在树形结构中显示任务的父文档和/或笔记本
- **表情符号图标**：笔记本和文档显示其表情符号图标（暂不支持自定义图标）

## 演示

<video src="asset/demo.mp4" controls width="600"></video>

[下载或在线播放演示视频](asset/demo.mp4)

## 任务优先级系统

本插件支持优先级系统，利用思源的表情符号建议便捷输入，并以简洁的箭头图标显示：

### 优先级等级

- **紧急** （双箭头向上）：输入 `:!!` 插入 ‼️
- **高** （单箭头向上）：输入 `:!` 插入 ❗
- **普通**（无图标）：默认优先级
- **等待** （沙漏）：输入 `/wait` 插入 ⏳

### 示例用法

```markdown
- [ ] 高优先级 ❗ 任务
- [ ] ‼️ 紧急任务，需要立即处理
- [ ] ⏳ 等待任务（稍后处理）
- [ ] 普通任务（默认优先级）
```

你可以在思源中输入 `:!`，系统会自动建议 ❗/‼️ 图标。

优先级标识会被自动检测，并在任务列表面板中以简洁的箭头图标显示，同时文档中仍保留原始表情符号。

## 任务排序

可通过插件设置按不同标准对任务排序：

- **创建时间**：按任务创建时间排序（最早优先）
- **更新时间**：按任务最后修改时间排序（最新优先）
- **内容**：按任务文本字母顺序排序
- **优先级**：按优先级排序（紧急 → 高 → 普通 → 等待）

排序偏好会被保存，并自动应用于所有任务视图。

## 树形结构

任务现在可以以层次化的树形结构显示，展示其父文档和笔记本。此功能帮助您理解每个任务的上下文，并在知识库中更高效地导航。

### 树形显示选项

- **显示父文档**：为每个任务显示文档路径
- **显示父笔记本**：为每个任务显示笔记本名称
- **组合视图**：同时显示文档和笔记本层次结构

树形结构让您能够：

- 一眼了解任务上下文
- 快速导航到相关文档
- 按来源位置组织任务

## 未来计划

- 支持在面板中直接标记任务完成/未完成
- 增加任务截止时间
- 按优先级筛选任务
