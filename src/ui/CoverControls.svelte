<script lang="ts">
  /* The cover: its colour, the foil it is stamped in, the emblem (ours, the nation's arms or the visitor's own), the title in up to two languages, the chip symbol. */
  import { faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
  import { toast } from '@eurth/style';
  import Icon from '@eurth/style/components/Icon.svelte';
  import { coverColours, coverInk, foils } from '../passport/colours';
  import { emblems } from '../passport/emblems';
  import { OWN_PICTURE_NOTE, REAL_COUNTRY_NOTE, isRealCountry, vectorOnly } from '../passport/fiction';
  import { limits, type Cover } from '../passport/model';
  import { svgDataUrl } from '../passport/render';
  import Choice from './Choice.svelte';
  import { EMBLEM_FILES, emblemFromFile, pickFile } from './pictures';

  let {
    cover = $bindable(),
    hasArms,
    own = $bindable(),
    ownOn = $bindable(),
    ownFoil = $bindable(),
    armsUrl = null,
  }: {
    cover: Cover;
    hasArms: boolean;
    /** The visitor's own emblem, for this visit: kept in memory, never in the design. */
    own: string | null;
    /** Whether it is the one on the cover just now. */
    ownOn: boolean;
    /** Whether it is stamped in foil by its outline, in place of its own colours. */
    ownFoil: boolean;
    /** Where Arms lives, once it is live; null before then, and it isn't named. */
    armsUrl?: string | null;
  } = $props();

  const ownSrc = $derived(own ? (vectorOnly(own) ? svgDataUrl(own) : own) : '');

  async function upload() {
    const file = await pickFile(EMBLEM_FILES);
    if (!file) return;
    try {
      own = await emblemFromFile(file);
      ownOn = true;
      toast('Your emblem is on the cover.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'That file couldn’t be read as a picture.');
    }
  }

  function removeOwn() {
    own = null;
    ownOn = false;
    toast('Your emblem is off the cover.');
  }

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
      <button
        type="button"
        class="eu-btn eu-btn--icon tile"
        aria-pressed={!ownOn && !cover.arms && cover.emblem === emblem.id}
        data-tip={emblem.name}
        onclick={() => ((cover.emblem = emblem.id), (cover.arms = false), (ownOn = false))}
      >
        <img src={emblem.src} alt="" width="44" height="44" />
        <span class="eu-visually-hidden">{emblem.name}</span>
      </button>
    {/each}
    {#if own}
      <button type="button" class="eu-btn eu-btn--icon tile" aria-pressed={ownOn} data-tip="Your own emblem" onclick={() => (ownOn = true)}>
        <img class="own" src={ownSrc} alt="" width="44" height="44" style:--ground={cover.colour} />
        <span class="eu-visually-hidden">Your own emblem</span>
      </button>
    {/if}
  </div>
  {#if hasArms}
    <label class="eu-pill arms">
      <input type="checkbox" checked={cover.arms && !ownOn} onchange={(e) => ((cover.arms = e.currentTarget.checked), (ownOn = false))} />
      Use the arms from the profile
    </label>
  {/if}
  <div class="eu-row">
    <button type="button" class="eu-btn" data-click="bounce" onclick={upload}><Icon icon={faUpload} /> {own ? 'Another emblem of your own' : 'Your own emblem'}</button>
    {#if own}
      <button type="button" class="eu-btn" data-click="swing-left" onclick={removeOwn}><Icon icon={faTrash} /> Take it off</button>
    {/if}
  </div>
  {#if own && ownOn}
    <label class="eu-pill arms">
      <input type="checkbox" bind:checked={ownFoil} />
      Stamp it in foil
    </label>
  {/if}
  <p class="eu-help">
    A picture of your own: an SVG, PNG, JPEG or WebP.
    {#if armsUrl}
      Arms made in <a href={armsUrl}>Arms</a> work too: download them there as SVG, or pick your nation’s profile file here and its arms are taken from it.
    {:else}
      A coat of arms saved in your nation’s profile file works too: pick that file here and its arms are taken from it.
    {/if}
    {OWN_PICTURE_NOTE}
  </p>
  {#if !hasArms}
    <p class="eu-help">To keep a nation’s arms with its papers from visit to visit, load its profile: the arms travel in that file.</p>
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

  /* The visitor's own emblem is shown on the cover's colour, as the others are. */
  .tile .own {
    object-fit: contain;
    background: var(--ground);
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
