import { useEffect, useState, type RefObject } from "react";

/** Colors of the screen right under the phone's status bar and right above its gesture bar. */
export type EdgeColors = { top: string; bottom: string };

let canvas: HTMLCanvasElement | null = null;

/** Blends the background layers found at one point (topmost first) into a single solid hex color. */
function blend(layers: string[], base: string): string {
  canvas ??= document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return base;
  ctx.globalAlpha = 1;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1, 1);
  for (const c of [...layers].reverse()) {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

const transparent = (c: string) => c === "transparent" || /rgba\(.*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);

function colorAt(x: number, y: number, base: string): string {
  const layers: string[] = [];
  for (const el of document.elementsFromPoint(x, y)) {
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || Number(st.opacity) === 0) continue;
    const bg = st.backgroundColor;
    if (!bg || transparent(bg)) continue;
    layers.push(bg);
    // Stop at the first fully solid layer.
    if (blend([bg], "#00000000") === blend([bg], "#ffffff") ) break;
  }
  return blend(layers, base);
}

/**
 * Watches the app screen and returns the colors at its very top and bottom, so the phone's
 * status bar and gesture bar areas can be painted to match whatever screen is showing.
 */
export function useEdgeColors(content: RefObject<HTMLElement | null>, base: string): EdgeColors {
  const [edges, setEdges] = useState<EdgeColors>({ top: base, bottom: base });

  useEffect(() => {
    const el = content.current;
    if (!el) return;
    let frame = 0;
    const timers: number[] = [];
    const sample = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const x = r.left + r.width / 2;
      const top = colorAt(x, r.top + 1, base);
      const bottom = colorAt(x, r.bottom - 1, base);
      setEdges((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", top);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sample);
      // Screens slide and fade in; check again once they settle.
      timers.push(window.setTimeout(sample, 380), window.setTimeout(sample, 800));
      if (timers.length > 12) timers.splice(0, timers.length - 12).forEach(clearTimeout);
    };
    const mo = new MutationObserver(schedule);
    mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style"] });
    el.addEventListener("animationend", schedule, true);
    el.addEventListener("transitionend", schedule, true);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      mo.disconnect();
      el.removeEventListener("animationend", schedule, true);
      el.removeEventListener("transitionend", schedule, true);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, [content, base]);

  return edges;
}
