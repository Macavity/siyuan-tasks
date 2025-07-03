import { Plugin, Model, Dock, IEventBusMap, IPluginDockTab } from "siyuan";
import "@/index.scss";

import TaskList from "@/components/task-list.svelte";

import { SettingUtils } from "./libs/setting-utils";
import { icons } from "./libs/icons";
import { i18nStore } from "./stores/i18n.store";
import { taskStore } from "./stores/task.store";
import { type I18N } from "./types/i18n";
import { TaskDisplayMode } from "./types/tasks";
import { mount } from "svelte";
import { SiyuanEvents } from "./types/siyuan-events";
import {
  configStore,
  PluginSetting,
  MIN_REFRESH_INTERVAL,
  type PluginConfig,
} from "./stores/config.store";
import { Logger } from "./services/logger.service";

const STORAGE_NAME = "plugin-tasks";
const TASK_DOCK_TYPE = "task-list-panel-dock";

type TEventSwitchProtyle = CustomEvent<
  IEventBusMap[SiyuanEvents.SWITCH_PROTYLE]
>;

export default class TaskListPlugin extends Plugin {
  customTab: () => Model;
  private settingUtils: SettingUtils;
  private taskDock: { config: IPluginDockTab; model: Dock };
  private refreshTimer: NodeJS.Timeout | null = null;

  async onload() {
    this.addIcons(icons);
    i18nStore.set(this.i18n as unknown as I18N);

    this.addCommand({
      langKey: "showTaskList",
      hotkey: "⇧⌘T",
      globalCallback: () => {
        // Toggle the task list dock
        if (this.taskDock && this.taskDock.model.element) {
          // This will toggle the dock visibility
          const el = this.taskDock.model.element;
          el.style.display = el.style.display === "none" ? "block" : "none";
        }
      },
    });

    this.initialiseSettings();

    this.taskDock = this.addDock({
      config: {
        position: "RightTop",
        size: { width: 300, height: 0 },
        icon: "tasksDockIcon",
        title: this.i18n.dockTitle,
        hotkey: "⇧⌘T",
      },
      data: {
        // Any initial data for the dock, if needed
      },
      type: TASK_DOCK_TYPE,
      resize() {
        // console.log("Task list dock resized");
      },
      update() {
        // console.log("Task list dock update");
      },
      init: (dockInstance: Dock) => {
        // Create Svelte component for task list
        mount(TaskList, {
          target: dockInstance.element,
          props: {
            app: this.app,
            i18n: this.i18n as unknown as I18N,
          },
        });
      },
      destroy() {
        // console.log("Task list dock destroyed");
      },
    });

    // Set up event listeners for document and notebook changes
    this.eventBus.on(SiyuanEvents.SWITCH_PROTYLE, (e: TEventSwitchProtyle) => {
      // Update current document and notebook info in the store
      if (e.detail?.protyle?.block?.rootID) {
        const docInfo = {
          id: e.detail.protyle.block.rootID,
          rootID: e.detail.protyle.block.rootID,
          name: "Current Document", // TODO: Get actual document name
        };
        taskStore.setCurrentDocInfo(docInfo);
        // Logger.debug("Switched to document:", e.detail.protyle.block.rootID);
      }
      if (e.detail?.protyle?.notebookId) {
        const boxInfo = {
          box: e.detail.protyle.notebookId,
          name: "Current Notebook", // TODO: Get actual notebook name
        };
        taskStore.setCurrentBoxInfo(boxInfo);
        // Logger.debug("Switched to notebook:", e.detail.protyle.notebookId);
      }

      // Refresh tasks while preserving the current filter level
      // Use the smart refresh function that only updates if needed
      taskStore.refreshTasksIfNeeded();
    });

    // Subscribe to config changes to manage the refresh timer
    configStore.subscribe((config) => {
      this.handleConfigChange(config);
    });
  }

  private handleConfigChange(config: PluginConfig) {
    if (config.loading) {
      // Don't start timer while config is still loading
      return;
    }

    if (config.autoRefresh) {
      this.startRefreshTimer(config.refreshInterval);
    } else {
      this.stopRefreshTimer();
    }
  }

  private startRefreshTimer(intervalSeconds: number) {
    // Stop any existing timer first
    this.stopRefreshTimer();

    // Ensure minimum interval
    const interval = Math.max(intervalSeconds, MIN_REFRESH_INTERVAL) * 1000;

    this.refreshTimer = setInterval(() => {
      taskStore.refreshTasksIfNeeded();
    }, interval);
  }

