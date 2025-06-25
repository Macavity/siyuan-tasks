<script lang="ts">
  import { type I18N } from '../types/i18n';
  import { TaskStatus } from '../types/tasks';
  import Button from './ui/button.svelte';
  import Icon from './ui/icon.svelte';

  interface Props {
    i18n: I18N;
    taskStatus: TaskStatus;
    isExpanded: boolean;
    onToggleStatus: () => void;
    onRefresh: () => void;
    onToggleExpanded: () => void;
  }

  let { i18n, taskStatus, isExpanded, onToggleStatus, onRefresh, onToggleExpanded }: Props = $props();

  // Task status mapping
  const taskStatusMap = {
    [TaskStatus.ALL]: i18n.taskStatus?.all || 'All',
    [TaskStatus.TODO]: i18n.taskStatus?.todo || 'Todo',
    [TaskStatus.DONE]: i18n.taskStatus?.done || 'Done'
  };
</script>

<div class="head-wrap">
  <div class="title">
    <div class="title-text">
      <h3>
        <Icon icon="iconTasksDock" class="icon"/>
        {i18n.pluginTitle || 'Task List'}
        <button 
          class="task-status" 
          onclick={onToggleStatus}
          onkeydown={(e) => e.key === 'Enter' && onToggleStatus()}
          aria-label="Toggle task status filter"
        >
          ({taskStatusMap[taskStatus]})
        </button>
      </h3>
    </div>
    
    <div class="btn-list">
      <Button icon="iconRefresh" on:click={onRefresh} tooltip={i18n.options?.refresh || 'Refresh'}/>
      
      <Button icon={isExpanded ? 'iconContract' : 'iconExpand'} on:click={onToggleExpanded} tooltip={isExpanded ? 'Collapse' : 'Expand'}/>
      
      <Button icon="iconSoftWrap" on:click={onToggleStatus} tooltip={i18n.options?.switch || 'Switch Status'}/>
    </div>
  </div>
</div>

<style>
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
    background: none;
    border: none;
    padding: 0;
  }

  .btn-list {
    display: flex;
    gap: 8px;
  }
</style> 