/* eslint-disable no-case-declarations */
/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-12-17 18:28:19
 * @FilePath     : /src/libs/setting-utils.ts
 * @LastEditTime : 2024-05-01 17:44:16
 * @Description  :
 */

import { Logger } from "@/services/logger.service";
import { PluginConfig } from "@/stores/config.store";
import { Plugin, Setting } from "siyuan";
import { type ISettingUtilsItem, type TSettingItemType } from "@/libs/index";

/**
 * The default function to get the value of the element
 * @param type
 * @returns
 */
const createDefaultGetter = (type: TSettingItemType) => {
  let getter: (ele: HTMLElement) => unknown;
  switch (type) {
    case "checkbox":
      getter = (ele: HTMLInputElement) => {
        return ele.checked;
      };
      break;
    case "select":
    case "slider":
    case "textinput":
    case "textarea":
      getter = (
        ele: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      ) => {
        return ele.value;
      };
      break;
    case "number":
      getter = (ele: HTMLInputElement) => {
        return parseInt(ele.value);
      };
      break;
    default:
      getter = () => null;
      break;
  }
  return getter;
};

/**
 * The default function to set the value of the element
 * @param type
 * @returns
 */
const createDefaultSetter = (type: TSettingItemType) => {
  let setter: (ele: HTMLElement, value: never) => void;
  switch (type) {
    case "checkbox":
      setter = (ele: HTMLInputElement, value: never) => {
        ele.checked = value;
      };
      break;
    case "select":
    case "slider":
    case "textinput":
    case "textarea":
    case "number":
      setter = (
        ele: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
        value: string
      ) => {
        ele.value = value;
      };
      break;
    default:
      setter = () => {};
      break;
  }
  return setter;
};

export class SettingUtils {
  plugin: Plugin;
  name: string;
  file: string;

  settings: Map<string, ISettingUtilsItem> = new Map();
  elements: Map<string, HTMLElement> = new Map();

  constructor(args: {
    plugin: Plugin;
    name?: string;
    callback?: (data: unknown) => void;
    width?: string;
    height?: string;
  }) {
    this.name = args.name ?? "settings";
    this.plugin = args.plugin;
    this.file = this.name.endsWith(".json") ? this.name : `${this.name}.json`;
    this.plugin.setting = new Setting({
      width: args.width,
      height: args.height,
      confirmCallback: () => {
        for (const key of this.settings.keys()) {
          this.updateValueFromElement(key);
        }
        const data = this.dump();
        if (args.callback !== undefined) {
          args.callback(data);
        }
        (this.plugin.data as PluginConfig)[this.name] = data as PluginConfig;
        this.save(data);
      },
      destroyCallback: () => {
        //Restore the original value
        for (const key of this.settings.keys()) {
          this.updateElementFromValue(key);
        }
      },
    });
  }

  async load() {
    const data = (await this.plugin.loadData(this.file)) as PluginConfig;
    Logger.debug("Load config:", data);
    if (data) {
      for (const [key, item] of this.settings) {
        item.value = data?.[key] ?? item.value;
      }
    }
    (this.plugin.data as PluginConfig)[this.name] = this.dump();
    return data;
  }

  async save(data?: unknown) {
    data = data ?? this.dump();
    await this.plugin.saveData(this.file, this.dump());
    return data;
  }

  /**
   * read the data after saving
   * @param key key name
   * @returns setting item value
   */
  get(key: string) {
    return this.settings.get(key)?.value;
  }

  /**
   * Set data to this.settings,
   * but do not save it to the configuration file
   * @param key key name
   * @param value value
   */
  set(key: string, value: unknown) {
    const item = this.settings.get(key);
    if (item) {
      item.value = value;
      this.updateElementFromValue(key);
    }
  }

  /**
   * Set and save setting item value
   * If you want to set and save immediately you can use this method
   * @param key key name
   * @param value value
   */
  async setAndSave(key: string, value: unknown) {
    const item = this.settings.get(key);
    if (item) {
      item.value = value;
      this.updateElementFromValue(key);
      await this.save();
    }
  }

  /**
   * Read in the value of element instead of setting obj in real time
   * @param key key name
   * @param apply whether to apply the value to the setting object
   *        if true, the value will be applied to the setting object
   * @returns value in html
   */
  take(key: string, apply: boolean = false) {
    const item = this.settings.get(key);
    const element = this.elements.get(key) as HTMLElement;
    if (!element) {
      return;
    }
    if (apply) {
      this.updateValueFromElement(key);
    }
    return item.getEleVal(element);
  }

  /**
   * Read data from html and save it
   * @param key key name
   * @param value value
   * @return value in html
   */
  async takeAndSave(key: string) {
    const value = this.take(key, true);
    await this.save();
    return value;
  }

  /**
   * Disable setting item
   * @param key key name
   */
  disable(key: string) {
    const element = this.elements.get(key) as HTMLFormElement;
    if (element) {
      element.disabled = true;
    }
  }

  /**
   * Enable setting item
   * @param key key name
   */
  enable(key: string) {
    const element = this.elements.get(key) as HTMLFormElement;
    if (element) {
      element.disabled = false;
    }
  }

  /**
   * 将设置项目导出为 JSON 对象
   * @returns object
   */
  dump(): PluginConfig {
    const data: Partial<PluginConfig> = {};
    for (const [key, item] of this.settings) {
      if (item.type === "button") continue;
      data[key] = item.value;
    }
    return data as PluginConfig;
  }

