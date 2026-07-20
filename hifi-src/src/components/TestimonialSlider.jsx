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
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              {/* Grosses dekoratives Anfuehrungszeichen hinter dem Text - rein optisch,
                  gedeckt genug um nicht mit dem Text zu konkurrieren. */}
              <svg aria-hidden="true" viewBox="0 0 32 24" className="absolute -right-1 -top-1 h-16 w-16 text-brand-500/10 dark:text-brand-400/10">
                <path
                  fill="currentColor"
                  d="M9.4 0C4.4 3.5 1 9.1 1 15.3 1 20.6 4.3 24 8.4 24c3.8 0 6.6-3 6.6-6.6 0-3.4-2.4-5.9-5.4-5.9-.6 0-1.4.1-1.6.2C8.5 8.5 11.6 4.6 14.6 2.6L9.4 0zm16.5 0c-4.8 3.5-8.3 9.1-8.3 15.3 0 5.3 3.3 8.6 7.5 8.6 3.7 0 6.6-3 6.6-6.6 0-3.4-2.5-5.9-5.4-5.9-.6 0-1.4.1-1.6.2.5-3.3 3.6-7.1 6.7-9.1L25.9 0z"
                />
              </svg>

              {/* Feste Zeilenobergrenze statt unbegrenztem Text - eine einzelne lange
                  Google-Rezension soll nicht mehr die ganze Kartenreihe (per Flex-Stretch)
                  auf ihre Hoehe aufblaehen und kurze Kacheln riesig leer wirken lassen. */}
              <StarRating className="relative z-10 mb-3 h-4 w-4" count={t.rating || 5} />
              <p className="relative z-10 mb-4 line-clamp-6 flex-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                „{t.text}"
              </p>
              <div className="relative z-10 mt-auto flex items-center gap-3">
                {t.photo ? (
                  <img src={t.photo} alt="" referrerPolicy="no-referrer" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {t.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
