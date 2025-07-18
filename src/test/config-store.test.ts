import { describe, it, expect, beforeEach } from "vitest";
import {
  configStore,
  MIN_REFRESH_INTERVAL,
  PluginSetting,
} from "../stores/config.store";
import { TaskDisplayMode } from "../types/tasks";
import { get } from "svelte/store";

describe("Config Store", () => {
  beforeEach(() => {
    // Reset the store before each test
    configStore.set({
      autoRefresh: true,
      refreshInterval: 30,
      showCompleted: true,
      maxTasks: 100,
      sortBy: "created",
      displayMode: TaskDisplayMode.ONLY_TASKS,
      loading: false,
    });
  });

  it("should initialize with default values", () => {
    const config = get(configStore);

    expect(config.autoRefresh).toBe(true);
    expect(config.refreshInterval).toBe(30);
    expect(config.showCompleted).toBe(true);
    expect(config.maxTasks).toBe(100);
    expect(config.sortBy).toBe("created");
    expect(config.displayMode).toBe(TaskDisplayMode.ONLY_TASKS);
  });

  it("should update values when set is called", () => {
    configStore.set({
      autoRefresh: false,
      refreshInterval: 60,
      showCompleted: false,
      maxTasks: 200,
      sortBy: "priority",
      displayMode: TaskDisplayMode.NOTEBOOK_TASKS,
      loading: false,
    });

    const config = get(configStore);

    expect(config.autoRefresh).toBe(false);
    expect(config.refreshInterval).toBe(60);
    expect(config.showCompleted).toBe(false);
    expect(config.maxTasks).toBe(200);
    expect(config.sortBy).toBe("priority");
    expect(config.displayMode).toBe(TaskDisplayMode.NOTEBOOK_TASKS);
  });

  it("should be reactive to changes", () => {
    let configValue = get(configStore);
    expect(configValue.showCompleted).toBe(true);

    configStore.set({
      ...configValue,
      showCompleted: false,
    });

    configValue = get(configStore);
    expect(configValue.showCompleted).toBe(false);
  });

  it("should enforce minimum refresh interval when setting refreshInterval", () => {
    // Test setting a value below minimum
    configStore.setSetting(PluginSetting.RefreshInterval, 2);
    const config = get(configStore);
    expect(config.refreshInterval).toBe(MIN_REFRESH_INTERVAL);

    // Test setting a value at minimum
    configStore.setSetting(PluginSetting.RefreshInterval, MIN_REFRESH_INTERVAL);
    const config2 = get(configStore);
    expect(config2.refreshInterval).toBe(MIN_REFRESH_INTERVAL);

    // Test setting a value above minimum
    configStore.setSetting(PluginSetting.RefreshInterval, 60);
    const config3 = get(configStore);
    expect(config3.refreshInterval).toBe(60);
  });

  it("should have correct minimum refresh interval constant", () => {
    expect(MIN_REFRESH_INTERVAL).toBe(5);
  });
});
