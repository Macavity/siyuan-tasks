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
  currentRange: TaskRange;
  currentStatus: TaskStatus;
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
    currentRange: TaskRange.WORKSPACE,
    currentStatus: TaskStatus.ALL,
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
    setCurrentRange: (range: TaskRange) =>
      update((state) => ({ ...state, currentRange: range })),
    setCurrentStatus: (status: TaskStatus) =>
      update((state) => ({ ...state, currentStatus: status })),

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

    // Get current filter state
    getCurrentFilterState(): { range: TaskRange; status: TaskStatus } {
      let state: TaskState;
      subscribe((s) => (state = s))();
      return {
        range: state!.currentRange,
        status: state!.currentStatus,
      };
    },

    isGroupedTasks(tasks: TaskItem[] | GroupedTasks): tasks is GroupedTasks {
      return !Array.isArray(tasks);
    },

    // Smart refresh that only updates if something changed
    async refreshTasksIfNeeded(force = false): Promise<void> {
      let state: TaskState;
      subscribe((s) => (state = s))();

      const currentState = state!;

      // Fetch fresh data from backend with current filter settings
      const freshTasks = await this.fetchTasksInternal(
        currentState.currentRange,
        currentState.currentStatus
      );

      // Compare fresh data with current tasks
      if (force || this.hasTasksChanged(currentState.tasks, freshTasks)) {
        // Only update store if data has actually changed
        this.setTasks(freshTasks);
      }
    },

    // Compare two task arrays to see if they've changed
    hasTasksChanged(currentTasks: TaskItem[], newTasks: TaskItem[]): boolean {
      // Quick length check
      if (currentTasks.length !== newTasks.length) {
        return true;
      }

      // Compare each task by ID and key properties
      for (let i = 0; i < currentTasks.length; i++) {
        const current = currentTasks[i];
        const newTask = newTasks[i];

        if (
          current.id !== newTask.id ||
          current.markdown !== newTask.markdown ||
          current.status !== newTask.status ||
          current.updated !== newTask.updated
        ) {
          return true;
        }
      }

      return false;
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

    // Internal method to fetch tasks without updating store
    async fetchTasksInternal(
      range: TaskRange,
      status: TaskStatus
    ): Promise<TaskItem[]> {
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
          return [];
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

        return processedTasks;
      } catch (err) {
        const errorObj = err as Error;
        console.error("Error fetching tasks:", errorObj);
        this.setError(errorObj.message || "Unknown error");
        return [];
      }
    },
  };
}

export const taskStore = createTaskStore();
