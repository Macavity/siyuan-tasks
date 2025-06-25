<script lang="ts">
  import { type I18N } from '../types/i18n';

  interface Props {
    i18n: I18N;
    searchText: string;
    onSearchChange: (value: string) => void;
  }

  let { i18n, searchText, onSearchChange }: Props = $props();
</script>

<div class="search-wrap">
  <input 
    type="text" 
    value={searchText}
    oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
    placeholder={i18n.searchPlaceholder || 'Search tasks...'}
    class="search-input"
  />
</div>

<style>
  .search-wrap {
    margin-bottom: 8px;
    padding: 0 12px;
    box-sizing: border-box;
  }

  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    font-size: 14px;
    box-sizing: border-box;
    max-width: 100%;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
</style> 