<script lang="ts">
  /* What the data page and the card share: the holder, the portrait, the numbers and dates, the paper and its pattern. */
  import { faDice, faShuffle } from '@fortawesome/free-solid-svg-icons';
  import Icon from '@eurth/style/components/Icon.svelte';
  import { hexOf, mix, papers as paperTints, printInks } from '../passport/colours';
  import type { Calendar } from '../passport/dates';
  import { REAL_COUNTRY_NOTE, isRealCountry } from '../passport/fiction';
  import { MAX_SEED, MAX_VALID_YEARS, MIN_VALID_YEARS, limits, type Card, type Holder, type Papers } from '../passport/model';
  import { patterns } from '../passport/patterns';
  import { avatars, clothesColours, drawPortrait, hairColours, skins } from '../passport/portraits';
  import { svgDataUrl } from '../passport/render';
  import Choice from './Choice.svelte';
  import DateInput from './DateInput.svelte';
  import PhotoControls from './PhotoControls.svelte';

  let {
    holder = $bindable(),
    papers = $bindable(),
    card = $bindable(),
    photo = $bindable(),
    calendar,
    showCard,
    onnewholder,
  }: {
    holder: Holder;
    papers: Papers;
    card: Card;
    /** The visitor's own photograph, for this visit; null for one of the drawings. */
    photo: string | null;
    calendar: Calendar;
    /** The card's own titles are shown with the card, not with the passport. */
    showCard: boolean;
    onnewholder: () => void;
  } = $props();

  const ground = $derived(mix(hexOf(paperTints, papers.paper), hexOf(printInks, papers.ink), 0.14));
  const faces = $derived(
    avatars.map((a) => ({
      id: a.id,
      name: a.name,
      src: svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125"><rect width="100" height="125" fill="${ground}"/>${drawPortrait({ ...papers.portrait, avatar: a.id })}</svg>`),
    })),
  );
  const years = $derived(Number.isFinite(Number(papers.years)) ? Number(papers.years) : MIN_VALID_YEARS);
</script>

{#if showCard}
  <label class="eu-field">
    <span class="eu-label">The card’s name</span>
    <input class="eu-input" bind:value={card.titles[0]} maxlength={limits.title} autocomplete="off" />
    {#if isRealCountry(card.titles[0])}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
  </label>
  <label class="eu-field">
    <span class="eu-label">Its name in a second language</span>
    <input class="eu-input" bind:value={card.titles[1]} maxlength={limits.title} autocomplete="off" />
    {#if isRealCountry(card.titles[1])}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
  </label>
{/if}

<div class="eu-row">
  <button type="button" class="eu-btn" data-click="tumble" onclick={onnewholder}><Icon icon={faDice} /> New holder</button>
  <span class="eu-help">An invented person, every time.</span>
</div>

<div class="pair">
  <label class="eu-field">
    <span class="eu-label">Given names</span>
    <input class="eu-input" bind:value={holder.given} maxlength={limits.given} autocomplete="off" />
  </label>
  <label class="eu-field">
    <span class="eu-label">Surname</span>
    <input class="eu-input" bind:value={holder.surname} maxlength={limits.surname} autocomplete="off" />
  </label>
</div>

<DateInput legend="Date of birth" {calendar} bind:value={holder.born} />

<label class="eu-field">
  <span class="eu-label">Place of birth</span>
  <input class="eu-input" bind:value={holder.birthplace} maxlength={limits.place} autocomplete="off" />
</label>

<fieldset class="group">
  <legend class="eu-label">Portrait</legend>
  {#if !photo}
    <div class="grid">
      {#each faces as face (face.id)}
        <button type="button" class="eu-btn eu-btn--icon tile" aria-pressed={papers.portrait.avatar === face.id} data-tip={face.name} onclick={() => (papers.portrait.avatar = face.id)}>
          <img src={face.src} alt="" width="44" height="55" />
          <span class="eu-visually-hidden">{face.name}</span>
        </button>
      {/each}
    </div>
  {/if}
  <PhotoControls bind:photo />
</fieldset>

{#if !photo}
  <Choice legend="Skin" name="skin" options={skins} bind:value={papers.portrait.skin} />
  <Choice legend="Hair" name="hair" options={hairColours} bind:value={papers.portrait.hair} />
  <Choice legend="Clothes" name="clothes" options={clothesColours} bind:value={papers.portrait.clothes} />
{/if}

<label class="eu-field">
  <span class="eu-label">Document number</span>
  <input class="eu-input eu-input--data" bind:value={papers.number} maxlength={limits.number} autocomplete="off" aria-describedby="number-help" />
  <span class="eu-help" id="number-help">Capital letters, digits, spaces and hyphens.</span>
</label>

<DateInput legend="Date of issue" {calendar} bind:value={papers.issued} />

<label class="eu-field">
  <span class="eu-label">Valid for <output class="eu-data">{years}</output> {years === 1 ? 'year' : 'years'}</span>
  <input class="eu-range" type="range" min={MIN_VALID_YEARS} max={MAX_VALID_YEARS} step="1" bind:value={papers.years} style:--fill="{((years - MIN_VALID_YEARS) / (MAX_VALID_YEARS - MIN_VALID_YEARS)) * 100}%" />
</label>

<label class="eu-field">
  <span class="eu-label">Issuing authority</span>
  <input class="eu-input" bind:value={papers.authority} maxlength={limits.authority} autocomplete="off" />
  {#if isRealCountry(papers.authority)}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
</label>

<Choice legend="Paper" name="paper" options={paperTints} bind:value={papers.paper} />
<Choice legend="Printing ink" name="ink" options={printInks} bind:value={papers.ink} />
<Choice legend="Security pattern" name="pattern" options={patterns} bind:value={papers.pattern} />
<div class="eu-row">
  <button type="button" class="eu-btn" data-click="spin" disabled={papers.pattern === 'none'} onclick={() => (papers.seed = Math.floor(Math.random() * MAX_SEED))}>
    <Icon icon={faShuffle} /> Redraw the pattern
  </button>
</div>

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
    height: auto;
    padding: var(--space-1);
  }

  .tile img {
    display: block;
    border-radius: var(--radius-sm);
  }

  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }
</style>
