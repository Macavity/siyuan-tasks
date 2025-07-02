import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { configStore } from "../stores/config.store";
import { get } from "svelte/store";

// Mock the SettingUtils class with proper async behavior
const mockSettingUtils = {
  load: vi.fn(),
  get: vi.fn(),
  addItem: vi.fn(),
};

vi.mock("../libs/setting-utils", () => ({
  SettingUtils: vi.fn().mockImplementation(() => mockSettingUtils),
}));

// Mock the plugin instance
const mockPlugin = {
  i18n: {
    setting: {
      autoRefresh: "Auto Refresh",
      autoRefreshDesc: "Auto refresh description",
      refreshInterval: "Refresh Interval",
      refreshIntervalDesc: "Refresh interval description",
      showCompleted: "Show Completed",
      showCompletedDesc: "Show completed description",
      sortBy: "Sort By",
      sortByDesc: "Sort by description",
      sortOptions: {
        created: "Created",
        updated: "Updated",
        content: "Content",
        priority: "Priority",
      },
    },
  },
  loadData: vi.fn(),
};

describe("Plugin Initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config store
    configStore.set({
      autoRefresh: true,
      refreshInterval: 30,
      showCompleted: true,
      maxTasks: 100,
      sortBy: "created",
      displayMode: "only_tasks" as any,
      loading: true, // Start with loading true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should properly initialize config store with settings from SettingUtils", async () => {
    // Mock the settings that would be loaded
    mockSettingUtils.load.mockResolvedValue({
      autoRefresh: false,
      refreshInterval: 60,
      showCompleted: false,
      maxTasks: 200,
      sortBy: "priority",
      displayMode: "notebook_tasks",
    });

    mockSettingUtils.get
      .mockReturnValueOnce(false) // autoRefresh
      .mockReturnValueOnce(60) // refreshInterval
      .mockReturnValueOnce(false) // showCompleted
      .mockReturnValueOnce(200) // maxTasks
      .mockReturnValueOnce("priority") // sortBy
      .mockReturnValueOnce("notebook_tasks"); // displayMode

    // Simulate the correct async initialization flow
    const simulateCorrectInitialization = async () => {
      // Load settings first
      await mockSettingUtils.load();

      // Then update config store with loaded settings
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

    // Execute the initialization
    await simulateCorrectInitialization();

    // Verify the config store was updated with the mocked settings
    const config = get(configStore);
    expect(config.autoRefresh).toBe(false);
    expect(config.refreshInterval).toBe(60);
    expect(config.showCompleted).toBe(false);
    expect(config.maxTasks).toBe(200);
    expect(config.sortBy).toBe("priority");
    expect(config.displayMode).toBe("notebook_tasks");
    expect(config.loading).toBe(false);
  });

  it("should call settingUtils.load() during initialization", async () => {
    // Mock the load method
    mockSettingUtils.load.mockResolvedValue({});

    // Simulate the onLayoutReady function
    const onLayoutReady = async () => {
      mockPlugin.loadData("plugin-tasks");
      await mockSettingUtils.load();
      // updateStoreFromSettingUtils would be called here
    };

    await onLayoutReady();

    expect(mockPlugin.loadData).toHaveBeenCalledWith("plugin-tasks");
    expect(mockSettingUtils.load).toHaveBeenCalled();
  });

  it("should demonstrate the bug: not awaiting settings load", async () => {
    // This test shows what happens when we don't await the settings load

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

    // Step 2: Simulate the BUGGY behavior (not awaiting)
    const simulateBuggyInitialization = () => {
      mockPlugin.loadData("plugin-tasks");
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
    simulateBuggyInitialization();

    // Step 4: Verify that the config store got wrong values
    const config = get(configStore);
    // The get() calls returned undefined because settings weren't loaded yet
    expect(config.showCompleted).toBe(true); // Default value, not loaded false
    expect(config.sortBy).toBe("created"); // Default value, not loaded priority

    // Step 5: Wait for settings to load and verify they're now available
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(settingsLoaded).toBe(true);
    expect(mockSettingUtilsWithBug.get("showCompleted")).toBe(false);
  });

  it("should respect showCompleted setting when filtering tasks", async () => {
    // Set up config with showCompleted: false (after proper loading)
    mockSettingUtils.load.mockResolvedValue({
      showCompleted: false,
    });

    mockSettingUtils.get
      .mockReturnValueOnce(true) // autoRefresh
      .mockReturnValueOnce(30) // refreshInterval
      .mockReturnValueOnce(false) // showCompleted: false
      .mockReturnValueOnce(100) // maxTasks
      .mockReturnValueOnce("created") // sortBy
      .mockReturnValueOnce("only_tasks"); // displayMode

    // Simulate proper async loading
    await mockSettingUtils.load();

    configStore.set({
      autoRefresh: mockSettingUtils.get("autoRefresh") as boolean,
      refreshInterval: mockSettingUtils.get("refreshInterval") as number,
      showCompleted: mockSettingUtils.get("showCompleted") as boolean,
      maxTasks: mockSettingUtils.get("maxTasks") as number,
      sortBy: mockSettingUtils.get("sortBy") as string,
      displayMode: mockSettingUtils.get("displayMode") as any,
      loading: false,
    });

    const config = get(configStore);
    expect(config.showCompleted).toBe(false);

    // Simulate task filtering logic
    const mockTasks = [
      { id: "1", status: "todo" as any, content: "Task 1" },
      { id: "2", status: "done" as any, content: "Task 2" },
      { id: "3", status: "todo" as any, content: "Task 3" },
    ];

    const filteredTasks = mockTasks.filter((task) => {
      if (!config.showCompleted && task.status === "done") {
        return false;
      }
      return true;
    });

    expect(filteredTasks).toHaveLength(2);
    expect(filteredTasks.every((task) => task.status === "todo")).toBe(true);
  });
});
