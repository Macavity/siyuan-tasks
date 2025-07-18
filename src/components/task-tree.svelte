<script lang="ts">
  import { type App } from 'siyuan';
  import { type GroupedTasks, TaskDisplayMode } from '../types/tasks';
  import TaskItemComponent from './task-item.svelte';
  import { NotebookService } from '../services/notebook.service';

  interface Props {
    app: App;
    groupedTasks: GroupedTasks;
    displayMode: TaskDisplayMode;
  }

  let { app, groupedTasks, displayMode }: Props = $props();

  // State for expanded/collapsed items - expanded by default
  let expandedNotebooks = $state<Set<string>>(new Set());
  let expandedDocuments = $state<Set<string>>(new Set());

  // Initialize expanded state when groupedTasks changes
  $effect(() => {
    // Expand all notebooks by default
    const newExpandedNotebooks = new Set<string>();
    const newExpandedDocuments = new Set<string>();
    
    for (const [boxId] of Object.entries(groupedTasks)) {
      newExpandedNotebooks.add(boxId);
    }
    
    // Expand all documents by default
    for (const [, group] of Object.entries(groupedTasks)) {
      for (const [docId] of Object.entries(group.documents)) {
        newExpandedDocuments.add(docId);
      }
    }
    
    expandedNotebooks = newExpandedNotebooks;
    expandedDocuments = newExpandedDocuments;
  });

  // Toggle notebook expansion
  function toggleNotebook(boxId: string) {
    const newSet = new Set(expandedNotebooks);
    if (newSet.has(boxId)) {
      newSet.delete(boxId);
    } else {
      newSet.add(boxId);
    }
    expandedNotebooks = newSet;
  }

  // Toggle document expansion
  function toggleDocument(docId: string) {
    const newSet = new Set(expandedDocuments);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    expandedDocuments = newSet;
  }
</script>

<div class="task-tree">
  {#each Object.entries(groupedTasks) as [boxId, group] (boxId)}
    <div class="tree-node notebook-node">
      <div 
        class="tree-header notebook-header" 
        class:expanded={expandedNotebooks.has(boxId)}
        onclick={() => toggleNotebook(boxId)}
        onkeydown={(e) => e.key === 'Enter' && toggleNotebook(boxId)}
        tabindex="0"
        role="button"
        aria-expanded={expandedNotebooks.has(boxId)}
      >
        <div class="tree-toggle">
          <svg class="chevron{expandedNotebooks.has(boxId) ? ' expanded' : ''}" width="12" height="12" viewBox="0 0 12 12">
            <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="tree-icon">
          {#await NotebookService.getNotebookIcon(boxId) then icon}
            {icon}
          {:catch}
            🗃
          {/await}
        </div>
        <div class="tree-label">
          {group.notebook}
        </div>
      </div>
      
      {#if expandedNotebooks.has(boxId)}
        <div class="tree-content">
          {#if displayMode === TaskDisplayMode.NOTEBOOK_TASKS}
            <!-- NOTEBOOK_TASKS: Show tasks directly under notebook -->
            {#each Object.entries(group.documents) as [docId, docGroup] (docId)}
              {#each docGroup.tasks as task (task.id)}
                <div class="tree-task" style="padding-left: 20px;">
                  <TaskItemComponent {app} {task} />
                </div>
              {/each}
            {/each}
          {:else}
            <!-- NOTEBOOK_DOCUMENT_TASKS: Show full tree structure -->
            {#each Object.entries(group.documents) as [docId, docGroup] (docId)}
              <div class="tree-node document-node">
                <div 
                  class="tree-header document-header" 
                  class:expanded={expandedDocuments.has(docId)}
                  onclick={() => toggleDocument(docId)}
                  onkeydown={(e) => e.key === 'Enter' && toggleDocument(docId)}
                  tabindex="0"
                  role="button"
                  aria-expanded={expandedDocuments.has(docId)}
                >
                  <div class="tree-toggle">
                        <svg class="chevron {expandedDocuments.has(docId) ? 'expanded' : ''}" width="12" height="12">
                          <use href="#iconRight" />
                        </svg>
                  </div>
                  <div class="tree-icon">
                    {#await NotebookService.getDocumentIcon(docId) then icon}
                      {icon}
                    {:catch}
                      📄
                    {/await}
                  </div>
                  <div class="tree-label">
                    {docGroup.docPath}
                  </div>
                </div>
                
                {#if expandedDocuments.has(docId)}
                  <div class="tree-content">
                    {#each docGroup.tasks as task (task.id)}
                      <div class="tree-task" style="padding-left: 1.6rem;">
                        <TaskItemComponent {app} {task}/>
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

  .chevron {
    transition: transform 0.2s ease;
    fill: var(--b3-theme-on-surface-variant);
  }
  .chevron.expanded {
    transform: rotate(90deg);
  }
</style> 