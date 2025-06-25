<script lang="ts">
  import { type I18N } from '../types/i18n';
  import { TaskRange } from '../types/tasks';

  interface Props {
    i18n: I18N;
    currentRange: TaskRange;
    taskCounts: { doc: number; box: number; workspace: number };
    onRangeChange: (range: TaskRange) => void;
  }

  let { i18n, currentRange, taskCounts, onRangeChange }: Props = $props();
</script>

<div class="range-tabs">
  <button 
    class="tab-btn {currentRange === TaskRange.DOC ? 'active' : ''}" 
    onclick={() => onRangeChange(TaskRange.DOC)}
  >
    {i18n.range?.doc || 'Document'} ({taskCounts.doc})
  </button>
  <button 
    class="tab-btn {currentRange === TaskRange.BOX ? 'active' : ''}" 
    onclick={() => onRangeChange(TaskRange.BOX)}
  >
    {i18n.range?.box || 'Notebook'} ({taskCounts.box})
  </button>
  <button 
    class="tab-btn {currentRange === TaskRange.WORKSPACE ? 'active' : ''}" 
    onclick={() => onRangeChange(TaskRange.WORKSPACE)}
  >
    {i18n.range?.workspace || 'Workspace'} ({taskCounts.workspace})
  </button>
</div>

<style>
  .range-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
    padding: 0 12px;
    box-sizing: border-box;
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
    box-sizing: border-box;
    min-width: 0;
  }

  .tab-btn.active {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border-color: var(--b3-theme-primary);
  }

  .tab-btn:hover:not(.active) {
    background-color: var(--b3-theme-surface-hover);
  }
</style> 