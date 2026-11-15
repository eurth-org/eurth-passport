<script lang="ts">
  /*
   * The designer: one Svelte component, hydrated on the start page.
   *   - The papers live in the link (?d=…), read safely on arrival and kept in step after.
   *   - Nothing is stored: "save" is a link, a picture or the nation's profile file.
   *   - What is typed is kept as typed; what is drawn is the cleaned design, so a real country's
   *     name, a photograph or a machine-readable line never reaches a document (fiction.ts).
   *   - Every document is shown as a picture with its description as the alternative text.
   */
  import { faCheck, faDownload, faPlus, faRotateLeft, faStamp, faTrash } from '@fortawesome/free-solid-svg-icons';
  import { createProfile, getSection, setSection, type EurthProfile } from '@eurth/profile';
  import ProfileButtons from '@eurth/profile/ProfileButtons.svelte';
  import { PICTURE_SIZES, calm, download, fileSlug, playTones, resolveColors, stateFromLocation, stateLink, stateToLocation, svgToPicture, toast } from '@eurth/style';
  import Icon from '@eurth/style/components/Icon.svelte';
  import ShareButtons from '@eurth/style/components/ShareButtons.svelte';
  import tokens from '@eurth/style/tokens.json';
  import { onMount } from 'svelte';
  import { cleanDesign } from '../passport/clean';
  import { calendarOf } from '../passport/dates';
  import { describeDocument, describeStamp, titleOf } from '../passport/describe';
  import { REAL_COUNTRY_NOTE, isRealCountry } from '../passport/fiction';
  import { PICTURE_ERROR, pictureFile, type PictureKind } from '../passport/files';
  import { MOON_STAMP_TEXT, hasMoonVisa } from '../passport/fun';
  import { compactDesign, expandDesign } from '../passport/link';
  import { MAX_SEED, MAX_STAMPS, defaultDesign, defaultStamp, limits, stampKindNames, stampKinds, type Design, type DocumentRef, type StampKind } from '../passport/model';
  import { generateHolder, generateNumber } from '../passport/names';
  import { designFromProfile, nextSection, type ProfileFacts } from '../passport/profile';
  import { armsUsed, renderDocument, renderShare, renderStamp, sizes, svgDataUrl } from '../passport/render';
  import { stampExtent } from '../passport/stamps';
  import CoverControls from './CoverControls.svelte';
  import PapersControls from './PapersControls.svelte';
  import StampControls from './StampControls.svelte';
  import VisaPage from './VisaPage.svelte';

  // Passed in by the page: browser code never imports eurth.config.mjs (see the note there).
  let { siteName, siteUrl }: { siteName: string; siteUrl: string } = $props();

  const tabs = [
    { id: 'cover', name: 'Cover', file: 'passport-cover' },
    { id: 'data', name: 'Data page', file: 'passport-data-page' },
    { id: 'cardFront', name: 'Card, front', file: 'identity-card-front' },
    { id: 'cardBack', name: 'Card, back', file: 'identity-card-back' },
    { id: 'stamps', name: 'Stamps', file: 'visa-page' },
  ] as const;
  type Tab = (typeof tabs)[number]['id'];

  // As typed. Everything drawn, described, linked or saved goes through `shown`.
  let design = $state<Design>(defaultDesign());
  let profile = $state<EurthProfile | null>(null);
  let facts = $state<ProfileFacts | null>(null);
  let tab = $state<Tab>('cover');
  let chosen = $state(0);
  let thumped = $state<number | null>(null);
  let size = $state('own');
  let ready = $state(false);

  const shown = $derived(cleanDesign(design));
  const arms = $derived(facts?.arms ?? null);
  const calendar = $derived(calendarOf(shown.calendar));
  const ref = $derived<DocumentRef>(tab === 'stamps' ? { kind: 'visaPage' } : { kind: tab });
  const svg = $derived(renderDocument(shown, ref, { arms, idPrefix: 'stage' }));
  const description = $derived(describeDocument(shown, ref, { armsUsed: armsUsed(shown, { arms }) }));
  const box = $derived(tab === 'cover' ? sizes.cover : tab === 'data' ? sizes.data : tab === 'stamps' ? sizes.page : sizes.card);
  const stamp = $derived(shown.stamps[chosen]);
  // Before the page has loaded there is no address to read: the site's own, then.
  const link = $derived(stateLink(compactDesign(shown), { base: ready ? location.href : `${siteUrl}/` }));
  const ground = resolveColors(tokens, 'dark').surface ?? '#002b36';

  onMount(() => {
    // A link is someone else's input: decodeState never throws, and expandDesign checks and clamps every value.
    const arrived = stateFromLocation({ maxLength: 24000 });
    if (arrived?.version === 1) design = expandDesign(arrived.value);
    ready = true;
  });

  // The address bar follows the papers, so the link can be copied from there too.
  $effect(() => {
    const state = compactDesign(shown);
    if (ready) stateToLocation(state);
  });

  // A stamp that has gone leaves the one before it chosen.
  $effect(() => {
    if (chosen > 0 && chosen >= design.stamps.length) chosen = Math.max(0, design.stamps.length - 1);
  });

  // The easter egg: a visa for the Moon gets a second stamp, and a word of advice.
  let moon = false;
  $effect(() => {
    const now = hasMoonVisa(shown.stamps);
    if (now && !moon && ready) toast(MOON_STAMP_TEXT);
    moon = now;
  });

  /** The signature touch: the stamp thumps onto the page, and the page takes the knock. */
  function thump(index: number) {
    playTones([[98, 0, 0.06], [62, 0.012, 0.05]], { length: 0.16, cutoff: 500 });
    if (calm()) return;
    thumped = index;
    setTimeout(() => (thumped = null), 450);
  }

  function newHolder() {
    const seed = Math.floor(Math.random() * MAX_SEED);
    design.holder = generateHolder(seed, { names: facts?.names, calendar: shown.calendar, issued: shown.papers.issued, capital: facts?.capital ?? undefined });
    design.papers.number = generateNumber(seed);
    toast(`Meet ${design.holder.given} ${design.holder.surname}, who has never existed.`);
  }

  function startAgain() {
    design = defaultDesign();
    chosen = 0;
    toast('Fresh papers.');
  }

  function addStamp(kind: StampKind) {
    if (design.stamps.length >= MAX_STAMPS) {
      toast(`A page holds ${MAX_STAMPS} stamps. Take one off to add another.`);
      return;
    }
    const random = (min: number, max: number): number => Math.round(min + Math.random() * (max - min));
    const top = design.stamps[0]?.top ?? facts?.commonName ?? defaultStamp(kind).top;
    design.stamps.push({ ...defaultStamp(kind), top, x: random(15, 85), y: random(12, 88), rot: random(-9, 9), seed: random(0, MAX_SEED) });
    chosen = design.stamps.length - 1;
    thump(chosen);
  }

  function removeStamp() {
    design.stamps.splice(chosen, 1);
  }

  function loaded(next: EurthProfile) {
    profile = next;
    // Read what other tools wrote; never change their sections.
    const read = designFromProfile(next);
    design = read.design;
    facts = read.facts;
    chosen = 0;
    toast(read.facts.notes[0] ?? `${next.meta.nation || 'Your nation'} is loaded.`);
  }

  // What "Save profile" writes: the passport section, and nothing else.
  const saved = $derived.by(() => {
    const base = profile ?? createProfile(shown.state.name);
    return setSection(base, 'passport', nextSection(getSection(base, 'passport'), shown, { arms }));
  });

  const slug = $derived(`${fileSlug(shown.state.name, 'papers')}-${tabs.find((t) => t.id === tab)!.file}`);

  /** The picture as chosen: the document as it is, or set on a ground in one of the sharing sizes. */
  function picture(): { svg: string; width: number; height: number; name: string } {
    const preset = PICTURE_SIZES.find((p) => p.id === size);
    if (!preset) return { svg, width: box.w * 2, height: box.h * 2, name: slug };
    return { svg: renderShare(shown, ref, preset, ground, { arms, idPrefix: 'share' }), width: preset.width, height: preset.height, name: `${slug}-${preset.id}` };
  }

  async function save(kind: 'svg' | 'png' | 'webp') {
    const p = picture();
    if (kind === 'svg') download(p.svg, `${p.name}.svg`, 'image/svg+xml');
    else await savePicture(p.svg, p.width, p.height, p.name, kind);
  }

  /** Draws a picture and downloads it, named for what the browser really made (Safari answers WebP with a PNG). */
  async function savePicture(svg: string, width: number, height: number, name: string, kind: PictureKind) {
    try {
      const blob = await svgToPicture(svg, { width, height, type: kind === 'png' ? 'image/png' : 'image/webp', quality: 0.92 });
      const file = pictureFile(name, kind, blob.type);
      download(blob, file.filename);
      if (file.note) toast(file.note);
    } catch {
      toast(PICTURE_ERROR);
    }
  }

  /** The chosen stamp on its own, on a clear ground: for a forum post or a wiki page. */
  async function saveStamp(kind: 'svg' | 'png') {
    if (!stamp) return;
    const one = renderStamp(shown, chosen, { idPrefix: 'one' });
    const name = `${fileSlug(shown.state.name, 'papers')}-${stamp.kind}-stamp`;
    const extent = stampExtent(stamp);
    if (kind === 'svg') download(one, `${name}.svg`, 'image/svg+xml');
    else await savePicture(one, Math.round(extent.w * 3), Math.round(extent.h * 3), name, 'png');
  }
