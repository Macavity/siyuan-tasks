<svelte:options namespace="svg" />

<script lang="ts">
  import { type SiYuanIcon } from "@/types/siyuan-icon";
  interface Props {
    icon: SiYuanIcon;
    class?: string;
    style?: string;
  }

  let { class: klass, icon, style }: Props = $props();
</script>

<svg class="{klass || ''}" style={style}>
  <use xlink:href={`#${icon}`}></use>
</svg>
