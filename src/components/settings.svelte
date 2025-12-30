<script lang="ts">
    import { showMessage } from "siyuan";
    import SettingPanel from "./ui/setting-panel.svelte";
    import { PluginSetting, MIN_REFRESH_INTERVAL } from "@/stores/config.store";
    import { configStore } from "@/stores/config.store";
    import { Plugin } from "siyuan";
    import { TaskDisplayMode } from "@/types/tasks";
    import { STORAGE_NAME_V2 } from "@/constants";
    import { Logger } from "@/services/logger.service";
    import { i18nStore } from "@/stores/i18n.store";

    interface Props {
        plugin: Plugin;
    }

    let { plugin }: Props = $props();

    // Derive groups from i18n reactively
    const groups = $derived(() => {
        const t = $i18nStore;
        return [t.setting.general, t.setting.layout];
    });

    // Focus group (initialize once i18n is available)
    let focusGroup = $state("");
    $effect(() => {
        if (!focusGroup && groups()[0]) {
            focusGroup = groups()[0];
        }
    });
  

    const group1Items = $derived(() => {
        const t = $i18nStore;
        return [
            {
                key: PluginSetting.AutoRefresh,
                value: $configStore.autoRefresh,
                type: "checkbox" as const,
                title: t.setting.autoRefresh,
                description: t.setting.autoRefreshDesc,
            },
            {
                key: PluginSetting.RefreshInterval,
                value: $configStore.refreshInterval,
                type: "number" as const,
                title: t.setting.refreshInterval,
                description: t.setting.refreshIntervalDesc,
            },
            {
                key: PluginSetting.MaxTasks,
                value: $configStore.maxTasks,
                type: "number" as const,
                title: t.setting.maxTasks,
                description: t.setting.maxTasksDesc,
            },
            {
                key: PluginSetting.SortBy,
                value: $configStore.sortBy,
                type: "select" as const,
                title: t.setting.sortBy,
                description: t.setting.sortByDesc,
                options: {
                    created: t.setting.sortOptions.created,
                    updated: t.setting.sortOptions.updated,
                    content: t.setting.sortOptions.content,
                    priority: t.setting.sortOptions.priority,
                },
            }
        ];
    });

    const group2Items = $derived(() => {
        const t = $i18nStore;
        return [
            {
                key: PluginSetting.DisplayMode,
                value: $configStore.displayMode,
                type: "select" as const,
                title: t.setting.displayMode,
                description: t.setting.displayModeDesc,  
                options: {
                    [TaskDisplayMode.ONLY_TASKS]: t.setting.displayOptions.onlyTasks,
                    [TaskDisplayMode.NOTEBOOK_DOCUMENT_TASKS]: t.setting.displayOptions.notebookDocumentTasks,
                    [TaskDisplayMode.NOTEBOOK_TASKS]: t.setting.displayOptions.notebookTasks,
                },
            },
            {
                key: PluginSetting.ShowCompleted,
                value: $configStore.showCompleted,
                type: "checkbox" as const,
                title: t.setting.showCompleted,
                description: t.setting.showCompletedDesc,
            },
            {
                key: PluginSetting.ShowTodayTasks,
                value: $configStore.showTodayTasks,
                type: "checkbox" as const,
                title: t.setting.showTodayTasks,
                description: t.setting.showTodayTasksDesc,
            },

        ];
    });

    /********** Callbacks **********/
    const onSettingChange = async (group: string, key: string, value: unknown) => {
        Logger.debug("onSettingChange", { group, key, value });
        
        if (group === groups()[0] || group === groups()[1]) {
            try {
                // Handle special validation for refresh interval
                let finalValue = value;
                if (key === PluginSetting.RefreshInterval) {
                    finalValue = Math.max(value as number, MIN_REFRESH_INTERVAL);
                    if (finalValue !== value) {
                        showMessage(`Refresh interval set to minimum: ${finalValue} seconds`);
                    }
                }
                
                // Update config store using dynamic setter
                configStore.setSetting(key as PluginSetting, finalValue);
                
                // Save settings to storage using plugin's saveData method
                await plugin.saveData(STORAGE_NAME_V2, configStore.getSettingsObject());
                Logger.debug("Settings saved successfully");
            } catch (error) {
                Logger.error("Failed to save settings:", error);
                showMessage("Failed to save settings");
            }
        }
    };
</script>

<div class="fn__flex-1 fn__flex config__panel">
    <ul class="b3-tab-bar b3-list b3-list--background">
        {#each groups() as group}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <li
                data-name="editor"
                class:b3-list-item--focus={(group as string) === focusGroup}
                class="b3-list-item"
                onclick={() => {
                    focusGroup = group as string;
                }}
                onkeydown={(e) => {
                    if (e.key === "Enter") {
                        focusGroup = group as string;
                    }
                }}
            >
                <span class="b3-list-item__text">{group as string}</span>
            </li>
        {/each}
    </ul>
    <div class="config__tab-wrap">
        <SettingPanel
            group={groups()[0]}
            settingItems={group1Items()}
            display={focusGroup === groups()[0]}
            onSettingChange={onSettingChange}
        >
        </SettingPanel>
        <SettingPanel
            group={groups()[1]}
            settingItems={group2Items()}
            display={focusGroup === groups()[1]}
            onSettingChange={onSettingChange}
        >
        </SettingPanel>
    </div>
</div>

<style lang="scss">
    .config__panel {
        height: 100%;
    }
    .config__panel > ul > li {
        padding-left: 1rem;
    }
</style>
