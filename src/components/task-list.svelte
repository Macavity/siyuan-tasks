<script lang="ts">
  import { onMount } from 'svelte';
  import { type App } from 'siyuan';
  import { type I18N } from '../types/i18n';
  import { taskStore, type TaskItem } from '../stores/task.store';
  import { TaskRange, TaskStatus, TaskDisplayMode } from '../types/tasks';
  import { filterStateService, type FilterState } from '../libs/filter-state.service';
  import TaskHeader from './task-header.svelte';
  import RangeTabs from './range-tabs.svelte';
  import TaskSearch from './task-search.svelte';
  import TaskListContent from './task-list-content.svelte';

  interface Props {
    app: App;
    i18n: I18N;
  }

  let { app, i18n }: Props = $props();

  // Local state for UI
  let currentRange = $state<TaskRange>(TaskRange.DOC);
  let taskStatus = $state<TaskStatus>(TaskStatus.ALL);
  let searchText = $state('');
  let isExpanded = $state(true);
  let displayMode = $state<TaskDisplayMode>(TaskDisplayMode.ONLY_TASKS);

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

  // Save filter state
  function saveFilterState() {
    const state: FilterState = {
      range: currentRange,
      status: taskStatus,
      displayMode: displayMode,
      timestamp: Date.now()
    };
    filterStateService.saveFilterState(state);
  }

  // Computed
  let filteredTasks = $derived(tasks.filter(task => {
    if (searchText && !task.markdown.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    if (taskStatus === TaskStatus.TODO) {
      return task.status === TaskStatus.TODO;
    }
    if (taskStatus === TaskStatus.DONE) {
      return task.status === TaskStatus.DONE;
    }
    return true;
  }));

  // Get tasks in the appropriate display mode
  let displayTasks = $derived(() => {
    return taskStore.getTasksForDisplayMode(filteredTasks, displayMode);
  });

  let taskCounts = $derived({
    doc: tasks.filter(t => t.root_id === currentDocInfo.rootID).length,
    box: tasks.filter(t => t.box === currentBoxInfo.box).length,
    workspace: tasks.length
  });

  // Methods
  function toggleTaskStatus() {
    const statusOrder = [TaskStatus.ALL, TaskStatus.TODO, TaskStatus.DONE];
    const currentIndex = statusOrder.indexOf(taskStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    taskStatus = statusOrder[nextIndex];
    taskStore.setCurrentStatus(taskStatus);
    taskStore.fetchTasks(currentRange, taskStatus);
    saveFilterState();
  }

  function refreshData() {
    taskStore.refreshTasksIfNeeded();
  }

  function handleRangeChange(range: TaskRange) {
    currentRange = range;
    taskStore.setCurrentRange(range);
    taskStore.fetchTasks(currentRange, taskStatus);
    saveFilterState();
  }

  function handleSearchChange(value: string) {
    searchText = value;
  }

  // Lifecycle
  onMount(() => {
    // Load saved filter state
    const savedState = filterStateService.loadSavedFilter();
    currentRange = savedState.range;
    taskStatus = savedState.status;
    displayMode = savedState.displayMode;
    
    // Sync the store's filter state
    taskStore.setCurrentRange(currentRange);
    taskStore.setCurrentStatus(taskStatus);
    
    // If no document is open and no saved state, default to workspace filter
    if (!currentDocInfo.rootID && !filterStateService.hasSavedState()) {
      currentRange = TaskRange.WORKSPACE;
      taskStore.setCurrentRange(currentRange);
    }
    
    taskStore.fetchTasks(currentRange, taskStatus);
  });
</script>

<div class="sy-plugin-tasks">
  <TaskHeader 
    {i18n}
    {taskStatus}
    {isExpanded}
    onToggleStatus={toggleTaskStatus}
    onRefresh={refreshData}
    onToggleExpanded={() => isExpanded = !isExpanded}
  />

  <RangeTabs 
    {i18n}
    {currentRange}
    {taskCounts}
    onRangeChange={handleRangeChange}
  />

  <TaskSearch 
    {i18n}
    {searchText}
    onSearchChange={handleSearchChange}
  />

  <TaskListContent 
    {app}
    {i18n}
    {loading}
    {error}
    tasks={displayTasks()}
    {displayMode}
    onRefresh={refreshData}
  />
</div>

<style>
  .sy-plugin-tasks {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: var(--b3-font-family);
    overflow-x: hidden;
    box-sizing: border-box;
  }
</style> 