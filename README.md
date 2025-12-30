# Siyuan Task List Plugin

[中文版](./README_zh_CN.md)
[Changelog](./CHANGELOG.md)

Inspired by task management in Obsidian. Displays a panel listing all tasks across all notebooks.

## Features

- Lists all tasks in a dockable panel.
- Click to navigate to the task.
- Automatic and manual refresh
- Group tasks by Document/Notebook
- **Task Priority System**: Visual priority indicators with Jira-style chevron icons.
- **Task Sorting**: Sort tasks by created date, updated date, content, or priority.
- **Today's Tasks**: Pin tasks to a dedicated Today section at the top, with drag & drop and context menu support.

## Changes in last release

### [1.6.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.6.0)

- Added ability to save folded state of notebook groups

### [1.5.0](https://github.com/Macavity/siyuan-tasks/releases/tag/v1.5.0)

- Fixed document icon display for nested documents with custom image icons
- Fixed Unicode emoji parsing for variation selectors (e.g., "2600-fe0f")
- Added support for custom emoji files (svg, png, jpg, gif, webp) in document icons
- Improved icon caching to preserve both emoji and image icon types
- Added German language support (de_DE)

## Demo

https://github.com/user-attachments/assets/83bee894-830a-4a88-9bc9-2354becbc8c6

## Task Priority System

The plugin supports a priority system that uses SiYuan's emoji suggestions for easy input and displays them as clean chevron icons:

### Priority Levels

- **Urgent** <svg width="16" height="16" fill="#dc2626" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 2.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 3.707 2.354 9.354a.5.5 0 1 1-.708-.708z"/><path fill-rule="evenodd" d="M7.646 6.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 7.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg> (Double chevron up): Use `:!!` to insert ‼️
- **High** <svg width="16" height="16" fill="#dc2626" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg> (Single chevron up): Use `:!` to insert ❗
- **Normal** (No icon): Default priority level
- **Wait** <svg width="16" height="16" fill="#ca8a04" viewBox="0 0 16 16"><path d="M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm0 1a5 5 0 1 0 0 10A5 5 0 0 0 8 3z" fill="#ca8a04"/><path d="M8 4v4l2.5 2.5" stroke="#ca8a04" stroke-width="1.5" fill="none"/></svg> (Hourglass): Use `/wait` to insert ⏳

### Example Usage

```markdown
- [ ] ❗ High priority task
- [ ] ‼️ Urgent task that needs immediate attention
- [ ] ⏳ Wait task (will be done later)
- [ ] Regular task (normal priority)
```

The priority indicators are automatically detected and displayed as clean chevron icons in the task list panel, while maintaining the original emoji in the document.

## Task Sorting

Tasks can be sorted by different criteria through the plugin settings:

- **Created date**: Sort by when the task was created (oldest first)
- **Updated date**: Sort by when the task was last modified (newest first)
- **Content**: Sort alphabetically by task text
- **Priority**: Sort by priority level (Urgent → High → Normal → Wait)

The sorting preference is saved and applied automatically to all task views.

## Tree Structure

Tasks can now be displayed in a hierarchical tree structure showing their parent documents and notebooks. This feature helps you understand the context of each task and navigate more efficiently through your knowledge base.

### Tree Display Options

- **Show Parent Documents**: Display the document path for each task
- **Show Parent Notebooks**: Display the notebook name for each task
- **Combined View**: Show both document and notebook hierarchy

The tree structure makes it easier to:

- Understand task context at a glance
- Navigate to related documents quickly
- Organize tasks by their source location

## Development

This project uses [pnpm](https://pnpm.io/) as the package manager.

### Setup

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### Available Scripts

- `pnpm dev` - Start development mode with hot reload
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm check` - Run TypeScript and Svelte checks
- `pnpm lint` - Run ESLint
- `pnpm validate` - Run all checks (TypeScript, Svelte, ESLint)

## Future Ideas

- Add task due time
- Allow to hide tasks from certain Notebook/Documents
- Filtering by priority level
- Mark tasks as complete/incomplete from the panel.