</script>

<div class="designer">
  <fieldset class="tabs">
    <legend class="eu-visually-hidden">Document</legend>
    <div class="eu-row">
      {#each tabs as t (t.id)}
        <label class="eu-pill">
          <input type="radio" name="document" value={t.id} bind:group={tab} />
          <span class="eu-check"><Icon icon={faCheck} /></span>
          {t.name}
        </label>
      {/each}
      <button type="button" class="eu-btn eu-btn--quiet" data-click="spin" onclick={startAgain}><Icon icon={faRotateLeft} /> Start again</button>
    </div>
  </fieldset>

  <div class="bench">
    <form class="eu-card controls" onsubmit={(e) => e.preventDefault()}>
      <label class="eu-field">
        <span class="eu-label">The state</span>
        <input class="eu-input" bind:value={design.state.name} maxlength={limits.stateName} autocomplete="off" aria-describedby="state-help" />
        <span class="eu-help" id="state-help">Its formal name, as on the cover. An invented one.</span>
        {#if isRealCountry(design.state.name)}<span class="eu-error">{REAL_COUNTRY_NOTE}</span>{/if}
      </label>

      {#if tab === 'cover'}
        <CoverControls bind:cover={design.cover} hasArms={arms !== null} />
      {:else if tab === 'stamps'}
        <div class="eu-row">
          {#each stampKinds as kind (kind)}
            <button type="button" class="eu-btn" data-click="bounce" onclick={() => addStamp(kind)}><Icon icon={faPlus} /> {stampKindNames[kind]}</button>
          {/each}
        </div>
        {#if design.stamps[chosen]}
          <p class="eu-label">
            {stampKindNames[shown.stamps[chosen]?.kind ?? 'entry']} {chosen + 1} of {design.stamps.length}
          </p>
          <div class="eu-row">
            <button type="button" class="eu-btn eu-btn--primary" onclick={() => thump(chosen)}><Icon icon={faStamp} /> Stamp it</button>
            <button type="button" class="eu-btn" data-click="swing-left" onclick={removeStamp}><Icon icon={faTrash} /> Take it off</button>
          </div>
          <p class="eu-help">Pick a stamp on the page to change it. Drag it to move it, or use the arrow keys.</p>
          <StampControls bind:stamp={design.stamps[chosen]} {calendar} />
        {:else}
          <p class="eu-help">An empty page. Add a stamp to begin the journey.</p>
        {/if}
      {:else}
        <label class="eu-field">
          <span class="eu-label">Nationality</span>
          <input class="eu-input" bind:value={design.state.demonym} maxlength={limits.demonym} autocomplete="off" aria-describedby="demonym-help" />
          <span class="eu-help" id="demonym-help">What the people are called.</span>
        </label>
        <PapersControls bind:holder={design.holder} bind:papers={design.papers} bind:card={design.card} {calendar} showCard={tab !== 'data'} onnewholder={newHolder} />
      {/if}
    </form>

    <section class="result" aria-labelledby="result-title">
      <h2 id="result-title" class="eu-visually-hidden">Your papers</h2>
      {#if tab === 'stamps'}
        <VisaPage {shown} {chosen} {thumped} onchoose={(index) => (chosen = index)} onmove={(index, x, y) => Object.assign(design.stamps[index] ?? {}, { x, y })} />
      {:else}
        <img class="document" class:upright={tab === 'cover'} src={svgDataUrl(svg)} alt={description} width={box.w} height={box.h} />
      {/if}
      <p class="eu-muted" aria-hidden={tab === 'stamps' ? undefined : 'true'}>{description}</p>

      <ShareButtons
        url={link}
        title={titleOf(shown, ref)}
        text={`${description} Made with ${siteName}, for a country that doesn’t exist.`}
        description={() => (tab === 'stamps' && stamp ? `${description} ${describeStamp(stamp, shown)}` : description)}
        picture={() => svgToPicture(renderShare(shown, ref, { width: 1200, height: 630 }, ground, { arms, idPrefix: 'share' }), { width: 1200, height: 630 })}
        heading={`Share ${shown.state.name}`}
        said={{ link: 'Link copied: the papers are in it.' }}
      />

      <div class="eu-row">
        <label class="eu-field size">
          <span class="eu-label">Picture</span>
          <select class="eu-select" bind:value={size}>
            <option value="own">The document itself</option>
            {#each PICTURE_SIZES as p (p.id)}
              <option value={p.id}>{p.name}, {p.width} × {p.height}</option>
            {/each}
          </select>
        </label>
        <button type="button" class="eu-btn" data-click="bounce" onclick={() => save('svg')}><Icon icon={faDownload} /> SVG</button>
        <button type="button" class="eu-btn" data-click="bounce" onclick={() => save('png')}><Icon icon={faDownload} /> PNG</button>
        <button type="button" class="eu-btn" data-click="bounce" onclick={() => save('webp')}><Icon icon={faDownload} /> WebP</button>
      </div>
      {#if tab === 'stamps' && stamp}
        <div class="eu-row">
          <span class="eu-label">This stamp alone</span>
          <button type="button" class="eu-btn" data-click="bounce" onclick={() => saveStamp('svg')}><Icon icon={faDownload} /> SVG</button>
          <button type="button" class="eu-btn" data-click="bounce" onclick={() => saveStamp('png')}><Icon icon={faDownload} /> PNG</button>
        </div>
      {/if}
      <div class="eu-row">
        <ProfileButtons profile={saved} onload={loaded} onerror={(errors) => toast(errors[0]?.message ?? 'That file isn’t a nation profile. Pick one that ends in .eurth.json.')} />
      </div>
      <p class="eu-help">
        The link holds all the papers. The profile file carries your nation from one Eurth tool to the next, and brings its name, arms, names and calendar here;
        nothing is kept in this browser.
      </p>
    </section>
  </div>
</div>

<style>
  .designer {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .tabs {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .bench {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
    gap: var(--space-6);
    align-items: start;
  }

  .controls {
    gap: var(--space-4);
  }

  .result {
    position: sticky;
    top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }

  .document {
    display: block;
    width: 100%;
    height: auto;
  }

  .upright {
    max-width: calc(var(--size-measure) * 0.5);
    margin: 0 auto;
  }

  .size {
    flex: 1 1 calc(var(--space-16) * 3);
  }

  @media (max-width: 800px) {
    .bench {
      grid-template-columns: minmax(0, 1fr);
    }

    /* On a phone the result comes first: it is what the visitor came for. */
    .result {
      position: static;
      order: -1;
    }
  }
</style>
