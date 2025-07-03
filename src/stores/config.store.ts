import { TaskDisplayMode } from "@/types/tasks";
import { writable } from "svelte/store";

export enum PluginSetting {
  AutoRefresh = "autoRefresh",
  RefreshInterval = "refreshInterval",
  ShowCompleted = "showCompleted",
  MaxTasks = "maxTasks",
  SortBy = "sortBy",
  DisplayMode = "displayMode",
}

// Minimum refresh interval in seconds
export const MIN_REFRESH_INTERVAL = 5;

export interface PluginConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  showCompleted: boolean;
  maxTasks: number;
  sortBy: string;
  displayMode: TaskDisplayMode;
  loading: boolean;
}

function createConfigStore() {
  const { subscribe, set, update } = writable<PluginConfig>({
    autoRefresh: false,
    refreshInterval: 30,
    showCompleted: true,
    maxTasks: 2000,
    sortBy: "created",
    displayMode: TaskDisplayMode.ONLY_TASKS,
    loading: true,
  });

  return {
    subscribe,
    set,
    update,
    setLoading: (loading: boolean) =>
      update((config) => ({ ...config, loading })),
    setAutoRefresh: (value: boolean) =>
      update((config) => ({ ...config, autoRefresh: value })),
    setRefreshInterval: (value: number) =>
      update((config) => ({
        ...config,
        refreshInterval: Math.max(value, MIN_REFRESH_INTERVAL),
      })),
    setShowCompleted: (value: boolean) =>
      update((config) => ({ ...config, showCompleted: value })),
    setMaxTasks: (value: number) =>
      update((config) => ({ ...config, maxTasks: value })),
    setSortBy: (value: string) =>
      update((config) => ({ ...config, sortBy: value })),
    setDisplayMode: (value: TaskDisplayMode) =>
      update((config) => ({ ...config, displayMode: value })),
  };
}

export const configStore = createConfigStore();
