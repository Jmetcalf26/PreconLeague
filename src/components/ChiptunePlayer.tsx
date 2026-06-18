"use client";

import { useEffect, useRef, useState } from "react";

// An original 8-bit "battle theme" — a looping square-wave arpeggio built from
// raw note frequencies, generated live with the Web Audio API. No audio assets,
// no autoplay: it only fires after the visitor clicks the button.
const MELODY = [
  // [frequency Hz, beats] — an original little fanfare in A minor
  [440, 1], [523.25, 1], [659.25, 1], [880, 1],
  [659.25, 1], [523.25, 1], [440, 2],
  [392, 1], [493.88, 1], [587.33, 1], [783.99, 1],
  [587.33, 1], [493.88, 1], [392, 2],
] as const;
const BASS = [110, 110, 98, 98, 87.31, 87.31, 82.41, 82.41];
const BEAT = 0.18; // seconds per beat

export function ChiptunePlayer() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  function blip(
    ctx: AudioContext,
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.9);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur);
  }

  function start() {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctor();
    ctxRef.current = ctx;

    const loopLen =
      MELODY.reduce((n, [, beats]) => n + beats, 0) * BEAT;
    let timer: ReturnType<typeof setTimeout>;

    const scheduleBar = () => {
      const t0 = ctx.currentTime + 0.05;
      let t = t0;
      for (const [freq, beats] of MELODY) {
        blip(ctx, freq, t, beats * BEAT, "square", 0.12);
        t += beats * BEAT;
      }
      // walking bass underneath
      for (let i = 0; i < BASS.length; i++) {
        blip(ctx, BASS[i], t0 + i * (loopLen / BASS.length), loopLen / BASS.length, "triangle", 0.18);
      }
      timer = setTimeout(scheduleBar, loopLen * 1000);
    };
    scheduleBar();

    stopRef.current = () => {
      clearTimeout(timer);
      ctx.close();
      ctxRef.current = null;
      stopRef.current = null;
    };
    setPlaying(true);
  }

  function stop() {
    stopRef.current?.();
    setPlaying(false);
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-2 border-2 border-brand-500 bg-ink-950 p-1.5 shadow-[3px_3px_0_0_#000]">
      <button
        onClick={playing ? stop : start}
        className="btn-secondary !px-2 !py-1 text-xs"
        title={playing ? "Stop the tunes" : "Crank the MIDI"}
      >
        {playing ? "■ STOP" : "♪ PLAY MIDI"}
      </button>
      {playing && (
        <span className="hidden w-40 overflow-hidden sm:block">
          <span className="inline-block whitespace-nowrap text-xs font-bold text-[#4dff88] animate-marquee">
            ♫ NOW PLAYING: battle_theme.mid ♫&nbsp;&nbsp;&nbsp;♫ NOW PLAYING:
            battle_theme.mid ♫
          </span>
        </span>
      )}
    </div>
  );
}
