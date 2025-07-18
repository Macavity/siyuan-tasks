<script lang="ts">
  import { type App, openTab } from 'siyuan';
  import { type TaskItem } from '../types/tasks';
  import { TaskStatus, TaskPriority } from '../types/tasks';

  interface Props {
    app: App;
    task: TaskItem;
    showMeta?: boolean;
  }

  let { app, task, showMeta = false }: Props = $props();

  function handleTaskClick() {
    if (task.root_id) {
      openTab({
        app: app,
        doc: {
          id: task.root_id,
          zoomIn: false,
        }
      });
    }
  }

  function getPriorityIconId(): string | null {
    switch (task.priority) {
      case TaskPriority.URGENT:
        return 'priorityUrgent';
      case TaskPriority.HIGH:
        return 'priorityHigh';
      case TaskPriority.WAIT:
        return 'priorityWait';
      case TaskPriority.NORMAL:
      default:
        return null;
    }
  }
</script>

<span 
  class="task-item {task.status}" 
  role="button"
  tabindex="0"
  onclick={handleTaskClick}
  onkeydown={(e) => e.key === 'Enter' && handleTaskClick()}
  aria-label="Open task: {task.fcontent}"
>
  <div class="task-checkbox">
    <input 
      type="checkbox" 
      checked={task.status === TaskStatus.DONE} 
      disabled
    />
  </div>
  <div class="task-content">
    <div class="task-text">
      {#if getPriorityIconId()}
        <svg class="priority-icon" width="16" height="16">
          <use href="#{getPriorityIconId()}" />
        </svg>
      {/if}
      {task.text}
    </div>
    {#if showMeta}
      <div class="task-meta">
        {task.boxName} / {task.docPath}
      </div>
    {/if}
  </div>
</span>

<style>
  .task-item {
    display: flex;
    align-items: flex-start;
    padding: 0 2px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
  }

  .task-item:hover {
    background-color: var(--b3-theme-surface-hover);
  }

  .task-item.done {
    opacity: 0.7;
  }

  .task-checkbox {
    margin-right: 8px;
    margin-top: 0;
    align-self: flex-start;
  }

  .task-content {
    flex: 1;
    min-width: 0;
  }

  .task-text {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 4px;
    word-break: break-word;
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .priority-icon {
    flex-shrink: 0;
    margin-top: 0.1875rem;
  }

  .task-meta {
    font-size: 12px;
    color: var(--b3-theme-on-surface-variant);
    opacity: 0.8;
  }
</style> 