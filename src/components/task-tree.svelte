<script lang="ts">
  import { type GroupedTasks, TaskDisplayMode } from '../types/tasks';
  import TaskItemComponent from './task-item.svelte';
  import { NotebookService } from '../services/notebook.service';
  import Chevron from '@/components/ui/chevron.svelte';
  import { FolderStateService } from '@/services/folder-state.service';
  import { onMount } from 'svelte';

  interface Props {
    groupedTasks: GroupedTasks;
    displayMode: TaskDisplayMode;
  }

  let { groupedTasks, displayMode }: Props = $props();

  // State for folded items (persisted)
  let foldedIds = $state<Set<string>>(new Set());

  onMount(async () => {
    const ids = await FolderStateService.loadFoldedDirs();
    foldedIds = new Set(ids);
  });

  // Toggle notebook expansion
  async function toggleNotebook(boxId: string) {
    const newSet = new Set(foldedIds);
    const wasFolded = newSet.has(boxId);

    if (wasFolded) {
      newSet.delete(boxId); // Unfold
    } else {
      newSet.add(boxId); // Fold
    }
    foldedIds = newSet;
    await FolderStateService.setFolderExpanded(boxId, wasFolded);
  }

  // Toggle document expansion
  async function toggleDocument(docId: string) {
    const newSet = new Set(foldedIds);
    const wasFolded = newSet.has(docId);

    if (wasFolded) {
      newSet.delete(docId); // Unfold
    } else {
      newSet.add(docId); // Fold
    }
    foldedIds = newSet;
    await FolderStateService.setFolderExpanded(docId, wasFolded);
  }
</script>

<div class="task-tree">
  {#each Object.entries(groupedTasks) as [boxId, group] (boxId)}
    <div class="tree-node notebook-node">
      <div 
        class="tree-header notebook-header" 
        class:expanded={!foldedIds.has(boxId)}
        onclick={() => toggleNotebook(boxId)}
        onkeydown={async (e) => e.key === 'Enter' && await toggleNotebook(boxId)}
        tabindex="0"
        role="button"
        aria-expanded={!foldedIds.has(boxId)}
      >
        <div class="tree-toggle">
          <Chevron expanded={!foldedIds.has(boxId)} />
        </div>
        <div class="tree-icon">
          {#await NotebookService.getNotebookIcon(boxId) then icon}
            {#if icon.kind === 'image'}
              <img src={icon.src} alt="" />
            {:else}
              {icon.text}
            {/if}
          {:catch}
            🗃
          {/await}
        </div>
        <div class="tree-label">
          {group.notebook}
        </div>
      </div>
      
      {#if !foldedIds.has(boxId)}
        <div class="tree-content">
          {#if displayMode === TaskDisplayMode.NOTEBOOK_TASKS}
            <!-- NOTEBOOK_TASKS: Show tasks directly under notebook -->
            {#each Object.entries(group.documents) as [docId, docGroup] (docId)}
              {#each docGroup.tasks as task (task.id)}
                <div class="tree-task" style="padding-left: 20px;">
                  <TaskItemComponent {task} />
                </div>
              {/each}
            {/each}
          {:else}
            <!-- NOTEBOOK_DOCUMENT_TASKS: Show full tree structure -->
            {#each Object.entries(group.documents) as [docId, docGroup] (docId)}
              <div class="tree-node document-node">
                <div 
                  class="tree-header document-header" 
                  class:expanded={!foldedIds.has(docId)}
                  onclick={() => toggleDocument(docId)}
                  onkeydown={async (e) => e.key === 'Enter' && await toggleDocument(docId)}
                  tabindex="0"
                  role="button"
                  aria-expanded={!foldedIds.has(docId)}
                >
                  <div class="tree-toggle">
                    <Chevron expanded={!foldedIds.has(docId)} />
                  </div>
                  <div class="tree-icon">
                    {#await NotebookService.getDocumentIcon(docId) then icon}
                      {#if icon.kind === 'image'}
                        <img src={icon.src} alt="" />
                      {:else}
                        {icon.text}
                      {/if}
                    {:catch}
                      📄
                    {/await}
                  </div>
                  <div class="tree-label">
                    {docGroup.docPath}
                  </div>
                </div>
                
                {#if !foldedIds.has(docId)}
                  <div class="tree-content">
                    {#each docGroup.tasks as task (task.id)}
                      <div class="tree-task" style="padding-left: 1.6rem;">
                        <TaskItemComponent {task}/>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .task-tree {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tree-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0 8px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;
    min-height: 32px;
  }

  .tree-header:hover {
    background-color: var(--b3-theme-surface-hover);
  }

  .notebook-header {
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .document-header {
    font-weight: 500;
    color: var(--b3-theme-on-surface-variant);
  }

  .tree-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    font-size: 14px;
  }
  .tree-icon img {
    width: 16px;
    height: 16px;
    display: block;
  }

  .tree-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tree-task {
    padding: 0.2rem 0;
  }
  .tree-node.document-node {
    margin-left: 1rem;
  }

</style> 