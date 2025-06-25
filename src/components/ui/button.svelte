<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import Icon from "./icon.svelte";
    import { type SiYuanIcon } from "@/types/siyuan-icon";

    export let label: string | null = null;
    export let icon: SiYuanIcon | null = null;
    export let isFocused: boolean = false;
    export let tooltip: string | null = null;

    const dispatch = createEventDispatcher();
</script>

<button
        class="block__icon fn__flex-center ariaLabel"
        class:item--focus={isFocused}
        on:click={(event) => dispatch("click", { event })}
        on:keydown={(event) => dispatch("click", { event})}
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