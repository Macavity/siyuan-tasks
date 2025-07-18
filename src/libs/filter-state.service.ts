import { TaskRange, TaskStatus } from "../types/tasks";

export interface FilterState {
  range: TaskRange;
  status: TaskStatus;
  timestamp: number;
}

const STORAGE_KEY = "siyuan-tasks-filter-state";

export class FilterStateService {
  private static instance: FilterStateService;

  private constructor() {}

  static getInstance(): FilterStateService {
    if (!FilterStateService.instance) {
      FilterStateService.instance = new FilterStateService();
    }
    return FilterStateService.instance;
  }

  loadSavedFilter(): FilterState {
    const defaultState: FilterState = {
      range: TaskRange.WORKSPACE,
      status: TaskStatus.ALL,
      timestamp: Date.now(),
    };

    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState) as FilterState;

        // Validate and use saved values, fallback to defaults if invalid
        const state: FilterState = {
          range: Object.values(TaskRange).includes(parsed.range)
            ? parsed.range
            : defaultState.range,
          status: Object.values(TaskStatus).includes(parsed.status)
            ? parsed.status
            : defaultState.status,
          timestamp: parsed.timestamp || Date.now(),
        };

        return state;
      }
    } catch (error) {
      console.warn("Failed to load saved filter state:", error);
    }

    return defaultState;
  }

  saveFilterState(state: FilterState): void {
    try {
      const stateToSave = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn("Failed to save filter state:", error);
    }
  }

  hasSavedState(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  clearSavedState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear saved filter state:", error);
    }
  }
}

// Export singleton instance
export const filterStateService = FilterStateService.getInstance();
