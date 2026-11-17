"use client";

import { useEffect, useRef } from "react";

/**
 * Explosão curta de partículas finas (canvas, sem biblioteca). Discreta: poucas peças,
 * cores da paleta, some em ~1.4s. Não renderiza nada se a pessoa pediu menos movimento.
 */
export function Burst({
  colors,
  count = 70,
  spread = 1,
  className = "",
}: {
  /** variáveis CSS, ex.: ["--gold", "--accent"] */
  colors: string[];
  count?: number;
  /** 1 = explosão em volta; <1 = mais pra cima */
  spread?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    const palette = colors.map((c) => css.getPropertyValue(c).trim() || "#999");
    const cx = width / 2;
    const cy = height / 2;

    const parts = Array.from({ length: count }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 2 * spread;
      const speed = 4 + Math.random() * 7;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 2 + Math.random() * 2.5,
        h: 6 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
    });

    const start = performance.now();
    const DURATION = 1400;
    let raf = 0;
    const frame = (now: number) => {
      const t = (now - start) / DURATION;
      ctx.clearRect(0, 0, width, height);
      if (t >= 1) return;
      ctx.globalAlpha = 1 - t * t;
      for (const p of parts) {
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 + 0.18; // gravidade leve
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [colors, count, spread]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 size-full ${className}`} />;
}
