import { writable } from "svelte/store";
import { lsNotebooks, getHPathByID, sql } from "../api";
import { TaskRange, TaskStatus, TaskDisplayMode } from "../types/tasks";

export interface TaskItem {
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
  status: TaskStatus.TODO | TaskStatus.DONE;
  docPath?: string;
}

export interface DocInfo {
  id: string;
  rootID: string;
  name: string;
}

export interface BoxInfo {
  box: string;
  name: string;
}

export interface Notebook {
  id: string;
  name: string;
  closed?: boolean;
  [key: string]: unknown;
}

export interface TaskState {
  tasks: TaskItem[];
  loading: boolean;
  error: string;
  currentDocInfo: DocInfo;
  currentBoxInfo: BoxInfo;
  notebooksCache: Notebook[];
}

export interface GroupedTasks {
  [boxId: string]: {
    notebook: string;
    documents: {
      [docId: string]: {
        docPath: string;
        tasks: TaskItem[];
      };
    };
  };
}

function createTaskStore() {
  const initialState: TaskState = {
    tasks: [],
    loading: false,
    error: "",
    currentDocInfo: { id: "", rootID: "", name: "" },
    currentBoxInfo: { box: "", name: "" },
    notebooksCache: [],
  };

  const { subscribe, set, update } = writable<TaskState>(initialState);

  return {
    subscribe,
    set,
    update,

    // Actions
    setLoading: (loading: boolean) =>
      update((state) => ({ ...state, loading })),
    setError: (error: string) => update((state) => ({ ...state, error })),
    setTasks: (tasks: TaskItem[]) => update((state) => ({ ...state, tasks })),
    setCurrentDocInfo: (docInfo: DocInfo) =>
      update((state) => ({ ...state, currentDocInfo: docInfo })),
    setCurrentBoxInfo: (boxInfo: BoxInfo) =>
      update((state) => ({ ...state, currentBoxInfo: boxInfo })),
    setNotebooksCache: (notebooks: Notebook[]) =>
      update((state) => ({ ...state, notebooksCache: notebooks })),

    // Complex actions
    async fetchTasks(range: TaskRange, status: TaskStatus) {
      update((state) => ({ ...state, loading: true, error: "" }));
      try {
        let sqlQuery =
          "SELECT * FROM blocks WHERE type = 'i' AND subtype = 't'";

        if (range === TaskRange.DOC && this.getCurrentDocInfo()?.rootID) {
          sqlQuery += ` AND root_id = '${this.getCurrentDocInfo().rootID}'`;
        } else if (range === TaskRange.BOX && this.getCurrentBoxInfo()?.box) {
          sqlQuery += ` AND box = '${this.getCurrentBoxInfo().box}'`;
        }

        sqlQuery += " ORDER BY created ASC LIMIT 2000";

        const tasksResult = await sql(sqlQuery);
        if (!tasksResult || tasksResult.length === 0) {
          update((state) => ({ ...state, tasks: [], loading: false }));
          return;
        }

        // Filtering by markdown prefix
        function isTodo(markdown: string) {
          return /^-\s*\[ \]/.test(markdown);
        }
        function isDone(markdown: string) {
          return /^-\s*\[[xX]\]/.test(markdown);
        }

        const filtered = tasksResult.filter((task) => {
          if (status === TaskStatus.TODO) return isTodo(task.markdown);
          if (status === TaskStatus.DONE) return isDone(task.markdown);
          return isTodo(task.markdown) || isDone(task.markdown);
        });

        // Process tasks and add metadata
        const processedTasks: TaskItem[] = [];
        for (const task of filtered) {
          const notebookName = await this.getNotebookName(task.box);
          const docPath = await this.getDocumentHPath(task.root_id);
          const taskStatus: TaskStatus = isTodo(task.markdown)
            ? TaskStatus.TODO
            : isDone(task.markdown)
              ? TaskStatus.DONE
              : TaskStatus.ALL;
          processedTasks.push({
            ...task,
            boxName: notebookName,
            docPath: docPath,
            status: taskStatus,
          });
        }

        update((state) => ({
          ...state,
          tasks: processedTasks,
          loading: false,
        }));
      } catch (err) {
        const errorObj = err as Error;
        console.error("Error fetching tasks:", errorObj);
        update((state) => ({
          ...state,
          error: errorObj.message || "Unknown error",
          loading: false,
        }));
      }
    },

    async getNotebookName(boxId: string): Promise<string> {
      let state: TaskState;
      subscribe((s) => (state = s))();

      if (state!.notebooksCache.length === 0) {
        try {
          const response = await lsNotebooks();
          const notebooks = response.notebooks || [];
          update((s) => ({ ...s, notebooksCache: notebooks }));
          state = { ...state!, notebooksCache: notebooks };
        } catch (err) {
          console.error("Error fetching notebooks:", err);
          return "Unknown Notebook";
        }
      }

      const notebook = state!.notebooksCache.find((nb) => nb.id === boxId);
      return notebook ? notebook.name : "Unknown Notebook";
    },

    async getDocumentHPath(docId: string): Promise<string> {
      if (!docId) return "Unknown Document";
      try {
        const response = await getHPathByID(docId);
        return response || "Unknown Document";
      } catch (err) {
        console.error("Error fetching document path:", err);
        return "Error/Unknown Document";
      }
    },

    // Helper methods to get current state
    getCurrentDocInfo(): DocInfo {
      let state: TaskState;
      subscribe((s) => (state = s))();
      return state!.currentDocInfo;
    },

    getCurrentBoxInfo(): BoxInfo {
      let state: TaskState;
      subscribe((s) => (state = s))();
      return state!.currentBoxInfo;
    },

    // Get current display mode setting
    getDisplayMode(): TaskDisplayMode {
      // This will be called from the plugin context where we have access to settings
      // For now, return the default value
      return TaskDisplayMode.ONLY_TASKS;
    },

    // Computed methods for different display modes
    getTasksForDisplayMode(
      tasks: TaskItem[],
      displayMode: TaskDisplayMode
    ): TaskItem[] | GroupedTasks {
      if (displayMode === TaskDisplayMode.ONLY_TASKS) {
        return tasks;
      }

      // Group by notebook and optionally by document
      const groups: GroupedTasks = {};

      for (const task of tasks) {
        if (!groups[task.box]) {
          groups[task.box] = {
            notebook: task.boxName,
            documents: {},
          };
        }

        const docKey =
          displayMode === TaskDisplayMode.NOTEBOOK_DOCUMENT_TASKS
            ? task.root_id
            : "all";
        const docPath =
          displayMode === TaskDisplayMode.NOTEBOOK_DOCUMENT_TASKS
            ? task.docPath || "Unknown Document"
            : "";

        if (!groups[task.box].documents[docKey]) {
          groups[task.box].documents[docKey] = {
            docPath,
            tasks: [],
          };
        }

        groups[task.box].documents[docKey].tasks.push(task);
      }

      return groups;
    },

    // Helper method to check if tasks are grouped
    isGroupedTasks(tasks: TaskItem[] | GroupedTasks): tasks is GroupedTasks {
      return !Array.isArray(tasks);
    },
  };
}

export const taskStore = createTaskStore();
