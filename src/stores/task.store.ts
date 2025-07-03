import { writable } from "svelte/store";
import {
  TaskRange,
  TaskStatus,
  TaskDisplayMode,
  TaskItem,
  DocInfo,
  BoxInfo,
  Notebook,
  TaskState,
  GroupedTasks,
} from "../types/tasks";
import { fetchTasksFromDB } from "../services/task-query.service";
import { TaskFactory } from "../services/task-factory.service";
import { TaskProcessingService } from "../services/task-processing.service";
import { NotebookService } from "../services/notebook.service";

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

  const state = writable<TaskState>(initialState);

  return {
    ...state,

    // Actions
    setLoading: (loading: boolean) => state.update((s) => ({ ...s, loading })),
    setError: (error: string) => state.update((s) => ({ ...s, error })),
    setTasks: (tasks: TaskItem[]) => state.update((s) => ({ ...s, tasks })),
    setCurrentDocInfo: (docInfo: DocInfo) =>
      state.update((s) => ({ ...s, currentDocInfo: docInfo })),
    setCurrentBoxInfo: (boxInfo: BoxInfo) =>
      state.update((s) => ({ ...s, currentBoxInfo: boxInfo })),
    setNotebooksCache: (notebooks: Notebook[]) =>
      state.update((s) => ({ ...s, notebooksCache: notebooks })),
    setCurrentRange: (range: TaskRange) =>
      state.update((s) => ({ ...s, currentRange: range })),
    setCurrentStatus: (status: TaskStatus) =>
      state.update((s) => ({ ...s, currentStatus: status })),

    // Smart refresh that only updates if something changed
    async refreshTasksIfNeeded(
      force = false,
      range?: TaskRange,
      status?: TaskStatus
    ): Promise<void> {
      let currentState: TaskState;
      state.subscribe((s) => (currentState = s))();

      // Use provided parameters or current state
      const targetRange = range ?? currentState!.currentRange;
      const targetStatus = status ?? currentState!.currentStatus;

      // Set loading state if this is a user-initiated action
      if (range || status) {
        state.update((s) => ({ ...s, loading: true, error: "" }));
      }

      try {
        // Fetch fresh data from backend
        const freshTasks = await this.fetchTasksInternal(
          targetRange,
          targetStatus
        );

        // Update store if forced, data changed, or this is a user-initiated action
        if (
          force ||
          range || // User-initiated action always updates
          status || // User-initiated action always updates
          TaskProcessingService.hasTasksChanged(currentState!.tasks, freshTasks)
        ) {
          this.setTasks(freshTasks);
        }

        // Clear loading state if this was a user-initiated action
        if (range || status) {
          state.update((s) => ({ ...s, loading: false }));
        }
      } catch (err) {
        const errorObj = err as Error;
        console.error("Error fetching tasks:", errorObj);
        state.update((s) => ({
          ...s,
          error: errorObj.message || "Unknown error",
          loading: false,
        }));
      }
    },

    // Internal method to fetch tasks without updating store
    async fetchTasksInternal(
      range: TaskRange,
      status: TaskStatus
    ): Promise<TaskItem[]> {
      let currentState: TaskState;
      state.subscribe((s) => (currentState = s))();

      try {
        const rawTasks = await fetchTasksFromDB(
          range,
          status,
          () => currentState!.currentDocInfo,
          () => currentState!.currentBoxInfo
        );

        // Use TaskFactory to create TaskItems
        return await TaskFactory.createTaskItems(
          rawTasks,
          (boxId) => NotebookService.getNotebookName(boxId),
          (docId) => NotebookService.getDocumentPath(docId)
        );
      } catch (err) {
        const errorObj = err as Error;
        console.error("Error fetching tasks:", errorObj);
        this.setError(errorObj.message || "Unknown error");
        return [];
      }
    },

    // Delegate to TaskProcessingService
    sortTasks: TaskProcessingService.sortTasks,
    getTasksForDisplayMode: TaskProcessingService.groupTasksForDisplay,
    isGroupedTasks: TaskProcessingService.isGroupedTasks,
  };
}

export const taskStore = createTaskStore();
