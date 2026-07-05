import { useLayoutEffect, useRef } from 'react';
import StarRating from './StarRating.jsx';

const SPEED_PX_PER_SEC = 70;

// Läuft als Endlos-Marquee (links -> rechts): der Track enthält die Liste doppelt
// hintereinander. Die Position wird per rAF selbst verwaltet (statt CSS-Animation),
// damit sie sich beim Hovern anhalten UND per Drag manuell verschieben lässt.
export default function TestimonialSlider({ testimonials }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const state = useRef({
    pos: 0,
    half: 0,
    hovering: false,
    dragging: false,
    dragStartX: 0,
    dragStartPos: 0,
    lastTime: null,
    rafId: null,
  }).current;

  useLayoutEffect(() => {
    const track = trackRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyPos = () => {
      track.style.transform = `translateX(${state.pos}px)`;
    };

    const normalize = (pos) => {
      if (state.half <= 0) return pos;
      while (pos > 0) pos -= state.half;
      while (pos <= -state.half) pos += state.half;
      return pos;
    };

    const measure = () => {
      state.half = track.scrollWidth / 2;
      if (state.pos === 0) {
        state.pos = -state.half;
      } else {
        state.pos = normalize(state.pos);
      }
      applyPos();
    };
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);

    const tick = (time) => {
      if (state.lastTime === null) state.lastTime = time;
      const dt = (time - state.lastTime) / 1000;
      state.lastTime = time;

      if (!state.dragging && !state.hovering && !reduceMotion) {
        state.pos = normalize(state.pos + SPEED_PX_PER_SEC * dt);
        applyPos();
      }
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);

    const viewport = viewportRef.current;

    const onPointerEnter = () => {
      state.hovering = true;
    };
    const onPointerLeave = () => {
      state.hovering = false;
    };
    const onPointerDown = (e) => {
      state.dragging = true;
      state.dragStartX = e.clientX;
      state.dragStartPos = state.pos;
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('cursor-grabbing');
      viewport.classList.remove('cursor-grab');
    };
    const onPointerMove = (e) => {
      if (!state.dragging) return;
      state.pos = normalize(state.dragStartPos + (e.clientX - state.dragStartX));
      applyPos();
    };
    const endDrag = (e) => {
      if (!state.dragging) return;
      state.dragging = false;
      if (viewport.hasPointerCapture(e.pointerId)) {
        viewport.releasePointerCapture(e.pointerId);
      }
      viewport.classList.remove('cursor-grabbing');
      viewport.classList.add('cursor-grab');
    };

    viewport.addEventListener('pointerenter', onPointerEnter);
    viewport.addEventListener('pointerleave', onPointerLeave);
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    return () => {
      cancelAnimationFrame(state.rafId);
      resizeObserver.disconnect();
      viewport.removeEventListener('pointerenter', onPointerEnter);
      viewport.removeEventListener('pointerleave', onPointerLeave);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endDrag);
      viewport.removeEventListener('pointercancel', endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testimonials.length]);

  const track = [...testimonials, ...testimonials];

  return (
    <div
      ref={viewportRef}
      className="marquee-viewport cursor-grab touch-pan-y select-none overflow-hidden"
    >
      <div ref={trackRef} className="marquee-track flex w-max gap-5">
        {track.map((t, i) => (
          <div key={`${t.name}-${i}`} className="w-64 shrink-0 sm:w-72 lg:w-80">
            <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <StarRating className="mb-3 h-4 w-4" />
              <p className="mb-4 flex-1 text-sm text-slate-600 dark:text-slate-300">„{t.text}"</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
