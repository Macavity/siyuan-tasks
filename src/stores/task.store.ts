import { writable, get } from "svelte/store";
import {
  TaskRange,
  TaskStatus,
  TaskItem,
  DocInfo,
  BoxInfo,
  Notebook,
  TaskState,
} from "@/types/tasks";
import { fetchTasksFromDB } from "../services/task-query.service";
import { TaskFactory } from "../services/task-factory.service";
import { TaskProcessingService } from "../services/task-processing.service";
import { NotebookService } from "../services/notebook.service";
import { configStore } from "./config.store";
import { TaskMetadataService } from "@/services/task-metadata.service";
import { Logger } from "@/services/logger.service";

function createTaskStore() {
  const initialState: TaskState = {
    tasks: [],
    loading: false,
    error: "",
    currentDocInfo: { id: "", rootID: "", name: "" },
    currentBoxInfo: { box: "", name: "" },
    notebooksCache: [],
    currentRange: TaskRange.WORKSPACE,
    /**
     * Currently unused.
     * @deprecated
     */
    currentStatus: TaskStatus.ALL,
  };

  const state = writable<TaskState>(initialState);

  // Define methods that reference each other
  const setTasks = (tasks: TaskItem[]) =>
    state.update((s) => ({ ...s, tasks }));
  const setError = (error: string) => state.update((s) => ({ ...s, error }));

  const annotateTodayFlags = async (tasks: TaskItem[]): Promise<TaskItem[]> => {
    try {
      const todayIds = await TaskMetadataService.loadTodayTaskIds();
      Logger.debug("annotateTodayFlags", {
        totalTasks: tasks.length,
        todayIdsCount: todayIds.length,
        todayIdsSample: todayIds.slice(0, 10),
      });
      if (!todayIds.length) return tasks.map((t) => ({ ...t, isToday: false }));
      const todaySet = new Set(todayIds);
      const result = tasks.map((t) => ({ ...t, isToday: todaySet.has(t.id) }));
      const todayCount = result.filter((t) => t.isToday).length;
      Logger.debug("annotateTodayFlags:after", {
        todayCount,
        nonTodayCount: result.length - todayCount,
      });
      return result;
    } catch (err) {
      Logger.warn("annotateTodayFlags:error", { error: String(err) });
      // On error, just return tasks without today flags to avoid breaking UI
      return tasks.map((t) => ({ ...t, isToday: false }));
    }
  };

  const fetchTasksInternal = async (
    range: TaskRange,
    status: TaskStatus
  ): Promise<TaskItem[]> => {
    let currentState: TaskState;
    state.subscribe((s) => (currentState = s))();

    try {
      // Get current maxTasks value from config store
      const currentConfig = get(configStore);

      // As currentStatus is not used, we use showCompleted to filter tasks
      if (currentConfig.showCompleted === false) {
        status = TaskStatus.TODO;
      }

      const rawTasks = await fetchTasksFromDB(
        range,
        status,
        () => currentState!.currentDocInfo,
        () => currentState!.currentBoxInfo,
        currentConfig.maxTasks
      );
      Logger.debug("fetchTasksInternal:raw", {
        range,
        status,
        rawCount: rawTasks.length,
      });

      // Use TaskFactory to create TaskItems
      const basicTasks = await TaskFactory.createTaskItems(
        rawTasks,
        (boxId) => NotebookService.getNotebookName(boxId),
        (docId) => NotebookService.getDocumentPath(docId)
      );
      Logger.debug("fetchTasksInternal:built", {
        builtCount: basicTasks.length,
      });

      // Annotate with today flags from metadata
      const withToday = await annotateTodayFlags(basicTasks);
      const todayCount = withToday.filter((t) => t.isToday).length;
      Logger.info("fetchTasksInternal:annotated", {
        total: withToday.length,
        todayCount,
      });
      return withToday;
    } catch (err) {
      const errorObj = err as Error;
      console.error("Error fetching tasks:", errorObj);
      setError(errorObj.message || "Unknown error");
      return [];
    }
  };

  const refreshTasksIfNeeded = async (
    force = false,
    range?: TaskRange,
    status?: TaskStatus
  ): Promise<void> => {
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
      // Fetch fresh data from backend (includes today flag annotation)
      const freshTasks = await fetchTasksInternal(targetRange, targetStatus);

      // Update store if forced, data changed, or this is a user-initiated action
      const changed = TaskProcessingService.hasTasksChanged(
        currentState!.tasks,
        freshTasks
      );
      if (force || range || status || changed) {
        Logger.info("refreshTasksIfNeeded:update", {
          force,
          range: targetRange,
          status: targetStatus,
          changed,
          newCount: freshTasks.length,
          todayCount: freshTasks.filter((t) => t.isToday).length,
        });
        setTasks(freshTasks);
      } else {
        Logger.debug("refreshTasksIfNeeded:skip", {
          newCount: freshTasks.length,
        });
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
  };

  // Today management helpers (update metadata and in-memory state)
  const addTaskToToday = async (taskId: string) => {
    await TaskMetadataService.addTaskToToday(taskId);
    state.update((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, isToday: true } : t
      ),
    }));
    Logger.info("addTaskToToday:updated", { taskId });
  };

  const removeTaskFromToday = async (taskId: string) => {
    await TaskMetadataService.removeTaskFromToday(taskId);
    state.update((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, isToday: false } : t
      ),
    }));
    Logger.info("removeTaskFromToday:updated", { taskId });
  };

  const toggleTaskToday = async (taskId: string) => {
    const newValue = await TaskMetadataService.toggleTaskToday(taskId);
    state.update((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, isToday: newValue } : t
      ),
    }));
    Logger.info("toggleTaskToday:updated", { taskId, isToday: newValue });
    return newValue;
  };

  return {
    ...state,

    // Actions
    setLoading: (loading: boolean) => state.update((s) => ({ ...s, loading })),
    setError,
    setTasks,
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

    // Complex actions
    refreshTasksIfNeeded,
    fetchTasksInternal,

    // Today helpers
    addTaskToToday,
    removeTaskFromToday,
    toggleTaskToday,

    // Delegate to TaskProcessingService
    sortTasks: TaskProcessingService.sortTasks,
    getTasksForDisplayMode: TaskProcessingService.groupTasksForDisplay,
    isGroupedTasks: TaskProcessingService.isGroupedTasks,
  };
}

export const taskStore = createTaskStore();
