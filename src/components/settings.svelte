<script lang="ts">
  import { onMount } from 'svelte';
  import { type I18N } from '../types/i18n';
  import { App } from 'siyuan';

  interface Props {
    app: App;
    i18n: I18N;
    onClose: () => void;
  }

  let { app, i18n, onClose }: Props = $props();

  let settings = $state({
    autoRefresh: true,
    refreshInterval: 30,
    showCompleted: true,
    maxTasks: 100,
    sortBy: 'created' as 'created' | 'updated' | 'content'
  });

  let loading = $state(false);

  async function saveSettings() {
    loading = true;
    try {
      await app.setData('plugin-tasks-settings', settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    try {
      const savedSettings = await app.getData('plugin-tasks-settings');
      if (savedSettings) {
        settings = { ...settings, ...savedSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  });
</script>

<div class="settings-modal">
  <div class="settings-header">
    <h3>{i18n.setting?.title || 'Settings'}</h3>
    <button class="close-btn" onclick={onClose}>×</button>
  </div>

  <div class="settings-content">
    <div class="setting-item">
      <label>
        <input 
          type="checkbox" 
          bind:checked={settings.autoRefresh}
        />
        Auto refresh tasks
      </label>
    </div>

    <div class="setting-item">
      <label>
        Refresh interval (seconds):
        <input 
          type="number" 
          bind:value={settings.refreshInterval}
          min="5"
          max="300"
        />
      </label>
    </div>

    <div class="setting-item">
      <label>
        <input 
          type="checkbox" 
          bind:checked={settings.showCompleted}
        />
        Show completed tasks
      </label>
    </div>

    <div class="setting-item">
      <label>
        Maximum tasks to display:
        <input 
          type="number" 
          bind:value={settings.maxTasks}
          min="10"
          max="1000"
        />
      </label>
    </div>

    <div class="setting-item">
      <label>
        Sort by:
        <select bind:value={settings.sortBy}>
          <option value="created">Created date</option>
          <option value="updated">Updated date</option>
          <option value="content">Content</option>
        </select>
      </label>
    </div>
  </div>

  <div class="settings-footer">
    <button class="btn-secondary" onclick={onClose}>
      {i18n.cancel || 'Cancel'}
    </button>
    <button class="btn-primary" onclick={saveSettings} disabled={loading}>
      {loading ? 'Saving...' : (i18n.save || 'Save')}
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