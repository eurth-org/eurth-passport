<script lang="ts">
  /*
   * Something switched on or off: a pill around a checkbox, as the handbook has it. Off, it shows
   * an icon of what it switches; on, the suite's tick pops in in that icon's place. So there is
   * always one icon to answer the click, and the choice never rests on colour alone.
   */
  import { faCheck, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
  import Icon from '@eurth/style/components/Icon.svelte';
  import type { Snippet } from 'svelte';

  let {
    checked = $bindable(),
    icon,
    onchange,
    children,
  }: {
    checked: boolean;
    /** What the switch is for, shown while it is off. */
    icon: IconDefinition;
    /** Called with the new state, for a switch that changes more than its own value. */
    onchange?: (on: boolean) => void;
    children: Snippet;
  } = $props();
</script>

<label class="eu-pill toggle">
  <input type="checkbox" bind:checked onchange={(event) => onchange?.(event.currentTarget.checked)} />
  <span class="eu-check"><Icon icon={faCheck} /></span>
  <span class="off"><Icon {icon} /></span>
  {@render children()}
</label>

<style>
  .toggle {
    align-self: flex-start;
  }

  .off {
    display: inline-flex;
  }

  .toggle:has(input:checked) .off {
    display: none;
  }
</style>
