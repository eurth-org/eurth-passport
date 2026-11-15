<script lang="ts">
  /* The cover: its colour, the foil it is stamped in, the emblem, the title in up to two languages, the chip symbol. */
  import { coverColours, coverInk, foils } from '../passport/colours';
  import { emblems } from '../passport/emblems';
  import { REAL_COUNTRY_NOTE, isRealCountry } from '../passport/fiction';
  import { limits, type Cover } from '../passport/model';
  import { svgDataUrl } from '../passport/render';
  import Choice from './Choice.svelte';

  let { cover = $bindable(), hasArms }: { cover: Cover; hasArms: boolean } = $props();

  const preset = $derived(coverColours.find((c) => c.hex === cover.colour.toLowerCase())?.id ?? 'other');
  const foil = $derived(coverInk(cover.colour, cover.foil));
  // Each emblem as it would look on this cover: the cover's colour behind, the foil in front.
  const swatches = $derived(
    emblems.map((e) => ({
      id: e.id,
      name: e.name,
      src: svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 120 120"><rect x="-10" y="-10" width="120" height="120" rx="12" fill="${cover.colour}"/>${e.draw(foil, cover.colour)}</svg>`),
    })),
  );
</script>

<fieldset class="group">
  <legend class="eu-label">Cover colour</legend>
  <div class="eu-row">
    {#each coverColours as colour (colour.id)}
      <button type="button" class="eu-btn" aria-pressed={preset === colour.id} onclick={() => (cover.colour = colour.hex)}>
        <span class="eu-swatch" style:--swatch={colour.hex}></span>
        {colour.name}
      </button>
    {/each}
    <label class="eu-btn other" class:eu-btn--selected={preset === 'other'}>
      <input type="color" bind:value={cover.colour} />
      <span class="eu-swatch" style:--swatch={cover.colour}></span>
      Any other
    </label>
  </div>
</fieldset>

<Choice legend="Lettering" name="foil" options={foils} bind:value={cover.foil} />
{#if foil !== foils.find((f) => f.id === cover.foil)?.hex}
  <p class="eu-help">That foil can’t be read on this colour, so the cover is stamped in the nearest thing that can.</p>
{/if}

<fieldset class="group">
  <legend class="eu-label">Emblem</legend>
  <div class="grid">
    {#each swatches as emblem (emblem.id)}
      <button type="button" class="eu-btn eu-btn--icon tile" aria-pressed={!cover.arms && cover.emblem === emblem.id} data-tip={emblem.name} onclick={() => ((cover.emblem = emblem.id), (cover.arms = false))}>
        <img src={emblem.src} alt="" width="44" height="44" />
        <span class="eu-visually-hidden">{emblem.name}</span>
      </button>
    {/each}
  </div>
  {#if hasArms}
    <label class="eu-pill arms">
      <input type="checkbox" bind:checked={cover.arms} />
      Use the arms from the profile
    </label>
  {:else}
    <p class="eu-help">Load a profile with a coat of arms to put the nation’s own arms here.</p>
  {/if}
</fieldset>

<label class="eu-field">
  <span class="eu-label">The document’s name</span>
  <input class="eu-input" bind:value={cover.titles[0]} maxlength={limits.title} autocomplete="off" />
  {#if isRealCountry(cover.titles[0])}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
</label>

<label class="eu-field">
  <span class="eu-label">Its name in a second language</span>
  <input class="eu-input" bind:value={cover.titles[1]} maxlength={limits.title} autocomplete="off" aria-describedby="second-help" />
  <span class="eu-help" id="second-help">Leave empty for a cover in one language.</span>
  {#if isRealCountry(cover.titles[1])}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
</label>

<label class="eu-pill chip">
  <input type="checkbox" bind:checked={cover.chip} />
  Chip symbol
</label>

<style>
  .group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .tile {
    padding: var(--space-1);
  }

  .tile img {
    display: block;
    border-radius: var(--radius-sm);
  }

  .other {
    position: relative;
  }

  /* The colour well covers the whole button, so the button is the target; the swatch shows the colour. */
  .other input {
    position: absolute;
    /* Over the button's own border too, so the target is the full 44 pixels. */
    inset: calc(var(--size-ring) * -0.5);
    width: calc(100% + var(--size-ring));
    height: calc(100% + var(--size-ring));
    margin: 0;
    padding: 0;
    border: 0;
    opacity: 0;
    cursor: pointer;
  }

  .other:has(input:focus-visible) {
    outline: var(--size-ring) solid var(--focus-ring);
    outline-offset: var(--size-ring);
  }

  .arms,
  .chip {
    align-self: flex-start;
  }
</style>
