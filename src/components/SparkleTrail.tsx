"use client";

import { useEffect } from "react";

// A genuine, time-honored GeoCities cursor sparkle trail. Spawns little
// twinkles that drift down and fade as you move the mouse. Pure decoration —
// disabled for visitors who prefer reduced motion.
const COLORS = ["#ffd95c", "#ff4dff", "#4dff88", "#33ccff", "#ffffff"];

export function SparkleTrail() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let last = 0;
    function onMove(e: MouseEvent) {
      const now = Date.now();
      if (now - last < 40) return; // throttle so we don't carpet the page
      last = now;

      const s = document.createElement("span");
      s.textContent = "✦";
      s.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;
        pointer-events:none;z-index:9999;font-size:${10 + Math.random() * 10}px;
        color:${COLORS[(Math.random() * COLORS.length) | 0]};
        text-shadow:0 0 4px currentColor;transform:translate(-50%,-50%);
        transition:transform .7s ease-out,opacity .7s ease-out;`;
      document.body.appendChild(s);

      requestAnimationFrame(() => {
        s.style.transform = `translate(-50%, ${24 + Math.random() * 20}px) rotate(${
          (Math.random() - 0.5) * 90
        }deg)`;
        s.style.opacity = "0";
      });
      setTimeout(() => s.remove(), 750);
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return null;
}
