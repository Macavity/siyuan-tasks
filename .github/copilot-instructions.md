# SiYuan Tasks Plugin - Copilot Instructions

You are an expert developer working on the `siyuan-tasks` plugin for SiYuan Note. This project uses **Svelte 5**, **TypeScript**, and **Vite**.

## Project Architecture
- **Entry Point**: `src/index.ts` (`TaskListPlugin` class). Handles lifecycle (`onload`, `onunload`), dock registration, and global commands.
- **UI Root**: `src/views/task-list-view.svelte` is mounted into the dock.
- **State Management**: Svelte stores in `src/stores/`.
  - `task.store.ts`: Central store for task data, loading states, and filters.
  - `config.store.ts`: Plugin settings.
- **Data Layer**:
  - `src/services/task-query.service.ts`: Executes SQL queries against SiYuan's SQLite database via `src/api.ts`.
  - `src/services/task-factory.service.ts`: Transforms raw DB blocks into rich `TaskItem` objects.
- **Styling**: SCSS (`src/index.scss`). Uses SiYuan's native CSS classes (e.g., `b3-list-item`, `fn__flex-center`) for consistency with the host app.

## Svelte 5 Conventions
- **Runes**: Use Svelte 5 runes exclusively.
  - State: `let count = $state(0);`
  - Derived: `let double = $derived(count * 2);`
  - Props: `let { prop1, prop2 }: Props = $props();`
  - Effects: `$effect(() => { ... });`
- **Events**: Use standard HTML attributes (e.g., `onclick`, `onkeydown`) instead of `on:click`.
- **Components**: Functional components. Use `mount` and `unmount` from `svelte` for manual mounting (e.g., in `index.ts`).

## Data Fetching & SiYuan API
- **SQL Queries**: Fetch data using `sql()` from `src/api.ts`.
  - Target the `blocks` table.
  - Filter by `type = 'i'` (Item) or `type = 'l'` (List) with `subtype = 't'` (Task) usually.
  - Example: `SELECT * FROM blocks WHERE type = 'i' AND subtype = 't' ...`
- **Block IDs**: SiYuan uses 22-char IDs. Always preserve them.
- **Attributes**: Task status is often stored in markdown (`- [ ]`, `- [x]`) or block attributes.

## Development Workflow
- **Build**: `pnpm build` (production) or `pnpm dev` (watch mode).
- **Link**: `pnpm make-link` links the build output to SiYuan's `data/plugins` directory.
- **Testing**: `pnpm test` runs Vitest.
- **Linting**: `pnpm lint` and `pnpm check`.

## Common Patterns
- **I18n**: Use `i18nStore` or `plugin.i18n` for localized strings.
- **Icons**: Import from `src/libs/icons.ts` or use SiYuan's SVG symbols.
- **Logging**: Use `Logger` service (`src/services/logger.service.ts`) instead of `console.log`.

## Critical Files
- `src/index.ts`: Plugin initialization.
- `src/stores/task.store.ts`: Core logic for task manipulation.
- `src/types/tasks.ts`: Domain models (`TaskItem`, `TaskStatus`).
