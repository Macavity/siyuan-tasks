<script lang="ts">
  import { onMount } from 'svelte';
  import { lsNotebooks, getHPathByID, sql } from '../api';
  import { type I18N } from '@/types/i18n';

  export let app: any;
  export let i18n: I18N;

  interface Task {
    id: string;
    markdown: string;
    content: string;
    notebookName: string;
    docPath: string;
    docId: string;
    isChecked: boolean;
  }

  let tasks: Task[] = [];
  let loading = false;
  let error = '';

  let notebooksCache: any[] | null = null;

  async function fetchNotebooks() {
    if (notebooksCache) {
      return notebooksCache;
    }
    try {
      const response = await lsNotebooks();
      notebooksCache = response.notebooks || [];
      return notebooksCache;
    } catch (err) {
      const error = err as Error;
      console.error(i18n.errorFetchingNotebookInfo, error);
      return [];
    }
  }

  async function getNotebookName(boxId: string): Promise<string> {
    const notebooks = await fetchNotebooks();
    const notebook = notebooks.find(nb => nb.id === boxId);
    return notebook ? notebook.name : "Unknown Notebook";
  }

  async function getDocumentHPath(docId: string): Promise<string> {
    if (!docId) return "Unknown Document";
    try {
      const response = await getHPathByID(docId);
      return response || "Unknown Document";
    } catch (err) {
      const error = err as Error;
      console.error(i18n.errorFetchingDocumentPath, `ID: ${docId}`, error);
      return "Error/Unknown Document";
    }
  }

  async function fetchAndDisplayTasks() {
    loading = true;
    error = '';

    const sqlQuery = `
      SELECT id, markdown, box, root_id, updated, content, type, subtype, ial
      FROM blocks
      WHERE
      (
        ial LIKE '%"__type":"task"%' OR
        (type = 'i' AND subtype = 't') OR
        (type = 'i' AND (markdown LIKE '%- [ ] %' OR markdown LIKE '%- [x] %' OR markdown LIKE '%- [X] %')) OR
        (type = 'i' AND (markdown LIKE '%* [ ] %' OR markdown LIKE '%* [x] %' OR markdown LIKE '%* [X] %'))
      )
      AND type != 'tb' AND subtype NOT IN ('ts', 'tc', 'th', 'td')
      AND (content NOT LIKE '%%\`\`\`%%' OR markdown NOT LIKE '%%\`\`\`%%')
      ORDER BY updated DESC
      LIMIT 200
    `;

    try {
      const tasksResult = await sql(sqlQuery);

      if (!tasksResult || tasksResult.length === 0) {
        tasks = [];
        return;
      }

      const processedTasks: Task[] = [];
      for (const task of tasksResult) {
        let isTaskBlock = false;
        let taskTextContent = task.content || "";
        let taskMarkdownContent = task.markdown || "";

        if (task.ial && task.ial.includes('"__type":"task"')) {
          isTaskBlock = true;
        } else if (task.type === 'i') {
          if (taskMarkdownContent.match(/^(\s*[-*]\s+\[[xX ]\])/)) {
            isTaskBlock = true;
          }
        }

        if (!isTaskBlock) {
          continue;
        }

        const notebookName = await getNotebookName(task.box);
        const docPath = await getDocumentHPath(task.root_id);

        processedTasks.push({
          id: task.id,
          markdown: task.markdown,
          content: task.content,
          notebookName: notebookName,
          docPath: docPath,
          docId: task.root_id,
          isChecked: task.markdown ? (task.markdown.includes("- [x]") || task.markdown.includes("- [X]")) : false,
        });
      }

      tasks = processedTasks;
    } catch (err) {
      const errorObj = err as Error;
      console.error(i18n.errorFetchingTasks, errorObj);
      error = errorObj.message || 'Unknown error';
    } finally {
      loading = false;
    }
  }

  function handleTaskClick(task: Task) {
    if (task.docId) {
      app.openTab({
        doc: {
          id: task.docId,
          zoomIn: false,
        }
      });
    }
  }

  function getTaskText(task: Task): string {
    let taskText = task.markdown || task.content || "";
    taskText = taskText.replace(/^\s*-\s*\[[xX ]\]\s*/, "").trim();
    if (taskText.length > 100) {
      taskText = taskText.substring(0, 100) + "...";
    }
    if (!taskText) {
      taskText = "Untitled Task (click to view)";
    }
    return taskText;
  }

  onMount(() => {
    fetchAndDisplayTasks();
  });
</script>

<div class="fn__flex-column fn__flex-1 fn__full-height">
  <div class="toolbar task-list-toolbar">
    <button 
      class="b3-button b3-button--outline fn__flex-center" 
      on:click={fetchAndDisplayTasks}
      disabled={loading}
    >
      {loading ? 'Loading...' : i18n.refreshTasks}
    </button>
    <span class="fn__flex-1"></span>
  </div>
  
  <div class="fn__flex-1 plugin-sample__custom-dock" style="overflow-y: auto; padding: 8px;">
    {#if loading}
      <div class="ft__on-surface-3 ft__smaller ft__align-center" style="margin-top:20px;">
        Loading tasks...
      </div>
    {:else if error}
      <div class="ft__on-surface-3 ft__smaller ft__align-center error-message" style="margin-top:20px;">
        Error loading tasks: {error}
      </div>
    {:else if tasks.length === 0}
      <div class="ft__on-surface-3 ft__smaller ft__align-center" style="margin-top:20px;">
        {i18n.noTasksFound}
      </div>
    {:else}
      <ul class="b3-list b3-list--background" style="padding: 0; list-style-type: none;">
        {#each tasks as task (task.id)}
          <li 
            class="b3-list-item task-item" 
            data-task-id={task.id}
            data-doc-id={task.docId}
            on:click={() => handleTaskClick(task)}
            style="cursor: pointer;"
          >
            <div class="task-item-header">
              <input 
                type="checkbox" 
                checked={task.isChecked} 
                disabled 
                style="margin-right: 5px;"
              >
              <span class="task-text">{getTaskText(task)}</span>
            </div>
            <div class="task-item-meta ft__on-surface-3 ft__smaller">
              {task.notebookName} / {task.docPath}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .task-item {
    padding: 8px;
    border-bottom: 1px solid var(--b3-border-color);
    transition: background-color 0.2s ease;
  }

  .task-item:hover {
    background-color: var(--b3-theme-background-light);
  }

  .task-item-header {
    display: flex;
    align-items: flex-start;
    margin-bottom: 4px;
  }

  .task-text {
    flex: 1;
    word-break: break-word;
  }

  .task-item-meta {
    font-size: 0.8em;
    opacity: 0.7;
  }

  .error-message {
    color: var(--b3-theme-error);
  }
</style> 