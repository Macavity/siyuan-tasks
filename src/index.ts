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
  IModel,
  Protyle,
  openWindow,
  IOperation,
  Constants,
  openMobileFileById,
  lockScreen,
  ICard,
  ICardData,
} from "siyuan";
import "@/index.scss";

import TaskList from "@/components/task-list.svelte";

import { SettingUtils } from "./libs/setting-utils";
import { icons } from "./libs/icons";

const STORAGE_NAME = "plugin-tasks";
const TASK_DOCK_TYPE = "task-list-panel-dock";

export default class TaskListPlugin extends Plugin {
  customTab: () => IModel;
  private isMobile: boolean;
  private settingUtils: SettingUtils;
  private taskDock: any; // Store the task dock instance

  async onload() {
    this.addIcons(icons);
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    this.addCommand({
      langKey: "showTaskList",
      hotkey: "⇧⌘T",
      globalCallback: () => {
        // Toggle the task list dock
        if (this.taskDock && this.taskDock.element) {
          // This will toggle the dock visibility
          this.taskDock.element.style.display =
            this.taskDock.element.style.display === "none" ? "block" : "none";
        }
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
      init: (dockInstance: any) => {
        // Create Svelte component for task list
        new TaskList({
          target: dockInstance.element,
          props: {
            app: this.app,
            i18n: this.i18n,
          },
        });
      },
      destroy() {
        console.log("Task list dock destroyed");
      },
    });

    try {
      this.settingUtils.load();
    } catch (error) {
      console.error(
        "Error loading settings storage, probably empty config json:",
        error
      );
    }
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
