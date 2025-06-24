import {
  Plugin,
  showMessage,
  confirm,
  Dialog,
  Menu,
  openTab,
  adaptHotkey,
  getFrontend,
  getBackend,
  Model,
  Protyle,
  openWindow,
  IOperation,
  Constants,
  openMobileFileById,
  lockScreen,
  ICard,
  ICardData,
  Dock,
  IEventBusMap,
  IPluginDockTab,
} from "siyuan";
import "@/index.scss";

import TaskList from "@/components/task-list.svelte";

import { SettingUtils } from "./libs/setting-utils";
import { icons } from "./libs/icons";
import { i18nStore } from "./stores/i18n.store";
import { taskStore } from "./stores/task.store";
import { type I18N } from "./types/i18n";
import { mount } from "svelte";
import { SiyuanEvents } from "./types/siyuan-events";

const STORAGE_NAME = "plugin-tasks";
const TASK_DOCK_TYPE = "task-list-panel-dock";

type TEventSwitchProtyle = CustomEvent<
  IEventBusMap[SiyuanEvents.SWITCH_PROTYLE]
>;

export default class TaskListPlugin extends Plugin {
  customTab: () => Model;
  private isMobile: boolean;
  private settingUtils: SettingUtils;
  private taskDock: { config: IPluginDockTab; model: Dock };

  async onload() {
    this.addIcons(icons);
    i18nStore.set(this.i18n as unknown as I18N);
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

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

    // Initialize settings
    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
      callback: (data) => {
        // Settings changed, refresh tasks if needed
        console.log("Settings updated:", data);
        taskStore.fetchTasks("doc", "all");
      },
    });

    // Add settings items
    this.settingUtils.addItem({
      key: "autoRefresh",
      value: true,
      type: "checkbox",
      title: "Auto refresh tasks",
      description: "Automatically refresh tasks when switching documents",
    });

    this.settingUtils.addItem({
      key: "refreshInterval",
      value: 30,
      type: "number",
      title: "Refresh interval (seconds)",
      description: "How often to refresh tasks automatically",
    });

    this.settingUtils.addItem({
      key: "showCompleted",
      value: true,
      type: "checkbox",
      title: "Show completed tasks",
      description: "Include completed tasks in the task list",
    });

    this.settingUtils.addItem({
      key: "maxTasks",
      value: 100,
      type: "number",
      title: "Maximum tasks to display",
      description: "Maximum number of tasks to load and display",
    });

    this.settingUtils.addItem({
      key: "sortBy",
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
        console.log("Task list dock destroyed");
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
        console.log("Switched to document:", e.detail.protyle.block.rootID);
      }
      if (e.detail?.protyle?.notebookId) {
        const boxInfo = {
          box: e.detail.protyle.notebookId,
          name: "Current Notebook", // TODO: Get actual notebook name
        };
        taskStore.setCurrentBoxInfo(boxInfo);
        console.log("Switched to notebook:", e.detail.protyle.notebookId);
      }

      // Refresh tasks when switching documents/notebooks
      taskStore.fetchTasks("doc", "all");
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
