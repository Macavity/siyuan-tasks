<script lang="ts">
  import { onMount } from 'svelte';
  import { type I18N } from '../types/i18n';

  interface Props {
    app: any;
    i18n: I18N;
    onClose: () => void;
  }

  let { app, i18n, onClose }: Props = $props();

  interface Settings {
    taskCountLimit: number;
    autoRefresh: boolean;
    showCompletedTasks: boolean;
    defaultRange: 'doc' | 'box' | 'workspace';
  }

  let settings: Settings = {
    taskCountLimit: 2000,
    autoRefresh: true,
    showCompletedTasks: true,
    defaultRange: 'doc'
  };

  let loading = false;

  async function loadSettings() {
    try {
      const stored = await app.getLocalStorage();
      if (stored && stored['plugin-tasks-settings']) {
        settings = { ...settings, ...stored['plugin-tasks-settings'] };
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  async function saveSettings() {
    loading = true;
    try {
      await app.setLocalStorage({
        app: app.appId,
        val: {
          'plugin-tasks-settings': settings
        }
      });
      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadSettings();
  });
</script>

<div class="settings-modal">
  <div class="settings-header">
    <h3>{i18n.setting?.title || 'Settings'}</h3>
    <button class="close-btn" on:click={onClose}>×</button>
  </div>

  <div class="settings-content">
    <div class="setting-item">
      <label for="taskCountLimit">{i18n.setting?.taskCountLimit || 'Task Count Limit'}</label>
      <input 
        type="number" 
        id="taskCountLimit"
        bind:value={settings.taskCountLimit}
        min="100"
        max="10000"
        step="100"
      />
      <span class="setting-desc">{i18n.setting?.taskCountLimitDesc || 'Maximum number of tasks to load'}</span>
    </div>

    <div class="setting-item">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={settings.autoRefresh} />
        <span>{i18n.setting?.autoRefresh || 'Auto Refresh'}</span>
      </label>
      <span class="setting-desc">{i18n.setting?.autoRefreshDesc || 'Automatically refresh tasks when switching documents'}</span>
    </div>

    <div class="setting-item">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={settings.showCompletedTasks} />
        <span>{i18n.setting?.showCompletedTasks || 'Show Completed Tasks'}</span>
      </label>
      <span class="setting-desc">{i18n.setting?.showCompletedTasksDesc || 'Show completed tasks in the list'}</span>
    </div>

    <div class="setting-item">
      <label for="defaultRange">{i18n.setting?.defaultRange || 'Default Range'}</label>
      <select id="defaultRange" bind:value={settings.defaultRange}>
        <option value="doc">{i18n.range?.doc || 'Document'}</option>
        <option value="box">{i18n.range?.box || 'Notebook'}</option>
        <option value="workspace">{i18n.range?.workspace || 'Workspace'}</option>
      </select>
      <span class="setting-desc">{i18n.setting?.defaultRangeDesc || 'Default range when opening the task list'}</span>
    </div>
  </div>

  <div class="settings-footer">
    <button class="btn-secondary" on:click={onClose}>
      {i18n.cancel || 'Cancel'}
    </button>
    <button class="btn-primary" on:click={saveSettings} disabled={loading}>
      {loading ? (i18n.setting?.saving || 'Saving...') : (i18n.save || 'Save')}
    </button>
  </div>
</div>

<style>
  .settings-modal {
    background: var(--b3-theme-surface);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .settings-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--b3-theme-on-surface-variant);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .close-btn:hover {
    background-color: var(--b3-theme-surface-hover);
  }

  .settings-content {
    padding: 20px;
  }

  .setting-item {
    margin-bottom: 20px;
  }

  .setting-item label {
    display: block;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--b3-theme-on-surface);
  }

  .setting-item input[type="number"],
  .setting-item select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    font-size: 14px;
  }

  .setting-item input[type="number"]:focus,
  .setting-item select:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  .checkbox-label {
    display: flex !important;
    align-items: center;
    cursor: pointer;
    margin-bottom: 8px;
  }

  .checkbox-label input[type="checkbox"] {
    margin-right: 8px;
    width: auto;
  }

  .setting-desc {
    display: block;
    font-size: 12px;
    color: var(--b3-theme-on-surface-variant);
    margin-top: 4px;
  }

  .settings-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--b3-border-color);
  }

  .btn-primary,
  .btn-secondary {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn-primary {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--b3-theme-primary-hover);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    border-color: var(--b3-border-color);
  }

  .btn-secondary:hover {
    background: var(--b3-theme-surface-hover);
  }
</style> 