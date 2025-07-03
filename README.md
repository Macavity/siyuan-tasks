# Siyuan Task List Plugin

[中文版](./README_zh_CN.md)

Inspired by task management in Obsidian. Displays a panel listing all tasks across all notebooks.

## Features

- Lists all tasks in a dockable panel.
- Click to navigate to the task.
- Automatic and manual refresh
- **Task Priority System**: Visual priority indicators with Jira-style chevron icons.
- **Task Sorting**: Sort tasks by created date, updated date, content, or priority.

## Task Priority System

The plugin supports a priority system that uses SiYuan's emoji suggestions for easy input and displays them as clean chevron icons:

### Priority Levels

- **Urgent** <svg width="16" height="16" fill="#dc2626" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 2.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 3.707 2.354 9.354a.5.5 0 1 1-.708-.708z"/><path fill-rule="evenodd" d="M7.646 6.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 7.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg> (Double chevron up): Use `:!!` to insert ‼️
- **High** <svg width="16" height="16" fill="#dc2626" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg> (Single chevron up): Use `:!` to insert ❗
- **Normal** (No icon): Default priority level
- **Low** <svg width="16" height="16" fill="#16a34a" viewBox="0 0 16 16"><path d="M8 6L10 10H6L8 6Z"/><path d="M8 10L10 14H6L8 10Z"/></svg> (Double chevron down): Type "low" in the task text

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
