<script lang="ts">
  import { type App } from 'siyuan';
  import { type I18N } from '../types/i18n';
  import { type TaskItem } from '../stores/task.store';
  import TaskItemComponent from './task-item.svelte';

  interface Props {
    app: App;
    i18n: I18N;
    loading: boolean;
    error: string;
    tasks: TaskItem[];
    onRefresh: () => void;
  }

  let { app, i18n, loading, error, tasks, onRefresh }: Props = $props();
</script>

<div class="task-list-content">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading tasks...</span>
    </div>
  {:else if error}
    <div class="error">
      <span>Error: {error}</span>
      <button onclick={onRefresh}>Retry</button>
    </div>
  {:else if tasks.length === 0}
    <div class="empty">
      <span>{i18n.noTasksFound || 'No tasks found'}</span>
    </div>
  {:else}
    <div class="task-list">
      {#each tasks as task (task.id)}
        <TaskItemComponent {app} {task} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .task-list-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .loading, .error, .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--b3-theme-on-surface-variant);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--b3-border-color);
    border-top: 2px solid var(--b3-theme-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error button {
    margin-top: 8px;
    padding: 4px 8px;
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style> 