<script lang="ts">
  import { type SiYuanIcon } from "@/types/siyuan-icon";
    import Icon from "./icon.svelte";

    interface Props {
        label?: string;
        icon: SiYuanIcon;
        isFocused?: boolean;
        tooltip?: string;
        onClick: () => void;
    }

    const { label, icon, isFocused, tooltip, onClick } = $props() as Props;
</script>

<button
        class="block__icon fn__flex-center ariaLabel"
        class:item--focus={isFocused}
        onclick={onClick}
        onkeydown={onClick}
        title={tooltip}
>
    {#if icon}
        <Icon icon={icon} />
    {/if}
    {#if label}
        <span class="item__text">{label}</span>
    {/if}
</button>

<style lang="scss">
  .block__icon {
    opacity: 1;

    &:hover {
      color: var(--b3-theme-on-background);
      background-color: var(--b3-list-icon-hover);
    }
  }

  .item--focus {
    background: var(--b3-theme-background-light);
    //box-shadow: inset 0 -2px 0 0 var(--b3-theme-primary);
    //border-bottom: var(--b3-theme-primary) 2px solid;
  }

  .item__text {
    padding-left: 5px;
  }
</style>