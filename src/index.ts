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
import { Logger } from "./services/logger.service";
import { configStore, PluginSetting } from "./stores/config.store";

const STORAGE_NAME = "plugin-tasks";
const TASK_DOCK_TYPE = "task-list-panel-dock";

type TEventSwitchProtyle = CustomEvent<
  IEventBusMap[SiyuanEvents.SWITCH_PROTYLE]
>;

export default class TaskListPlugin extends Plugin {
  customTab: () => Model;
  private settingUtils: SettingUtils;
  private taskDock: { config: IPluginDockTab; model: Dock };

  async onload() {
    this.addIcons(icons);
    i18nStore.set(this.i18n as unknown as I18N);
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

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
            settingUtils: this.settingUtils,
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
        Logger.debug("Switched to document:", e.detail.protyle.block.rootID);
      }
      if (e.detail?.protyle?.notebookId) {
        const boxInfo = {
          box: e.detail.protyle.notebookId,
          name: "Current Notebook", // TODO: Get actual notebook name
        };
        taskStore.setCurrentBoxInfo(boxInfo);
        Logger.debug("Switched to notebook:", e.detail.protyle.notebookId);
      }

      // Refresh tasks while preserving the current filter level
      // Use the smart refresh function that only updates if needed
      taskStore.refreshTasksIfNeeded();
    });
  }

  private initialiseSettings() {
    // Initialize settings
    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
      callback: (data) => {
        // Settings changed, refresh tasks if needed
        Logger.info("Settings updated:", data);
        this.updateStoreFromSettingUtils();
        taskStore.refreshTasksIfNeeded(true);
      },
    });

    // Add settings items
    this.settingUtils.addItem({
      key: PluginSetting.AutoRefresh,
      value: true,
      type: "checkbox",
      title: "Auto refresh tasks",
      description: "Automatically refresh tasks when switching documents",
    });

    this.settingUtils.addItem({
      key: PluginSetting.RefreshInterval,
      value: 30,
      type: "number",
      title: "Refresh interval (seconds)",
      description: "How often to refresh tasks automatically",
    });

    this.settingUtils.addItem({
      key: PluginSetting.ShowCompleted,
      value: true,
      type: "checkbox",
      title: "Show completed tasks",
      description: "Include completed tasks in the task list",
    });

    // this.settingUtils.addItem({
    //   key: PluginSetting.MaxTasks,
    //   value: 100,
    //   type: "number",
    //   title: "Maximum tasks to display",
    //   description: "Maximum number of tasks to load and display",
    // });

    this.settingUtils.addItem({
      key: PluginSetting.SortBy,
      value: "created",
      type: "select",
      title: "Sort by",
      description: "How to sort tasks in the list",
      options: {
        created: "Created date",
        updated: "Updated date",
        content: "Content",
      },
    });

    // this.settingUtils.addItem({
    //   key: PluginSetting.DisplayMode,
    //   value: TaskDisplayMode.ONLY_TASKS,
    //   type: "select",
    //   title: "Task List Display Mode",
    //   description: "How to display tasks in the list",
    //   options: {
    //     [TaskDisplayMode.ONLY_TASKS]: "Only Tasks",
    //     [TaskDisplayMode.NOTEBOOK_DOCUMENT_TASKS]: "Notebook, Document, Tasks",
    //     [TaskDisplayMode.NOTEBOOK_TASKS]: "Notebook, Tasks",
    //   },
    // });
  }

  private updateStoreFromSettingUtils() {
    configStore.set({
      autoRefresh: this.settingUtils.get(PluginSetting.AutoRefresh) as boolean,
      refreshInterval: this.settingUtils.get(
        PluginSetting.RefreshInterval
      ) as number,
      showCompleted: this.settingUtils.get(
        PluginSetting.ShowCompleted
      ) as boolean,
      maxTasks: this.settingUtils.get(PluginSetting.MaxTasks) as number,
      sortBy: this.settingUtils.get(PluginSetting.SortBy) as string,
      displayMode: this.settingUtils.get(
        PluginSetting.DisplayMode
      ) as TaskDisplayMode,
    });
  }

  onLayoutReady() {
    this.loadData(STORAGE_NAME);
    this.settingUtils.load();
  }

  async onunload() {}

  uninstall() {
    // console.log("uninstall");
  }
}
