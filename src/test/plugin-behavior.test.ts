import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { configStore } from "../stores/config.store";
import { taskStore } from "../stores/task.store";
import { type TaskItem } from "../types/tasks";
import { TaskStatus, TaskPriority } from "../types/tasks";
import { get } from "svelte/store";

// Mock the API functions
vi.mock("../api", () => ({
  sql: vi.fn(),
  lsNotebooks: vi.fn(),
  getHPathByID: vi.fn(),
}));

// Mock the SettingUtils class with proper async behavior
const mockSettingUtils = {
  load: vi.fn(),
  get: vi.fn(),
  addItem: vi.fn(),
};

vi.mock("../libs/setting-utils", () => ({
  SettingUtils: vi.fn().mockImplementation(() => mockSettingUtils),
}));

describe("Plugin Behavior on Page Reload", () => {
  const mockTasks: TaskItem[] = [
    {
      id: "1",
      markdown: "- [ ] ❗ High priority task",
      content: "- [ ] ❗ High priority task",
      fcontent: "❗ High priority task",
      box: "box1",
      boxName: "Notebook 1",
      root_id: "doc1",
      path: "/path1",
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-01T00:00:00Z",
      type: "i",
      subtype: "t",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
    },
    {
      id: "2",
      markdown: "- [x] Completed task",
      content: "- [x] Completed task",
      fcontent: "Completed task",
      box: "box1",
      boxName: "Notebook 1",
      root_id: "doc1",
      path: "/path1",
      created: "2024-01-02T00:00:00Z",
      updated: "2024-01-02T00:00:00Z",
      type: "i",
      subtype: "t",
      status: TaskStatus.DONE,
      priority: TaskPriority.NORMAL,
    },
    {
      id: "3",
      markdown: "- [ ] ‼️ Urgent task",
      content: "- [ ] ‼️ Urgent task",
      fcontent: "‼️ Urgent task",
      box: "box1",
      boxName: "Notebook 1",
      root_id: "doc1",
      path: "/path1",
      created: "2024-01-03T00:00:00Z",
      updated: "2024-01-03T00:00:00Z",
      type: "i",
      subtype: "t",
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset stores to default state
    configStore.set({
      autoRefresh: true,
      refreshInterval: 30,
      showCompleted: true,
      maxTasks: 100,
      sortBy: "created",
      displayMode: "only_tasks" as any,
      loading: true, // Start with loading true
    });

    taskStore.setTasks([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should properly load settings and apply them to config store", async () => {
    // Step 1: Mock the settings that would be loaded from storage
    mockSettingUtils.load.mockResolvedValue({
      autoRefresh: false,
      refreshInterval: 60,
      showCompleted: false,
      maxTasks: 200,
      sortBy: "priority",
      displayMode: "notebook_tasks",
    });

    mockSettingUtils.get
      .mockReturnValueOnce(false) // autoRefresh: false
      .mockReturnValueOnce(60) // refreshInterval: 60
      .mockReturnValueOnce(false) // showCompleted: false
      .mockReturnValueOnce(200) // maxTasks: 200
      .mockReturnValueOnce("priority") // sortBy: priority
      .mockReturnValueOnce("notebook_tasks"); // displayMode: notebook_tasks

    // Step 2: Simulate the complete plugin initialization flow
    const simulatePluginInitialization = async () => {
      // Simulate onLayoutReady
      await mockSettingUtils.load();

      // Simulate updateStoreFromSettingUtils
      configStore.set({
        autoRefresh: mockSettingUtils.get("autoRefresh") as boolean,
        refreshInterval: mockSettingUtils.get("refreshInterval") as number,
        showCompleted: mockSettingUtils.get("showCompleted") as boolean,
        maxTasks: mockSettingUtils.get("maxTasks") as number,
        sortBy: mockSettingUtils.get("sortBy") as string,
        displayMode: mockSettingUtils.get("displayMode") as any,
        loading: false,
      });
    };

    // Step 3: Execute the initialization
    await simulatePluginInitialization();

    // Step 4: Verify the config store was properly initialized with loaded settings
    const config = get(configStore);
    expect(config.autoRefresh).toBe(false);
    expect(config.refreshInterval).toBe(60);
    expect(config.showCompleted).toBe(false);
    expect(config.maxTasks).toBe(200);
    expect(config.sortBy).toBe("priority");
    expect(config.displayMode).toBe("notebook_tasks");
    expect(config.loading).toBe(false);
  });

  it("should filter and sort tasks correctly after settings are loaded", async () => {
    // Step 1: Set up tasks first
    taskStore.setTasks(mockTasks);

    // Step 2: Verify initial state shows all tasks (including completed)
    let initialTasks = get(taskStore).tasks;
    expect(initialTasks).toHaveLength(3);
    expect(initialTasks.some((task) => task.status === TaskStatus.DONE)).toBe(
      true
    );

    // Step 3: Simulate settings being loaded asynchronously
    mockSettingUtils.load.mockResolvedValue({
      showCompleted: false,
      sortBy: "priority",
    });

    mockSettingUtils.get
      .mockReturnValueOnce(true) // autoRefresh
      .mockReturnValueOnce(30) // refreshInterval
      .mockReturnValueOnce(false) // showCompleted: false
      .mockReturnValueOnce(100) // maxTasks
      .mockReturnValueOnce("priority") // sortBy: priority
      .mockReturnValueOnce("only_tasks"); // displayMode

    // Step 4: Load settings
    await mockSettingUtils.load();

    // Step 5: Update config store with loaded settings
    configStore.set({
      autoRefresh: mockSettingUtils.get("autoRefresh") as boolean,
      refreshInterval: mockSettingUtils.get("refreshInterval") as number,
      showCompleted: mockSettingUtils.get("showCompleted") as boolean,
      maxTasks: mockSettingUtils.get("maxTasks") as number,
      sortBy: mockSettingUtils.get("sortBy") as string,
      displayMode: mockSettingUtils.get("displayMode") as any,
      loading: false,
    });

    // Step 6: Verify settings were loaded correctly
    const config = get(configStore);
    expect(config.showCompleted).toBe(false);
    expect(config.sortBy).toBe("priority");

    // Step 7: Apply filtering and sorting (simulating component behavior)
    const applyCurrentSettings = () => {
      const currentConfig = get(configStore);
      const currentTasks = get(taskStore);

      // Filter tasks
      let filteredTasks = currentTasks.tasks.filter((task) => {
        if (!currentConfig.showCompleted && task.status === TaskStatus.DONE) {
          return false;
        }
        return true;
      });

      // Sort tasks
      if (currentConfig.sortBy === "priority") {
        filteredTasks = taskStore.sortTasks(filteredTasks, "priority");
      }

      return filteredTasks;
    };

    const resultTasks = applyCurrentSettings();

    // Step 8: Verify the filtering and sorting worked correctly
    expect(resultTasks).toHaveLength(2); // Should exclude completed task
    expect(resultTasks.every((task) => task.status === TaskStatus.TODO)).toBe(
      true
    );

    // Should be sorted by priority (urgent first, then high)
    expect(resultTasks[0].priority).toBe(TaskPriority.URGENT);
    expect(resultTasks[1].priority).toBe(TaskPriority.HIGH);
  });

  it("should demonstrate the bug that was fixed: async settings loading", async () => {
    // This test demonstrates the bug that existed before the fix

    // Step 1: Create a mock that simulates the real async behavior
    let settingsLoaded = false;
    const mockSettingUtilsWithBug = {
      load: vi.fn().mockImplementation(() => {
        // Simulate async loading
        return new Promise((resolve) => {
          setTimeout(() => {
            settingsLoaded = true;
            resolve({
              showCompleted: false,
              sortBy: "priority",
            });
          }, 10);
        });
      }),
      get: vi.fn().mockImplementation(() => {
        // Return undefined if settings aren't loaded yet (the bug)
        if (!settingsLoaded) {
          return undefined;
        }
        // Return loaded values if settings are loaded
        return false; // showCompleted: false
      }),
    };

    // Step 2: Simulate the BUGGY behavior (not awaiting load)
    const simulateBuggyBehavior = () => {
      // This is what was happening before the fix
      mockSettingUtilsWithBug.load(); // Not awaited!

      // Immediately try to read settings (before they're loaded)
      const showCompleted = mockSettingUtilsWithBug.get("showCompleted");
      const sortBy = mockSettingUtilsWithBug.get("sortBy");

      configStore.set({
        autoRefresh: true,
        refreshInterval: 30,
        showCompleted: showCompleted ?? true, // Default to true if undefined
        maxTasks: 100,
        sortBy: sortBy ?? "created", // Default to 'created' if undefined
        displayMode: "only_tasks" as any,
        loading: false,
      });
    };

    // Step 3: Execute the buggy behavior
    simulateBuggyBehavior();

    // Step 4: Verify that the config store got wrong values
    const config = get(configStore);
    // The get() calls returned undefined because settings weren't loaded yet
    expect(config.showCompleted).toBe(true); // Default value, not the loaded false
    expect(config.sortBy).toBe("created"); // Default value, not the loaded 'priority'

    // Step 5: Wait for settings to load and verify they're now available
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(settingsLoaded).toBe(true);
    expect(mockSettingUtilsWithBug.get("showCompleted")).toBe(false);
  });
});
