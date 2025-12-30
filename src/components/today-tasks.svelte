<script lang="ts">
  import { type I18N } from '../types/i18n';
  import { TaskStatus, type TaskItem } from '../types/tasks';
  import TaskItemComponent from './task-item.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { i18nStore } from '@/stores/i18n.store';
  import { taskStore } from '@/stores/task.store';
  import { configStore } from '@/stores/config.store';
  import Chevron from '@/components/ui/chevron.svelte';
  import { FolderStateService } from '@/services/folder-state.service';

  interface Props {
    tasks: TaskItem[];
    searchText?: string;
    onTaskUpdated?: () => void;
  }

  let { tasks, searchText = '', onTaskUpdated }: Props = $props();

  // Globals
  let i18n = $derived($i18nStore as I18N);
  let showCompleted = $derived($configStore.showCompleted);
  let sortBy = $derived($configStore.sortBy);

  // State for expansion
  let isExpanded = $state(true);

  // Filter tasks that are marked for today
  let todayTasks = $derived(() => {
    let list = tasks.filter(task => task.isToday === true);
    // Apply search filter
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(t => t.fcontent.toLowerCase().includes(q));
    }
    // Apply completed visibility
    if (!showCompleted) {
      list = list.filter(t => t.status !== TaskStatus.DONE);
    }
    // Sort according to settings
    list = taskStore.sortTasks(list, sortBy);
    return list;
  });

  // Check if there are any today tasks
  let hasTodayTasks = $derived(() => todayTasks().length > 0);

  // Drag and drop state
  let isDragOver = $state(false);
  let isDragging = $state(false);

  // Global drag event listeners
  let dragStartHandler: (e: DragEvent) => void;
  let dragEndHandler: (e: DragEvent) => void;

  onMount(async () => {
    isExpanded = await FolderStateService.isTodayFolderExpanded();

    // Track when dragging starts globally
    dragStartHandler = () => {
      isDragging = true;
    };
    
    dragEndHandler = () => {
      isDragging = false;
      isDragOver = false;
    };
    
    document.addEventListener('dragstart', dragStartHandler);
    document.addEventListener('dragend', dragEndHandler);
    
    // Listen for dragover on document to detect any drag activity
    document.addEventListener('dragover', (e) => {
      e.preventDefault(); // This is crucial to prevent drag cancellation
      if (!isDragging) {
        isDragging = true;
      }
    });
    
    // Also listen for drop on document to handle cases where drop happens outside our drop zone
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      isDragging = false;
      isDragOver = false;
    });
    
    // Prevent scroll interference during drag
    document.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });
  });

  onDestroy(() => {
    if (dragStartHandler) {
      document.removeEventListener('dragstart', dragStartHandler);
    }
    if (dragEndHandler) {
      document.removeEventListener('dragend', dragEndHandler);
    }
  });

  // Handle drag over/leave/drop on header (drop zone)
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }
  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    isDragging = false;
    const taskId = event.dataTransfer?.getData('text/plain');
    if (taskId) {
      try {
        await taskStore.addTaskToToday(taskId);
        onTaskUpdated?.();
      } catch (error) {
        console.error('Failed to add task to today:', error);
      }
    }
  }

  async function toggleExpanded() {
    isExpanded = !isExpanded;
    await FolderStateService.setTodayFolderExpanded(isExpanded);
  }
</script>

<div class="today-tasks-section">
  <div
    class="today-header {isDragOver || isDragging ? 'drag-over' : ''}"
    role="button"
    tabindex="0"
    aria-expanded={isExpanded}
    aria-controls="today-panel"
    aria-label={i18n.todayTasks?.addToToday || "Today's tasks drop zone"}
    aria-describedby="today-drop-hint"
    aria-busy={isDragOver}
    onclick={toggleExpanded}
    onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleExpanded())}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <div class="today-title" role="heading" aria-level="4">
      <div class="tree-toggle">
        <Chevron expanded={isExpanded} />
      </div>
      <svg class="icon" width="16" height="16">
        <use href="#iconCalendar"></use>
      </svg>
      <span>{i18n.todayTasks?.title || "Today's Tasks"}</span>
      <span class="task-count">({todayTasks().length})</span>
      <span id="today-drop-hint" class="visually-hidden">{i18n.todayTasks?.addToToday || 'Drop tasks here to add to today'}</span>
    </div>
    <div class="expand-icon" aria-hidden="true">
      <svg class="icon" width="12" height="12">
        <use href={isExpanded ? "#iconChevronUp" : "#iconChevronDown"}></use>
      </svg>
    </div>
  </div>
  
  {#if isExpanded && hasTodayTasks()}
    <div id="today-panel" class="today-tasks-list" role="region" aria-label={i18n.todayTasks?.title || "Today's Tasks"}>
      {#each todayTasks() as task (task.id)}
        <div role="listitem">
          <TaskItemComponent {task} showMeta={false} onTaskUpdated={onTaskUpdated} />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .today-tasks-section {
    margin-bottom: 0.1rem;
  }

  .today-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--b3-theme-surface);
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
    border: 2px dashed transparent;
  }
  .today-header.drag-over {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-container);
  }

  .today-header:hover {
    background: var(--b3-theme-surface-hover);
  }

  .today-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 14px;
    color: var(--b3-theme-on-surface);
  }

  .tree-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
  }

  .task-count {
    font-weight: normal;
    color: var(--b3-theme-on-surface-variant);
    font-size: 12px;
  }

  .expand-icon {
    color: var(--b3-theme-on-surface-variant);
  }

  .today-tasks-list {
    padding: 0 1.4rem;
    background: var(--b3-theme-surface-variant);
    border-radius: 0 0 4px 4px;
  }

  .today-tasks-list :global(.task-item) {
    margin: 0 8px 4px 8px;
  }

  .today-tasks-list :global(.task-item:last-child) {
    margin-bottom: 0;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
