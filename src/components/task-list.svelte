<script lang="ts">
  import { onMount } from 'svelte';
  import { type App } from 'siyuan';
  import { type I18N } from '../types/i18n';
  import { taskStore } from '../stores/task.store';
  import { TaskRange, TaskStatus } from '../types/tasks';
  import { filterStateService, type FilterState } from '../libs/filter-state.service';
  import TaskHeader from './task-header.svelte';
  import RangeTabs from './range-tabs.svelte';
  import TaskSearch from './task-search.svelte';
  import TaskListContent from './task-list-content.svelte';
  import { configStore } from '../stores/config.store';

  interface Props {
    app: App;
    i18n: I18N;
  }

  let { app, i18n }: Props = $props();

  // Local state for UI
  let currentRange = $state<TaskRange>(TaskRange.DOC);
  let searchText = $state('');
  let isExpanded = $state(true);
  
  // Subscribe to store
  let currentDocInfo = $state({ id: '', rootID: '', name: '' });
  let configLoading = $state(true);

  taskStore.subscribe(state => {
    currentDocInfo = state.currentDocInfo;
  });

  configStore.subscribe(config => {
    configLoading = config.loading;
  });

  // Combined loading state
  let isInitializing = $derived(configLoading);

  // Save filter state
  function saveFilterState() {
    const state: FilterState = {
      range: currentRange,
      status: TaskStatus.ALL,
      timestamp: Date.now()
    };
    filterStateService.saveFilterState(state);
  }

  // Methods
  function refreshData() {
    taskStore.refreshTasksIfNeeded(true);
  }

  function handleRangeChange(range: TaskRange) {
    currentRange = range;
    taskStore.setCurrentRange(range);
    taskStore.refreshTasksIfNeeded(false, range, TaskStatus.ALL);
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
    
    // Sync the store's filter state
    taskStore.setCurrentRange(currentRange);
    taskStore.setCurrentStatus(TaskStatus.ALL);
    
    // If no document is open and no saved state, default to workspace filter
    if (!currentDocInfo.rootID && !filterStateService.hasSavedState()) {
      currentRange = TaskRange.WORKSPACE;
      taskStore.setCurrentRange(currentRange);
    }
    
    // The plugin will handle initial task fetching after config is loaded
  });

</script>

<div class="sy-plugin-tasks">
  {#if isInitializing}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading tasks...</div>
    </div>
  {:else}
    <TaskHeader 
      {i18n}
      {isExpanded}
      onRefresh={refreshData}
      onToggleExpanded={() => isExpanded = !isExpanded}
    />

    <RangeTabs 
      {i18n}
      {currentRange}
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
      {searchText}
      onRefresh={refreshData}
    />
  {/if}
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

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--b3-border-color);
    border-top: 3px solid var(--b3-theme-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-text {
    color: var(--b3-theme-on-surface);
    font-size: 0.9rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style> 