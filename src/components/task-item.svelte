<script lang="ts">
  import { type App, openTab } from 'siyuan';
  import { type TaskItem } from '../stores/task.store';
  import { TaskStatus } from '../types/tasks';

  interface Props {
    app: App;
    task: TaskItem;
  }

  let { app, task }: Props = $props();

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

  function getTaskText(): string {
    let taskText = task.markdown || task.content || '';
    // Remove any markdown task prefix (e.g., '- [ ]', '- [x]', '- [X]', '* [ ]', etc.)
    taskText = taskText.replace(/^\s*[-*]\s*\[[ xX]\]\s*/, '').trim();
    if (taskText.length > 100) {
      taskText = taskText.substring(0, 100) + '...';
    }
    if (!taskText) {
      taskText = 'Untitled Task (click to view)';
    }
    return taskText;
  }
</script>

<button 
  class="task-item {task.status}" 
  onclick={handleTaskClick}
  onkeydown={(e) => e.key === 'Enter' && handleTaskClick()}
  aria-label="Open task: {getTaskText()}"
>
  <div class="task-checkbox">
    <input 
      type="checkbox" 
      checked={task.status === TaskStatus.DONE} 
      disabled
    />
  </div>
  <div class="task-content">
    <div class="task-text">{getTaskText()}</div>
    <div class="task-meta">
      {task.boxName} / {task.docPath}
    </div>
  </div>
</button>

<style>
  .task-item {
    display: flex;
    align-items: flex-start;
    padding: 8px 12px;
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
    margin-top: 2px;
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
  }

  .task-meta {
    font-size: 12px;
    color: var(--b3-theme-on-surface-variant);
    opacity: 0.8;
  }
</style> 