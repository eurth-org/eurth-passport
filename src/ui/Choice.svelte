<script lang="ts" generics="Id extends string">
  /*
   * One choice from a short list, as a row of pills. Every option has its name on it, and a
   * square of its colour beside the name when it is a colour: never colour alone.
   */
  import { faCheck } from '@fortawesome/free-solid-svg-icons';
  import Icon from '@eurth/style/components/Icon.svelte';

  let {
    legend,
    name,
    options,
    value = $bindable(),
  }: {
    legend: string;
    /** The radio group's name: unique on the page. */
    name: string;
    options: readonly { id: Id; name: string; hex?: string }[];
    value: Id;
  } = $props();
</script>

<fieldset class="choice">
  <legend class="eu-label">{legend}</legend>
  <div class="eu-row">
    {#each options as option (option.id)}
      <label class="eu-pill">
        <input type="radio" {name} value={option.id} bind:group={value} />
        <span class="eu-check"><Icon icon={faCheck} /></span>
        {#if option.hex}<span class="eu-swatch" style:--swatch={option.hex}></span>{/if}
        {option.name}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .choice {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
</style>
