<script lang="ts">
  /* One stamp: its kind, shape and border, what it reads, its ink, and how it landed. */
  import { stampInks } from '../passport/colours';
  import { dateStyles, formatDate, type Calendar } from '../passport/dates';
  import { REAL_COUNTRY_NOTE, isRealCountry } from '../passport/fiction';
  import { MAX_ROTATION, MAX_WEAR, limits, stampBorders, stampKindNames, stampKinds, stampMarks, stampShapes, type Stamp } from '../passport/model';
  import { borderNames, markNames, shapeNames } from '../passport/stamps';
  import { niceWatcher } from '@eurth/style';
  import Choice from './Choice.svelte';
  import DateInput from './DateInput.svelte';

  let { stamp = $bindable(), calendar }: { stamp: Stamp; calendar: Calendar } = $props();

  const named = <T extends string>(ids: readonly T[], names: Record<T, string>) => ids.map((id) => ({ id, name: names[id] }));
  const wearWords = ['Crisp', 'Lightly worn', 'Worn', 'Badly worn'];
  const num = (value: unknown, fallback: number): number => (Number.isFinite(Number(value)) ? Number(value) : fallback);
  const rot = $derived(num(stamp.rot, 0));
  const wear = $derived(Math.min(MAX_WEAR, Math.max(0, Math.round(num(stamp.wear, 0)))));
  const example = { d: 4, m: 1, y: 2026 };
  const styles = $derived(dateStyles.map((id) => ({ id, name: formatDate(example, calendar, id) })));

  // The suite's wink: "Nice." when a number settles on 69.
  let across: HTMLInputElement | undefined = $state();
  let down: HTMLInputElement | undefined = $state();
  const watchAcross = niceWatcher();
  const watchDown = niceWatcher();
  $effect(() => watchAcross(num(stamp.x, 0), () => across));
  $effect(() => watchDown(num(stamp.y, 0), () => down));
</script>

<Choice legend="Kind" name="kind" options={named(stampKinds, stampKindNames)} bind:value={stamp.kind} />
<Choice legend="Shape" name="shape" options={named(stampShapes, shapeNames)} bind:value={stamp.shape} />
<Choice legend="Border" name="border" options={named(stampBorders, borderNames)} bind:value={stamp.border} />
<Choice legend="Ink" name="stamp-ink" options={stampInks} bind:value={stamp.ink} />

<label class="eu-field">
  <span class="eu-label">Top line</span>
  <input class="eu-input" bind:value={stamp.top} maxlength={limits.stampLine} autocomplete="off" aria-describedby="top-help" />
  <span class="eu-help" id="top-help">Usually the state.</span>
  {#if isRealCountry(stamp.top)}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
</label>

<label class="eu-field">
  <span class="eu-label">The big word</span>
  <input class="eu-input" bind:value={stamp.label} maxlength={limits.stampLabel} autocomplete="off" />
  {#if isRealCountry(stamp.label)}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
</label>

<label class="eu-field">
  <span class="eu-label">Place, or what it allows</span>
  <input class="eu-input" bind:value={stamp.place} maxlength={limits.stampLine} autocomplete="off" aria-describedby="place-help" />
  <span class="eu-help" id="place-help">A port, a crossing, a destination, or the terms of a visa.</span>
</label>

<label class="eu-field">
  <span class="eu-label">Bottom line</span>
  <input class="eu-input" bind:value={stamp.bottom} maxlength={limits.stampLine} autocomplete="off" aria-describedby="bottom-help" />
  <span class="eu-help" id="bottom-help">Usually the office.</span>
  {#if isRealCountry(stamp.bottom)}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
</label>

<DateInput legend="Date" {calendar} bind:value={stamp.date} />
<Choice legend="Written as" name="date-style" options={styles} bind:value={stamp.dateStyle} />
<Choice legend="Mark" name="mark" options={named(stampMarks, markNames)} bind:value={stamp.mark} />

<label class="eu-field">
  <span class="eu-label">Turned <output class="eu-data">{Math.abs(rot)}</output>° {rot < 0 ? 'anticlockwise' : rot > 0 ? 'clockwise' : '(straight)'}</span>
  <input class="eu-range" type="range" min={-MAX_ROTATION} max={MAX_ROTATION} step="1" bind:value={stamp.rot} style:--fill="{((rot + MAX_ROTATION) / (MAX_ROTATION * 2)) * 100}%" />
</label>

<label class="eu-field">
  <span class="eu-label">Wear: <output>{wearWords[wear]}</output></span>
  <input class="eu-range" type="range" min="0" max={MAX_WEAR} step="1" bind:value={stamp.wear} style:--fill="{(wear / MAX_WEAR) * 100}%" />
</label>

<div class="pair">
  <label class="eu-field">
    <span class="eu-label">Across: <output class="eu-data">{num(stamp.x, 0)}</output></span>
    <input bind:this={across} class="eu-range" type="range" min="0" max="100" step="1" bind:value={stamp.x} style:--fill="{num(stamp.x, 0)}%" />
  </label>
  <label class="eu-field">
    <span class="eu-label">Down: <output class="eu-data">{num(stamp.y, 0)}</output></span>
    <input bind:this={down} class="eu-range" type="range" min="0" max="100" step="1" bind:value={stamp.y} style:--fill="{num(stamp.y, 0)}%" />
  </label>
</div>

<style>
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }
</style>
