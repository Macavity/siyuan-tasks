import {
  Protyle,
  Plugin,
  Model,
  Dialog,
  IEventBusMap,
  IPluginDockTab,
  Custom,
  MobileCustom,
} from "siyuan";
import "@/index.scss";

import TaskListView from "@/views/task-list-view.svelte";

import { icons } from "./libs/icons";
import { i18nStore } from "./stores/i18n.store";
import { taskStore } from "./stores/task.store";
import { type I18N } from "./types/i18n";
import { mount, unmount } from "svelte";
import { SiyuanEvents } from "./types/siyuan-events";
import {
  configStore,
  MIN_REFRESH_INTERVAL,
  type PluginConfig,
} from "./stores/config.store";
import { Logger } from "./services/logger.service";
import SettingsView from "@/views/settings-view.svelte";
import { createFromObject } from "./types/dto/settings.dto";
import { STORAGE_NAME_V2, TASK_DOCK_TYPE } from "@/constants";
import { MigrationService } from "./services/migration.service";

type TEventSwitchProtyle = CustomEvent<
  IEventBusMap[SiyuanEvents.SWITCH_PROTYLE]
>;

export default class TaskListPlugin extends Plugin {
  customTab: () => Model;
  private taskDock: { config: IPluginDockTab; model: Custom | MobileCustom };
  private refreshTimer: NodeJS.Timeout | null = null;

  async onload() {
    this.addIcons(icons);
    i18nStore.set(this.i18n as unknown as I18N);

    this.addCommand({
      langKey: "showTaskList",
      hotkey: "⇧⌘T",
      globalCallback: () => {
        console.log("showTaskList");
        // Toggle the task list dock
        if (this.taskDock && this.taskDock.model.element) {
          // This will toggle the dock visibility
          const el = this.taskDock.model.element as unknown as HTMLElement;
          el.style.display = el.style.display === "none" ? "block" : "none";
        }
      },
    });

    this.protyleSlash = [
      {
        filter: ["wait", "⏳", "后来"],
        html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18n.wait}</span><span class="b3-list-item__meta">⏳</span></div>`,
        id: "insertWait",
        callback(protyle: Protyle) {
          protyle.insert("⏳");
        },
      },
    ];

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
      init: (dock) => {
        mount(TaskListView, {
          target: dock.element,
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

  public openSetting(): void {
    const dialog = new Dialog({
      title: this.t.setting.title,
      content: `<div id="siyuanTasksSettings" style="height: 100%;"></div>`,
      width: "800px",
      destroyCallback: (/*options*/) => {
        try {
          unmount(SettingsView);
        } catch (error) {
          Logger.debug("Failed to unmount settings:", error);
        }
      },
    });
    mount(SettingsView, {
      target: dialog.element.querySelector("#siyuanTasksSettings"),
      props: {
        i18n: this.i18n as unknown as I18N,
        plugin: this,
      },
    });
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

  onLayoutReady() {
    Logger.debug("onLayoutReady");

    this.loadSettings();
  }

  private async loadSettings() {
    try {
      // Load settings using plugin's loadData method
      configStore.setLoading(true);

      // Run migration if needed
      await MigrationService.migrateSettings(this);

      const settingsData = (await this.loadData(STORAGE_NAME_V2)) as PluginConfig;

      if (
        settingsData &&
        typeof settingsData === "object" &&
        Object.keys(settingsData).length > 0
      ) {
        const settings = createFromObject(settingsData);
        configStore.setFromSettingsDTO(settings);
      } else {
        // Use default settings if no data found
        configStore.setFromSettingsDTO(createFromObject({}));
      }

      // Mark config as loaded
      configStore.setLoading(false);
      Logger.debug("settingsData initialized", settingsData);

      // Now that config is loaded, refresh tasks if needed
      taskStore.refreshTasksIfNeeded();
    } catch (error) {
      Logger.error("Failed to load settings:", error);
      // Use default settings on error
      configStore.setFromSettingsDTO(createFromObject({}));
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
