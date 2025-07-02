# Siyuan Task List Plugin

[中文版](./README_zh_CN.md)

Inspired by task management in Obsidian. Displays a panel listing all tasks across all notebooks.

## Features

- Lists all tasks in a dockable panel.
- Shows task content and source (notebook/document).
- Click to navigate to the task.
- Manual refresh button.
- **Task Priority System**: Visual priority indicators with Jira-style chevron icons.
- **Task Sorting**: Sort tasks by created date, updated date, content, or priority.

## Task Priority System

The plugin supports a priority system that uses SiYuan's emoji suggestions for easy input:

### Priority Levels

- **Urgent** (🔴 Double chevron up): Use `:!!` to insert ‼️
- **High** (🔴 Single chevron up): Use `:!` to insert ❗
- **Normal** (No icon): Default priority level
- **Low** (🟢 Double chevron down): Type "low" in the task text

### Example Usage

```markdown
- [ ] ❗ High priority task
- [ ] ‼️ Urgent task that needs immediate attention
- [ ] low Low priority task
- [ ] Regular task (normal priority)
```

The priority indicators are automatically detected and displayed as clean chevron icons in the task list panel, while maintaining the original emoji in the document.

## Task Sorting

Tasks can be sorted by different criteria through the plugin settings:

- **Created date**: Sort by when the task was created (oldest first)
- **Updated date**: Sort by when the task was last modified (newest first)
- **Content**: Sort alphabetically by task text
- **Priority**: Sort by priority level (Urgent → High → Normal → Low)

The sorting preference is saved and applied automatically to all task views.

## Future Ideas

- Mark tasks as complete/incomplete from the panel.
- Add task due time
- Filtering by priority level
- Automatic refresh.
