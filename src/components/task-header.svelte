<script lang="ts">
  import { type I18N } from '../types/i18n';
  import Button from './ui/button.svelte';

  interface Props {
    i18n: I18N;
    isExpanded: boolean;
    onRefresh: () => void;
    onToggleExpanded: () => void;
  }

  let { i18n, isExpanded, onRefresh, onToggleExpanded } = $props() as Props;
</script>

<div class="task-header">
  <div class="task-header__title">
    <div class="title-text">
      <h3>
        <svg class="icon" style="margin-right: 5px">
          <use xlink:href="#tasksDockIcon"></use>
        </svg>
        {i18n.pluginTitle || 'Task List'}
      </h3>
    </div>
    
    <div class="btn-list">
      <Button icon="iconRefresh" onClick={onRefresh} tooltip={i18n.options?.refresh || 'Refresh'}/>
      
      <Button icon={isExpanded ? 'iconContract' : 'iconExpand'} onClick={onToggleExpanded} tooltip={isExpanded ? 'Collapse' : 'Expand'}/>
    </div>
  </div>
</div>

<style>
  .task-header {
    padding: 12px 12px 0px 12px;
  }

  .task-header__title {
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

  .btn-list {
    display: flex;
    gap: 8px;
  }
</style> 