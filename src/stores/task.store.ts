import { writable } from "svelte/store";
import { lsNotebooks, getHPathByID, sql } from "../api";

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
  status: "todo" | "done";
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
    async fetchTasks(
      range: "doc" | "box" | "workspace",
      status: "all" | "todo" | "done"
    ) {
      update((state) => ({ ...state, loading: true, error: "" }));

      try {
        // Build SQL query based on current range and status
        let sqlQuery =
          "SELECT * FROM blocks WHERE type = 'i' AND subtype = 't'";

        if (status === "todo") {
          sqlQuery += " AND markdown LIKE '* [ ]%'";
        } else if (status === "done") {
          sqlQuery +=
            " AND markdown LIKE '* [_]%' AND markdown NOT LIKE '* [ ]%'";
        }

        if (range === "doc" && this.getCurrentDocInfo()?.rootID) {
          sqlQuery += ` AND root_id = '${this.getCurrentDocInfo().rootID}'`;
        } else if (range === "box" && this.getCurrentBoxInfo()?.box) {
          sqlQuery += ` AND box = '${this.getCurrentBoxInfo().box}'`;
        }

        sqlQuery += " ORDER BY created ASC LIMIT 2000";

        const tasksResult = await sql(sqlQuery);

        if (!tasksResult || tasksResult.length === 0) {
          update((state) => ({ ...state, tasks: [], loading: false }));
          return;
        }

        // Process tasks and add metadata
        const processedTasks: TaskItem[] = [];
        for (const task of tasksResult) {
          const notebookName = await this.getNotebookName(task.box);
          const docPath = await this.getDocumentHPath(task.root_id);

          processedTasks.push({
            ...task,
            boxName: notebookName,
            docPath: docPath,
            status: task.markdown.includes("* [ ]") ? "todo" : "done",
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
  };
}

export const taskStore = createTaskStore();