  addItem(item: ISettingUtilsItem) {
    this.settings.set(item.key, item);
    const IsCustom = item.type === "custom";
    const error =
      IsCustom &&
      (item.createElement === undefined ||
        item.getEleVal === undefined ||
        item.setEleVal === undefined);
    if (error) {
      console.error(
        "The custom setting item must have createElement, getEleVal and setEleVal methods"
      );
      return;
    }

    if (item.getEleVal === undefined) {
      item.getEleVal = createDefaultGetter(item.type);
    }
    if (item.setEleVal === undefined) {
      item.setEleVal = createDefaultSetter(item.type);
    }

    if (item.createElement === undefined) {
      const itemElement = this.createDefaultElement(item);
      this.elements.set(item.key, itemElement);
      this.plugin.setting.addItem({
        title: item.title,
        description: item?.description,
        direction: item?.direction,
        createActionElement: () => {
          this.updateElementFromValue(item.key);
          const element = this.getElement(item.key);
          return element;
        },
      });
    } else {
      this.plugin.setting.addItem({
        title: item.title,
        description: item?.description,
        direction: item?.direction,
        createActionElement: () => {
          const val = this.get(item.key);
          const element = item.createElement(val);
          this.elements.set(item.key, element);
          return element;
        },
      });
    }
  }

  createDefaultElement(item: ISettingUtilsItem) {
    let itemElement: HTMLElement;
    //阻止思源内置的回车键确认
    const preventEnterConfirm = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    switch (item.type) {
      case "checkbox":
        const element: HTMLInputElement = document.createElement("input");
        element.type = "checkbox";
        element.checked = Boolean(item.value);
        element.className = "b3-switch fn__flex-center";
        itemElement = element;
        element.onchange = item.action?.callback ?? (() => {});
        break;
      case "select":
        const selectElement: HTMLSelectElement =
          document.createElement("select");
        selectElement.className = "b3-select fn__flex-center fn__size200";
        const options = item?.options ?? {};
        for (const val in options) {
          const optionElement = document.createElement("option");
          const text = options[val];
          optionElement.value = val;
          optionElement.text = text;
          selectElement.appendChild(optionElement);
        }
        selectElement.value = String(item.value ?? "");
        selectElement.onchange = item.action?.callback ?? (() => {});
        itemElement = selectElement;
        break;
      case "slider":
        const sliderElement: HTMLInputElement = document.createElement("input");
        sliderElement.type = "range";
        sliderElement.className =
          "b3-slider fn__size200 b3-tooltips b3-tooltips__n";
        sliderElement.ariaLabel = String(item.value ?? "");
        sliderElement.min = item.slider?.min.toString() ?? "0";
        sliderElement.max = item.slider?.max.toString() ?? "100";
        sliderElement.step = item.slider?.step.toString() ?? "1";
        sliderElement.value = String(item.value ?? "");
        sliderElement.onchange = () => {
          sliderElement.ariaLabel = sliderElement.value;
          item.action?.callback();
        };
        itemElement = sliderElement;
        break;
      case "textinput":
        const textInputElement: HTMLInputElement =
          document.createElement("input");
        textInputElement.className =
          "b3-text-field fn__flex-center fn__size200";
        textInputElement.value = String(item.value ?? "");
        textInputElement.onchange = item.action?.callback ?? (() => {});
        itemElement = textInputElement;
        textInputElement.addEventListener("keydown", preventEnterConfirm);
        break;
      case "textarea":
        const textareaElement: HTMLTextAreaElement =
          document.createElement("textarea");
        textareaElement.className = "b3-text-field fn__block";
        textareaElement.value = String(item.value ?? "");
        textareaElement.onchange = item.action?.callback ?? (() => {});
        itemElement = textareaElement;
        break;
      case "number":
        const numberElement: HTMLInputElement = document.createElement("input");
        numberElement.type = "number";
        numberElement.className = "b3-text-field fn__flex-center fn__size200";
        numberElement.value = String(item.value ?? "");
        itemElement = numberElement;
        numberElement.addEventListener("keydown", preventEnterConfirm);
        break;
      case "button":
        const buttonElement: HTMLButtonElement =
          document.createElement("button");
        buttonElement.className =
          "b3-button b3-button--outline fn__flex-center fn__size200";
        buttonElement.innerText = item.button?.label ?? "Button";
        buttonElement.onclick = item.button?.callback ?? (() => {});
        itemElement = buttonElement;
        break;
      case "hint":
        const hintElement: HTMLElement = document.createElement("div");
        hintElement.className = "b3-label fn__flex-center";
        itemElement = hintElement;
        break;
    }
    return itemElement;
  }

  /**
   * return the setting element
   * @param key key name
   * @returns element
   */
  getElement(key: string) {
    // let item = this.settings.get(key);
    const element = this.elements.get(key) as HTMLElement;
    return element;
  }

  private updateValueFromElement(key: string) {
    const item = this.settings.get(key);
    if (item.type === "button") return;
    const element = this.elements.get(key);
    if (element && item.getEleVal) {
      item.value = item.getEleVal(element);
    }
  }

  private updateElementFromValue(key: string) {
    const item = this.settings.get(key);
    if (item.type === "button") return;
    const element = this.elements.get(key);
    if (element && item.setEleVal) {
      item.setEleVal(element, item.value);
    }
  }
}