  private stopRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private initialiseSettings() {
    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
      callback: (/* data */) => {
        // Settings changed, refresh tasks if needed
        this.updateStoreFromSettingUtils();
        taskStore.refreshTasksIfNeeded(true);
      },
    });

    this.settingUtils.addItem({
      key: PluginSetting.AutoRefresh,
      value: true,
      type: "checkbox",
      title: this.t.setting.autoRefresh,
      description: this.t.setting.autoRefreshDesc,
    });

    this.settingUtils.addItem({
      key: PluginSetting.RefreshInterval,
      value: 30,
      type: "number",
      title: this.t.setting.refreshInterval,
      description: this.t.setting.refreshIntervalDesc,
      action: {
        callback: () => {
          // Enforce minimum refresh interval when user changes the setting
          const currentValue = this.settingUtils.get(
            PluginSetting.RefreshInterval
          ) as number;
          if (currentValue < MIN_REFRESH_INTERVAL) {
            this.settingUtils.set(
              PluginSetting.RefreshInterval,
              MIN_REFRESH_INTERVAL
            );
          }
        },
      },
    });

    this.settingUtils.addItem({
      key: PluginSetting.ShowCompleted,
      value: true,
      type: "checkbox",
      title: this.t.setting.showCompleted,
      description: this.t.setting.showCompletedDesc,
    });

    // this.settingUtils.addItem({
    //   key: PluginSetting.MaxTasks,
    //   value: 100,
    //   type: "number",
    //   title: this.t.setting.maxTasks,
    //   description: this.t.setting.maxTasksDesc,
    // });

    this.settingUtils.addItem({
      key: PluginSetting.SortBy,
      value: "created",
      type: "select",
      title: this.t.setting.sortBy,
      description: this.t.setting.sortByDesc,
      options: {
        created: this.t.setting.sortOptions.created,
        updated: this.t.setting.sortOptions.updated,
        content: this.t.setting.sortOptions.content,
        priority: this.t.setting.sortOptions.priority,
      },
    });

    // this.settingUtils.addItem({
    //   key: PluginSetting.DisplayMode,
    //   value: TaskDisplayMode.ONLY_TASKS,
    //   type: "select",
    //   title: this.t.setting.displayMode,
    //   description: this.t.setting.displayModeDesc,
    //   options: {
    //     [TaskDisplayMode.ONLY_TASKS]: this.t.setting.displayOptions.onlyTasks,
    //     [TaskDisplayMode.NOTEBOOK_DOCUMENT_TASKS]: this.t.setting.displayOptions.notebookDocumentTasks,
    //     [TaskDisplayMode.NOTEBOOK_TASKS]: this.t.setting.displayOptions.notebookTasks,
    //   },
    // });
  }

  private updateStoreFromSettingUtils() {
    const rawRefreshInterval = this.settingUtils.get(
      PluginSetting.RefreshInterval
    ) as number;

    // Enforce minimum refresh interval
    const enforcedRefreshInterval = Math.max(
      rawRefreshInterval,
      MIN_REFRESH_INTERVAL
    );

    // If the setting was below minimum, update it in the settings
    if (rawRefreshInterval < MIN_REFRESH_INTERVAL) {
      this.settingUtils.set(
        PluginSetting.RefreshInterval,
        enforcedRefreshInterval
      );
    }

    const newConfig = {
      autoRefresh: this.settingUtils.get(PluginSetting.AutoRefresh) as boolean,
      refreshInterval: enforcedRefreshInterval,
      showCompleted: this.settingUtils.get(
        PluginSetting.ShowCompleted
      ) as boolean,
      maxTasks: this.settingUtils.get(PluginSetting.MaxTasks) as number,
      sortBy: this.settingUtils.get(PluginSetting.SortBy) as string,
      displayMode: this.settingUtils.get(
        PluginSetting.DisplayMode
      ) as TaskDisplayMode,
      loading: false, // Settings are now loaded
    };

    Logger.debug("Updating config store with:", newConfig);
    configStore.set(newConfig);
  }

  onLayoutReady() {
    Logger.debug("onLayoutReady");
    this.loadData(STORAGE_NAME);

    // Load settings asynchronously
    this.loadSettingsAsync();
  }

  private async loadSettingsAsync() {
    try {
      // Load settings first - await the async load
      await this.settingUtils.load();

      // Now update config store with loaded settings
      this.updateStoreFromSettingUtils();

      // Mark config as loaded
      configStore.setLoading(false);

      // Now that config is loaded, refresh tasks if needed
      taskStore.refreshTasksIfNeeded();
    } catch (error) {
      Logger.error("Failed to load settings:", error);
      configStore.setLoading(false);
    }
  }

  async onunload() {
    // Clean up the refresh timer when the plugin is unloaded
    this.stopRefreshTimer();
  }

  uninstall() {
    Logger.debug("uninstall");
    this.stopRefreshTimer();
  }

  private get t(): I18N {
    return this.i18n as unknown as I18N;
  }
}
