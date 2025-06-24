<script lang="ts">
  import { onMount } from 'svelte';
  import { type App } from 'siyuan';
  import { type I18N } from '../types/i18n';
  import { taskStore, type TaskItem } from '../stores/task.store';
  import { TaskRange, TaskStatus } from '../types/tasks';
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
    if (taskStatus === TaskStatus.TODO) {
      return task.status === TaskStatus.TODO;
    }
    if (taskStatus === TaskStatus.DONE) {
      return task.status === TaskStatus.DONE;
    }
    return true;
  }));

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
    taskStore.fetchTasks(currentRange, taskStatus);
  }

  function refreshData() {
    taskStore.fetchTasks(currentRange, taskStatus);
  }

  function handleRangeChange(range: TaskRange) {
    currentRange = range;
    taskStore.fetchTasks(currentRange, taskStatus);
  }

  function handleSearchChange(value: string) {
    searchText = value;
  }

  // Lifecycle
  onMount(() => {
    // Initial data fetch
    taskStore.fetchTasks(currentRange, taskStatus);
  });
</script>

<div class="plugin-task-list-wrap">
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
    tasks={filteredTasks}
    onRefresh={refreshData}
  />
</div>

<style>
  .plugin-task-list-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: var(--b3-font-family);
  }
</style> 