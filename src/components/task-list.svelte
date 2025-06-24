<script lang="ts">
  import { onMount } from 'svelte';
  import { type App, openTab } from 'siyuan';
  import { type I18N } from '../types/i18n';
  import { taskStore, type TaskItem } from '../stores/task.store';

  interface Props {
    app: App;
    i18n: I18N;
  }

  let { app, i18n }: Props = $props();

  // Local state for UI
  let currentRange = $state<'doc' | 'box' | 'workspace'>('doc');
  let taskStatus = $state<'all' | 'todo' | 'done'>('all');
  let searchText = $state('');
  let isExpanded = $state(true);

  // Subscribe to store
  let tasks = $state<TaskItem[]>([]);
  let loading = $state(false);
  let error = $state('');
  let currentDocInfo = $state({ id: '', rootID: '', name: '' });
  let currentBoxInfo = $state({ box: '', name: '' });

  taskStore.subscribe(state => {
    tasks = state.tasks;
    loading = state.loading;
    error = state.error;
    currentDocInfo = state.currentDocInfo;
    currentBoxInfo = state.currentBoxInfo;
  });

  // Computed
  let filteredTasks = $derived(tasks.filter(task => {
    if (searchText && !task.markdown.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    if (taskStatus === 'todo') {
      return task.status === 'todo';
    }
    if (taskStatus === 'done') {
      return task.status === 'done';
    }
    return true;
  }));

  let taskCounts = $derived({
    doc: tasks.filter(t => t.root_id === currentDocInfo.rootID).length,
    box: tasks.filter(t => t.box === currentBoxInfo.box).length,
    workspace: tasks.length
  });

  // Task status mapping
  const taskStatusMap = {
    all: i18n.taskStatus?.all || 'All',
    todo: i18n.taskStatus?.todo || 'Todo',
    done: i18n.taskStatus?.done || 'Done'
  };

  // Methods
  function handleTaskClick(task: TaskItem) {
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

  function getTaskText(task: TaskItem): string {
    let taskText = task.markdown || task.content || '';
    // Remove the markdown task syntax for display
    taskText = taskText.replace(/^\s*\*\s*\[[xX ]\]\s*/, '').trim();
    if (taskText.length > 100) {
      taskText = taskText.substring(0, 100) + '...';
    }
    if (!taskText) {
      taskText = 'Untitled Task (click to view)';
    }
    return taskText;
  }

  function toggleTaskStatus() {
    const statusOrder = ['all', 'todo', 'done'];
    const currentIndex = statusOrder.indexOf(taskStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    taskStatus = statusOrder[nextIndex] as 'all' | 'todo' | 'done';
    taskStore.fetchTasks(currentRange, taskStatus);
  }

  function refreshData() {
    taskStore.fetchTasks(currentRange, taskStatus);
  }

  function handleRangeChange(range: 'doc' | 'box' | 'workspace') {
    currentRange = range;
    taskStore.fetchTasks(currentRange, taskStatus);
  }

  // Lifecycle
  onMount(() => {
    // Initial data fetch
    taskStore.fetchTasks(currentRange, taskStatus);
  });
</script>

<div class="plugin-task-list-wrap">
  <!-- Header -->
  <div class="head-wrap">
    <div class="title">
      <div class="title-text">
        <h3>
          <svg class="icon" style="margin-right: 5px">
            <use xlink:href="#tasksDockIcon"></use>
          </svg>
          {i18n.pluginTitle || 'Task List'}
          <button 
            class="task-status" 
            onclick={toggleTaskStatus}
            onkeydown={(e) => e.key === 'Enter' && toggleTaskStatus()}
            aria-label="Toggle task status filter"
          >
            ({taskStatusMap[taskStatus]})
          </button>
        </h3>
      </div>
      
      <div class="btn-list">
        <button class="btn-icon" onclick={refreshData} title={i18n.options?.refresh || 'Refresh'} aria-label="Refresh tasks">
          <svg class="icon">
            <use xlink:href="#iconRefresh"></use>
          </svg>
        </button>
        
        <button class="btn-icon" onclick={() => isExpanded = !isExpanded} title={isExpanded ? 'Collapse' : 'Expand'} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          <svg class="icon">
            <use xlink:href={isExpanded ? '#iconMin' : '#iconMax'}></use>
          </svg>
        </button>
        
        <button class="btn-icon" onclick={toggleTaskStatus} title={i18n.options?.switch || 'Switch Status'} aria-label="Switch task status">
          <svg class="icon">
            <use xlink:href="#iconRepeat"></use>
          </svg>
        </button>
      </div>
    </div>

    <!-- Range Tabs -->
    <div class="range-tabs">
      <button 
        class="tab-btn {currentRange === 'doc' ? 'active' : ''}" 
        onclick={() => handleRangeChange('doc')}
      >
        {i18n.range?.doc || 'Document'} ({taskCounts.doc})
      </button>
      <button 
        class="tab-btn {currentRange === 'box' ? 'active' : ''}" 
        onclick={() => handleRangeChange('box')}
      >
        {i18n.range?.box || 'Notebook'} ({taskCounts.box})
      </button>
      <button 
        class="tab-btn {currentRange === 'workspace' ? 'active' : ''}" 
        onclick={() => handleRangeChange('workspace')}
      >
        {i18n.range?.workspace || 'Workspace'} ({taskCounts.workspace})
      </button>
    </div>

    <!-- Search -->
    <div class="search-wrap">
      <input 
        type="text" 
        bind:value={searchText}
        placeholder={i18n.searchPlaceholder || 'Search tasks...'}
        class="search-input"
      />
    </div>
  </div>

  <!-- Task List -->
  <div class="task-list-content">
    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <span>Loading tasks...</span>
      </div>
    {:else if error}
      <div class="error">
        <span>Error: {error}</span>
        <button onclick={refreshData}>Retry</button>
      </div>
    {:else if filteredTasks.length === 0}
      <div class="empty">
        <span>{i18n.noTasksFound || 'No tasks found'}</span>
      </div>
    {:else}
      <div class="task-list">
        {#each filteredTasks as task (task.id)}
          <button 
            class="task-item {task.status}" 
            onclick={() => handleTaskClick(task)}
            onkeydown={(e) => e.key === 'Enter' && handleTaskClick(task)}
            aria-label="Open task: {getTaskText(task)}"
          >
            <div class="task-checkbox">
              <input 
                type="checkbox" 
                checked={task.status === 'done'} 
                disabled
              />
            </div>
            <div class="task-content">
              <div class="task-text">{getTaskText(task)}</div>
              <div class="task-meta">
                {task.boxName} / {task.docPath}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .plugin-task-list-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: var(--b3-font-family);
  }

  .head-wrap {
    padding: 12px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .title-text h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
  }

  .task-status {
    margin-left: 8px;
    color: var(--b3-theme-primary);
    cursor: pointer;
    font-size: 14px;
  }

  .btn-list {
    display: flex;
    gap: 8px;
  }

  .btn-icon {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    border-radius: 4px;
    color: var(--b3-theme-on-surface);
  }

  .btn-icon:hover {
    background-color: var(--b3-theme-surface-hover);
  }

  .icon {
    width: 16px;
    height: 16px;
  }

  .range-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
  }

  .tab-btn {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    border-radius: 4px;
    font-size: 12px;
    text-align: center;
  }

  .tab-btn.active {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border-color: var(--b3-theme-primary);
  }

  .search-wrap {
    margin-bottom: 8px;
  }

  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    font-size: 14px;
  }

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

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .task-item {
    display: flex;
    align-items: flex-start;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
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