<script lang="ts">
  /*
   * The visa page on screen: a blank page with each stamp laid over it as its own picture, so a
   * stamp can be picked, dragged, nudged with the arrow keys, and thumped down. The stamps sit
   * exactly where renderVisaPage draws them in the download.
   */
  import { describeStamp } from '../passport/describe';
  import { stampKindNames, type Design } from '../passport/model';
  import { renderStamp, renderVisaPage, sizes, stampCentre, stampOnPage, stampPlace, svgDataUrl } from '../passport/render';

  let {
    shown,
    chosen,
    thumped,
    onchoose,
    onmove,
  }: {
    /** The design, cleaned. */
    shown: Design;
    chosen: number;
    /** The stamp that has just been pressed down, for a moment. */
    thumped: number | null;
    onchoose: (index: number) => void;
    onmove: (index: number, x: number, y: number) => void;
  } = $props();

  const { w, h } = sizes.page;
  let page: HTMLDivElement | undefined = $state();
  let drag: { index: number; dx: number; dy: number } | null = null;

  const blank = $derived(svgDataUrl(renderVisaPage({ ...shown, stamps: [] }, { idPrefix: 'page' })));
  const stamps = $derived(
    shown.stamps.map((stamp, index) => {
      const box = stampOnPage(shown, index)!;
      return {
        src: svgDataUrl(renderStamp(shown, index, { idPrefix: `on${index}` })),
        label: `${stampKindNames[stamp.kind]} ${index + 1} of ${shown.stamps.length}. ${describeStamp(stamp, shown)} Drag it, or move it with the arrow keys.`,
        style: `left:${(box.left / w) * 100}%;top:${(box.top / h) * 100}%;width:${(box.width / w) * 100}%;height:${(box.height / h) * 100}%`,
      };
    }),
  );

  /** A point on the screen, in the page's own units. */
  function onPage(event: PointerEvent): { x: number; y: number } {
    const box = page!.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * w, y: ((event.clientY - box.top) / box.height) * h };
  }

  function grab(event: PointerEvent, index: number) {
    onchoose(index);
    const stamp = shown.stamps[index];
    if (!stamp || !page) return;
    const at = onPage(event);
    const centre = stampCentre(stamp.x, stamp.y);
    drag = { index, dx: centre.cx - at.x, dy: centre.cy - at.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function pull(event: PointerEvent) {
    if (!drag || !page) return;
    const at = onPage(event);
    const place = stampPlace(at.x + drag.dx, at.y + drag.dy);
    onmove(drag.index, place.x, place.y);
  }

  function nudge(event: KeyboardEvent, index: number) {
    const step = event.shiftKey ? 5 : 1;
    const by: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = by[event.key];
    const stamp = shown.stamps[index];
    if (!move || !stamp) return;
    event.preventDefault();
    onmove(index, Math.min(100, Math.max(0, stamp.x + move[0])), Math.min(100, Math.max(0, stamp.y + move[1])));
  }
</script>

<div class="page" class:shake={thumped !== null} bind:this={page}>
  <img class="paper" src={blank} alt="" width={w} height={h} />
  {#each stamps as stamp, index (index)}
    <button
      type="button"
      class="stamp"
      class:thump={thumped === index}
      aria-label={stamp.label}
      aria-pressed={chosen === index}
      style={stamp.style}
      onpointerdown={(event) => grab(event, index)}
      onpointermove={pull}
      onpointerup={() => (drag = null)}
      onpointercancel={() => (drag = null)}
      onkeydown={(event) => nudge(event, index)}
      onclick={() => onchoose(index)}
    >
      <img src={stamp.src} alt="" draggable="false" />
    </button>
  {/each}
</div>

<style>
  .page {
    position: relative;
    width: 100%;
    max-width: calc(var(--size-measure) * 0.62);
    margin: 0 auto;
    aspect-ratio: 352 / 500;
  }

  .paper {
    display: block;
    width: 100%;
    height: 100%;
  }

  .stamp {
    position: absolute;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: none;
    cursor: grab;
    touch-action: none;
  }

  .stamp:active {
    cursor: grabbing;
  }

  .stamp[aria-pressed='true'] {
    outline: 1px dashed var(--line-strong);
    outline-offset: var(--size-ring);
  }

  .stamp:focus-visible {
    outline: var(--size-ring) solid var(--focus-ring);
    outline-offset: var(--size-ring);
  }

  .stamp img {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* The signature touch: the stamp comes down, and the page takes the knock. */
  .thump img {
    animation: thump 300ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
  }

  .shake {
    animation: shake 200ms 150ms;
  }

  @keyframes thump {
    0% {
      opacity: 0;
      transform: scale(1.6);
    }

    55% {
      opacity: 1;
      transform: scale(0.94);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes shake {
    0%,
    100% {
      transform: translate(0, 0);
    }

    25% {
      transform: translate(1px, 2px);
    }

    50% {
      transform: translate(-1px, -1px);
    }

    75% {
      transform: translate(1px, 0);
    }
  }
</style>
