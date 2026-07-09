import { useEffect, useRef } from 'react';

// Eigener Mauszeiger im Orbital-Motiv des HifiPlanet-Logos: ein gefuellter markengruener
// Kern, um den ein kleiner "Satellit" auf einer schraeg gestellten Ellipsenbahn kreist
// (wie der Orbit-Schwung im Logo). Ueber interaktiven Elementen weitet sich die Bahn,
// der Satellit beschleunigt und alles leuchtet heller; ein Klick loest einen kurzen
// "Bass-Thump"-Puls aus. Kern UND Bahn folgen der Maus synchron (kein Nachziehen -
// das wirkte bei schnellen Bewegungen wie zwei getrennte Zeiger); nur Umlauf-
// geschwindigkeit und Bahnradius wechseln weich zwischen den Zustaenden.
//
// Aktiv nur auf Geraeten mit echter Maus (pointer: fine) und NICHT bei reduzierter
// Bewegung (prefers-reduced-motion) - sonst bleibt der native Cursor unangetastet.
// Ueber Textfeldern blendet sich der Orbit aus und der native Text-Cursor uebernimmt
// (siehe zugehoerige CSS-Regeln in index.css unter "Custom Cursor").

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], label, select, summary, [data-cursor="hover"], .cursor-pointer';
const TEXTLIKE_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea, [contenteditable="true"]';

export default function CustomCursor() {
  const rootRef = useRef(null);
  const coreRef = useRef(null);
  const orbitRef = useRef(null);
  const satRef = useRef(null);
  const pulseRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reducedMotion.matches) return undefined;

    const root = rootRef.current;
    const core = coreRef.current;
    const orbit = orbitRef.current;
    const sat = satRef.current;
    const pulse = pulseRef.current;
    if (!root || !core || !orbit || !sat || !pulse) return undefined;

    document.documentElement.classList.add('hifi-cursor-on');

    // Bahn-Neigung wie der Orbit-Schwung im Logo.
    const TILT = (-24 * Math.PI) / 180;
    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);

    let mouseX = -100;
    let mouseY = -100;
    let angle = 0;
    // Umlaufgeschwindigkeit (rad/s) und Bahnradien werden pro Frame weich in Richtung
    // ihrer Zielwerte gezogen, damit Hover-Wechsel nie springen.
    let speed = 2.4;
    let targetSpeed = 2.4;
    let radiusX = 16;
    let radiusY = 6.5;
    let targetRadiusX = 16;
    let targetRadiusY = 6.5;
    let visible = false;
    let rafId;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      speed += (targetSpeed - speed) * Math.min(1, dt * 8);
      radiusX += (targetRadiusX - radiusX) * Math.min(1, dt * 10);
      radiusY += (targetRadiusY - radiusY) * Math.min(1, dt * 10);
      angle += speed * dt;

      core.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      orbit.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      const ex = Math.cos(angle) * radiusX;
      const ey = Math.sin(angle) * radiusY;
      sat.style.transform = `translate(${ex * cosT - ey * sinT}px, ${ex * sinT + ey * cosT}px)`;

      rafId = requestAnimationFrame(tick);
    };

    const applyState = (state) => {
      root.dataset.state = state;
      const hovering = state === 'hover';
      targetSpeed = hovering ? 7 : 2.4;
      targetRadiusX = hovering ? 23 : 16;
      targetRadiusY = hovering ? 9.5 : 6.5;
    };

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        root.dataset.hidden = 'false';
      }
    };

    const onMouseOver = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest(TEXTLIKE_SELECTOR)) applyState('text');
      else if (target.closest(INTERACTIVE_SELECTOR)) applyState('hover');
      else applyState('default');
    };

    const onMouseDown = () => {
      root.dataset.down = 'true';
      pulse.style.left = `${mouseX}px`;
      pulse.style.top = `${mouseY}px`;
      // Animation neu anstossen, auch wenn sie gerade noch laeuft.
      pulse.classList.remove('is-live');
      void pulse.offsetWidth;
      pulse.classList.add('is-live');
    };
    const onMouseUp = () => {
      root.dataset.down = 'false';
    };

    const onLeave = () => {
      visible = false;
      root.dataset.hidden = 'true';
    };

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mousedown', onMouseDown, { passive: true });
    document.addEventListener('mouseup', onMouseUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onLeave);
      document.documentElement.classList.remove('hifi-cursor-on');
    };
  }, []);

  return (
    <div ref={rootRef} className="hifi-cursor" data-state="default" data-hidden="true" data-down="false" aria-hidden="true">
      <div ref={orbitRef} className="hifi-cursor__orbit">
        <div className="hifi-cursor__ring" />
        <div ref={satRef} className="hifi-cursor__sat" />
      </div>
      <div ref={coreRef} className="hifi-cursor__core" />
      <div ref={pulseRef} className="hifi-cursor__pulse" />
    </div>
  );
}
