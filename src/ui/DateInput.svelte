<script lang="ts">
  /*
   * A date as a day, a month and a year, in whatever calendar the papers keep: the profile's
   * own months and era, or the plain twelve.
   */
  import type { Calendar, DateParts } from '../passport/dates';

  let { legend, calendar, value = $bindable() }: { legend: string; calendar: Calendar; value: DateParts } = $props();

  const days = $derived(calendar.months[Math.min(calendar.months.length, Math.max(1, value.m)) - 1]?.days ?? 31);
</script>

<fieldset class="date">
  <legend class="eu-label">{legend}</legend>
  <div class="parts">
    <label class="eu-field day">
      <span class="eu-help">Day</span>
      <input class="eu-input eu-input--data" type="number" min="1" max={days} step="1" inputmode="numeric" bind:value={value.d} />
    </label>
    <label class="eu-field month">
      <span class="eu-help">Month</span>
      <select class="eu-select" bind:value={value.m}>
        {#each calendar.months as month, index (index)}
          <option value={index + 1}>{month.name}</option>
        {/each}
      </select>
    </label>
    <label class="eu-field year">
      <span class="eu-help">Year{calendar.era ? ` (${calendar.era})` : ''}</span>
      <input class="eu-input eu-input--data" type="number" min="-9999" max="99999" step="1" inputmode="numeric" bind:value={value.y} />
    </label>
  </div>
</fieldset>

<style>
  .date {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .parts {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 5fr) minmax(0, 3fr);
    gap: var(--space-2);
  }
</style>
