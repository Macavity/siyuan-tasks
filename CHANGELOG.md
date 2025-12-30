# Siyuan Tasks - Changelog

### [1.6.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.6.0)

- ✨ Added ability to save folded state of notebook groups

- 新增笔记本组折叠状态保存功能

### [1.5.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.5.0)

- 🐛 Fixed document icon display for nested documents with custom image icons
- 🐛 Fixed Unicode emoji parsing for variation selectors (e.g., "2600-fe0f")
- ✨ Added support for custom emoji files (svg, png, jpg, gif, webp) in document icons
- 🔧 Improved icon caching to preserve both emoji and image icon types
- 🌐 Added German language support (de_DE)

- 修复了嵌套文档中自定义图片图标的显示问题
- 修复了Unicode表情符号解析，支持变体选择器（如"2600-fe0f"）
- 新增对自定义表情符号文件的支持（svg、png、jpg、gif、webp）
- 改进了图标缓存，同时保留表情符号和图片图标类型
- 🌐 新增德语（de_DE）语言支持

### [1.4.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.4.0)

- 🇺🇸 Today's Tasks: A dedicated section at the top of the list for tasks you mark for today
- 🇺🇸 Drag & Drop: Drag any task to the Today header to add it
- 🇺🇸 Context menu: Right-click a task to add/remove it from Today
- 🇺🇸 Settings: Toggle Today section visibility
- 🇨🇳 今日任务：在列表顶部新增“今日任务”区域，可将任务标记为今日待办
- 🇨🇳 拖放支持：将任何任务拖拽到“今日任务”标题即可添加
- 🇨🇳 右键菜单：右键任务可添加/移除“今日任务”
- 🇨🇳 设置支持：可在设置中显示/隐藏“今日任务”；搜索与排序同样应用于“今日任务”

### [1.3.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.3.0)

- 🇺🇸 Add limit of tasks to settings in case of lots of old tasks
- 🇺🇸 New Settings Dialog
- 🇺🇸 Allow showing parent documents and/or notebooks for tasks in a tree structure
- 🇺🇸 Notebooks and Documents show their emoji icons if set (no support for custom icons yet)
- 🇨🇳 在设置中添加任务数量限制，以防大量旧任务影响性能
- 🇨🇳 新的设置对话框
- 🇨🇳 允许在树形结构中显示任务的父文档和/或笔记本
- 🇨🇳 笔记本和文档显示其表情符号图标（暂不支持自定义图标）

### [1.2.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.2.0)

- 🇺🇸 Dark Mode Support: Task list entries now properly support dark mode themes for better visibility and consistency across different SiYuan themes
- 🇨🇳 深色模式支持：任务列表条目现在正确支持深色模式主题，在不同思源主题下提供更好的可见性和一致性

### [1.1.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.1.0)

- 🇺🇸 New `/wait` command: Inserts ⏳ emoji at cursor position to mark tasks as waiting status (lower priority than normal tasks)
- 🇺🇸 Fixed tag display: Hash tags now display as `#MyHash` instead of `#MyHash#` (SiYuan internal format)
- 🇺🇸 Updated priority system: Replaced "Low" priority with "Wait" priority for better task management
- 🇨🇳 新增 `/wait` 命令：在光标位置插入 ⏳ 表情符号，将任务标记为等待状态（优先级低于普通任务）
- 🇨🇳 修复标签显示：哈希标签现在显示为 `#MyHash` 而不是 `#MyHash#`（思源内部格式）
- 🇨🇳 更新优先级系统：用"等待"优先级替换"低"优先级，提供更好的任务管理

### [1.0.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.0.0)

- 🇺🇸 Initial version with task list panel functionality
- 🇺🇸 Priority system with visual indicators
- 🇺🇸 Task sorting and filtering capabilities
- 🇨🇳 初始版本，包含任务列表面板功能
- 🇨🇳 带视觉指示器的优先级系统
- 🇨🇳 任务排序和筛选功能
