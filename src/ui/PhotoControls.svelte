<script lang="ts">
  /*
   * The visitor's own photograph for the data page and the card: picked from their device, cut
   * to four by five here, moved and enlarged with the sliders or by dragging. It is kept in
   * memory for the visit and nowhere else, and every document draws SPECIMEN across it.
   */
  import { faImage, faTrash } from '@fortawesome/free-solid-svg-icons';
  import { toast } from '@eurth/style';
  import Icon from '@eurth/style/components/Icon.svelte';
  import { OWN_PICTURE_NOTE } from '../passport/fiction';
  import { MAX_ZOOM, MIN_ZOOM, PHOTO_FILES, centred, cropPhoto, photoFromFile, pickFile, slack, type Crop } from './pictures';

  let { photo = $bindable() }: { photo: string | null } = $props();

  // The photograph as it was picked: held here, in memory, for as long as the page is open.
  let source = $state.raw<HTMLImageElement | null>(null);
  let crop = $state<Crop>(centred());
  let frame = $state<HTMLElement | null>(null);
  let grip: { x: number; y: number } | null = null;

  const pc = (value: number): number => Math.round(value * 100);
  const room = $derived(source ? slack(source, crop) : { x: 0, y: 0 });

  // The document follows the crop.
  $effect(() => {
    if (source) photo = cropPhoto(source, crop);
  });

  // "Start again" takes the photograph off from outside: let go of the picture it was cut from, too.
  $effect(() => {
    if (!photo) source = null;
  });

  async function choose() {
    const file = await pickFile(PHOTO_FILES);
    if (!file) return;
    try {
      const picked = await photoFromFile(file);
      crop = centred();
      photo = cropPhoto(picked, crop);
      source = picked;
      toast('Your photograph is on the papers, with SPECIMEN across it.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'That file couldn’t be read as a picture.');
    }
  }

  function remove() {
    source = null;
    photo = null;
    toast('The photograph is gone. A drawing is back in its place.');
  }

  function hold(event: PointerEvent) {
    if (!frame) return;
    grip = { x: event.clientX, y: event.clientY };
    frame.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent) {
    if (!grip || !frame) return;
    const box = frame.getBoundingClientRect();
    const dx = (event.clientX - grip.x) / box.width;
    const dy = (event.clientY - grip.y) / box.height;
    grip = { x: event.clientX, y: event.clientY };
    // Pulling the picture right shows more of its left side.
    if (room.x > 0) crop.x = Math.min(1, Math.max(0, crop.x - dx / room.x));
    if (room.y > 0) crop.y = Math.min(1, Math.max(0, crop.y - dy / room.y));
  }
</script>

{#if source && photo}
  <div class="cropper">
    <!-- Dragging is a shortcut for the sliders beside it, which do the same from the keyboard. -->
    <div class="frame" bind:this={frame} onpointerdown={hold} onpointermove={drag} onpointerup={() => (grip = null)} onpointercancel={() => (grip = null)} role="presentation">
      <img src={photo} alt="Your photograph, as it is cut for the papers" width="160" height="200" draggable="false" />
    </div>
    <div class="sliders">
      <label class="eu-field">
        <span class="eu-label">Size <output class="eu-data">{pc(crop.zoom)}%</output></span>
        <input class="eu-range" type="range" min={MIN_ZOOM} max={MAX_ZOOM} step="0.05" bind:value={crop.zoom} style:--fill="{((crop.zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%" />
      </label>
      <label class="eu-field">
        <span class="eu-label">Left to right</span>
        <input class="eu-range" type="range" min="0" max="1" step="0.01" bind:value={crop.x} disabled={room.x <= 0} style:--fill="{crop.x * 100}%" />
      </label>
      <label class="eu-field">
        <span class="eu-label">Top to bottom</span>
        <input class="eu-range" type="range" min="0" max="1" step="0.01" bind:value={crop.y} disabled={room.y <= 0} style:--fill="{crop.y * 100}%" />
      </label>
    </div>
  </div>
  <div class="eu-row">
    <button type="button" class="eu-btn" data-click="bounce" onclick={choose}><Icon icon={faImage} /> Another photograph</button>
    <button type="button" class="eu-btn" data-click="swing-left" onclick={remove}><Icon icon={faTrash} /> Take it off</button>
  </div>
  <p class="eu-help">Drag the photograph to move it, or use the sliders. {OWN_PICTURE_NOTE}</p>
{:else}
  <div class="eu-row">
    <button type="button" class="eu-btn" data-click="bounce" onclick={choose}><Icon icon={faImage} /> Your own photograph</button>
  </div>
  <p class="eu-help">One of the drawings, or a photograph of your own, with SPECIMEN across it. {OWN_PICTURE_NOTE}</p>
{/if}

<style>
  .cropper {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    align-items: flex-start;
  }

  .frame {
    flex: 0 0 auto;
    width: calc(var(--space-16) * 2.5);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    overflow: hidden;
    cursor: grab;
    touch-action: none;
  }

  .frame:active {
    cursor: grabbing;
  }

  .frame img {
    display: block;
    width: 100%;
    height: auto;
    user-select: none;
  }

  .sliders {
    display: flex;
    flex: 1 1 calc(var(--space-16) * 2.5);
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }
</style>
