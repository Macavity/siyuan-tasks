<script lang="ts">
  import { onMount } from 'svelte';
  import { lsNotebooks, getHPathByID, sql } from '../api';
  import { openTab } from 'siyuan';
  import Settings from './settings.svelte';
  import { type I18N } from '../types/i18n';

  interface Props {
    app: any;
    i18n: I18N;
  }

  let { app, i18n }: Props = $props();

  interface TaskItem {
    id: string;
    markdown: string;
    content: string;
    box: string;
    boxName: string;
    root_id: string;
    path: string;
    created: string;
    updated: string;
    type: string;
    subtype: string;
    status: 'todo' | 'done';
    docPath?: string;
  }

  interface DocInfo {
    id: string;
    rootID: string;
    name: string;
  }

  interface BoxInfo {
    box: string;
    name: string;
  }

  // State
  let tasks: TaskItem[] = [];
  let loading = false;
  let error = '';
  let currentRange: 'doc' | 'box' | 'workspace' = 'doc';
  let taskStatus: 'all' | 'todo' | 'done' = 'all';
  let searchText = '';
  let isExpanded = true;
  let currentDocInfo: DocInfo = { id: '', rootID: '', name: '' };
  let currentBoxInfo: BoxInfo = { box: '', name: '' };
  let notebooksCache: any[] = [];
  let showSettings = false;

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
  async function fetchTasks() {
    loading = true;
    error = '';

    try {
      // Build SQL query based on current range and status
      let sqlQuery = "SELECT * FROM blocks WHERE type = 'i' AND subtype = 't'";
      
      if (taskStatus === 'todo') {
        sqlQuery += " AND markdown LIKE '* [ ]%'";
      } else if (taskStatus === 'done') {
        sqlQuery += " AND markdown LIKE '* [_]%' AND markdown NOT LIKE '* [ ]%'";
      }

      if (currentRange === 'doc' && currentDocInfo.rootID) {
        sqlQuery += ` AND root_id = '${currentDocInfo.rootID}'`;
      } else if (currentRange === 'box' && currentBoxInfo.box) {
        sqlQuery += ` AND box = '${currentBoxInfo.box}'`;
      }

      sqlQuery += " ORDER BY created ASC LIMIT 2000";

      const tasksResult = await sql(sqlQuery);
      
      if (!tasksResult || tasksResult.length === 0) {
        tasks = [];
        return;
      }

      // Process tasks and add metadata
      const processedTasks: TaskItem[] = [];
      for (const task of tasksResult) {
        const notebookName = await getNotebookName(task.box);
        const docPath = await getDocumentHPath(task.root_id);
        
        processedTasks.push({
          ...task,
          boxName: notebookName,
          docPath: docPath,
          status: task.markdown.includes('* [ ]') ? 'todo' : 'done'
        });
      }

      tasks = processedTasks;
    } catch (err) {
      const errorObj = err as Error;
      console.error('Error fetching tasks:', errorObj);
      error = errorObj.message || 'Unknown error';
    } finally {
      loading = false;
    }
  }

  async function getNotebookName(boxId: string): Promise<string> {
    if (notebooksCache.length === 0) {
      try {
        const response = await lsNotebooks();
        notebooksCache = response.notebooks || [];
      } catch (err) {
        console.error('Error fetching notebooks:', err);
        return 'Unknown Notebook';
      }
    }
    
    const notebook = notebooksCache.find(nb => nb.id === boxId);
    return notebook ? notebook.name : 'Unknown Notebook';
  }

  async function getDocumentHPath(docId: string): Promise<string> {
    if (!docId) return 'Unknown Document';
    try {
      const response = await getHPathByID(docId);
      return response || 'Unknown Document';
    } catch (err) {
      console.error('Error fetching document path:', err);
      return 'Error/Unknown Document';
    }
  }

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
    fetchTasks();
  }

  function refreshData() {
    fetchTasks();
  }

  function setCurrentDocInfo(docId: string) {
    // This would need to be implemented based on your app structure
    currentDocInfo = { id: docId, rootID: docId, name: 'Current Document' };
  }

  function setCurrentBoxInfo(boxId: string) {
    const notebook = notebooksCache.find(nb => nb.id === boxId);
    currentBoxInfo = { 
      box: boxId, 
      name: notebook ? notebook.name : 'Unknown Notebook' 
    };
  }

  // Lifecycle
  onMount(() => {
    fetchTasks();
    
    // Set up event listeners for document/notebook changes
    const handleProtyleSwitch = (e: any) => {
      if (e.detail?.protyle?.block?.rootID) {
        setCurrentDocInfo(e.detail.protyle.block.rootID);
      }
      if (e.detail?.protyle?.notebookId) {
        setCurrentBoxInfo(e.detail.protyle.notebookId);
      }
      fetchTasks();
    };

    // Listen for protyle switch events
    app.eventBus?.on('switch-protyle', handleProtyleSwitch);

    return () => {
      app.eventBus?.off('switch-protyle', handleProtyleSwitch);
    };
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
          <span class="task-status" on:click={toggleTaskStatus}>
            ({taskStatusMap[taskStatus]})
          </span>
        </h3>
      </div>
      
      <div class="btn-list">
        <button class="btn-icon" on:click={refreshData} title={i18n.options?.refresh || 'Refresh'}>
          <svg class="icon">
            <use xlink:href="#iconRefresh"></use>
          </svg>
        </button>
        
        <button class="btn-icon" on:click={() => isExpanded = !isExpanded} title={isExpanded ? 'Collapse' : 'Expand'}>
          <svg class="icon">
            <use xlink:href={isExpanded ? '#iconMin' : '#iconMax'}></use>
          </svg>
        </button>
        
        <button class="btn-icon" on:click={toggleTaskStatus} title={i18n.options?.switch || 'Switch Status'}>
          <svg class="icon">
            <use xlink:href="#iconRepeat"></use>
          </svg>
        </button>
        
        <button class="btn-icon" on:click={() => showSettings = true} title={i18n.setting?.title || 'Settings'}>
          <svg class="icon">
            <use xlink:href="#iconSettings"></use>
          </svg>
        </button>
      </div>
    </div>

    <!-- Range Tabs -->
    <div class="range-tabs">
      <button 
        class="tab-btn {currentRange === 'doc' ? 'active' : ''}" 
        on:click={() => { currentRange = 'doc'; fetchTasks(); }}
      >
        {i18n.range?.doc || 'Document'} ({taskCounts.doc})
      </button>
      <button 
        class="tab-btn {currentRange === 'box' ? 'active' : ''}" 
        on:click={() => { currentRange = 'box'; fetchTasks(); }}
      >
        {i18n.range?.box || 'Notebook'} ({taskCounts.box})
      </button>
      <button 
        class="tab-btn {currentRange === 'workspace' ? 'active' : ''}" 
        on:click={() => { currentRange = 'workspace'; fetchTasks(); }}
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
        <button on:click={fetchTasks}>Retry</button>
      </div>
    {:else if filteredTasks.length === 0}
      <div class="empty">
        <span>{i18n.noTasksFound || 'No tasks found'}</span>
      </div>
    {:else}
      <div class="task-list">
        {#each filteredTasks as task (task.id)}
          <div 
            class="task-item {task.status}" 
            on:click={() => handleTaskClick(task)}
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
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Settings Modal -->
  {#if showSettings}
    <div class="settings-overlay" on:click={() => showSettings = false}>
      <div class="settings-container" on:click|stopPropagation>
        <Settings 
          {app} 
          {i18n} 
          onClose={() => showSettings = false} 
        />
      </div>
    </div>
  {/if}
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

  .settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .settings-container {
    padding: 20px;
  }
</style> 