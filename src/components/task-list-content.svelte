<script lang="ts">
  import { type App } from 'siyuan';
  import { type I18N } from '../types/i18n';
  import { type TaskItem } from '../stores/task.store';
  import { TaskDisplayMode } from '../types/tasks';
  import TaskItemComponent from './task-item.svelte';

  interface Props {
    app: App;
    i18n: I18N;
    loading: boolean;
    error: string;
    tasks: TaskItem[] | Record<string, { notebook: string; documents: Record<string, { docPath: string; tasks: TaskItem[] }> }>;
    displayMode: TaskDisplayMode;
    onRefresh: () => void;
  }

  let { app, i18n, loading, error, tasks, displayMode, onRefresh }: Props = $props();

  // Type guard for grouped tasks
  function isGroupedTasks(tasks: TaskItem[] | Record<string, { notebook: string; documents: Record<string, { docPath: string; tasks: TaskItem[] }> }>): tasks is Record<string, { notebook: string; documents: Record<string, { docPath: string; tasks: TaskItem[] }> }> {
    return !Array.isArray(tasks);
  }
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
  {:else if displayMode === TaskDisplayMode.ONLY_TASKS}
    {#if !isGroupedTasks(tasks) && tasks.length === 0}
      <div class="empty">
        <span>{i18n.noTasksFound || 'No tasks found'}</span>
      </div>
    {:else if !isGroupedTasks(tasks)}
      <div class="task-list">
        {#each tasks as task (task.id)}
          <TaskItemComponent {app} {task} />
        {/each}
      </div>
    {/if}
  {:else}
    {#if isGroupedTasks(tasks) && Object.keys(tasks).length === 0}
      <div class="empty">
        <span>{i18n.noTasksFound || 'No tasks found'}</span>
      </div>
    {:else if isGroupedTasks(tasks)}
      <div class="task-list">
        {#each Object.entries(tasks) as [boxId, group] (boxId)}
          <div class="notebook-group">
            <div class="notebook-header">
              <h4>{group.notebook}</h4>
            </div>
            {#each Object.entries(group.documents) as [docId, docGroup] (docId)}
              {#if displayMode === TaskDisplayMode.NOTEBOOK_DOCUMENT_TASKS}
                <div class="document-group">
                  <div class="document-header">
                    <h5>{docGroup.docPath}</h5>
                  </div>
                  <div class="document-tasks">
                    {#each docGroup.tasks as task (task.id)}
                      <TaskItemComponent {app} {task} />
                    {/each}
                  </div>
                </div>
              {:else}
                <div class="notebook-tasks">
                  {#each docGroup.tasks as task (task.id)}
                    <TaskItemComponent {app} {task} />
                  {/each}
                </div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    {/if}
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
    gap: 8px;
  }

  .notebook-group {
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    overflow: hidden;
  }

  .notebook-header {
    background: var(--b3-theme-surface);
    padding: 8px 12px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .notebook-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .document-group {
    border-bottom: 1px solid var(--b3-border-color);
  }

  .document-group:last-child {
    border-bottom: none;
  }

  .document-header {
    background: var(--b3-theme-surface-variant);
    padding: 6px 12px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .document-header h5 {
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--b3-theme-on-surface-variant);
  }

  .document-tasks, .notebook-tasks {
    padding: 4px 0;
  }
</style> 