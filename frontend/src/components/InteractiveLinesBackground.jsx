import { useEffect, useRef } from "react";
import "./InteractiveLinesBackground.css";

/**
 * Cerver's pointer-reactive contour/line background.
 * Inspired by the Animorio demo supplied by the project owner.
 * Keep this component mounted once, near the root of the app.
 */
export default function InteractiveLinesBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const config = {
      gap: 11,
      pointStep: 9,
      radius: 25,
      push: 15,
      wave: 1.35,
      accent: [111, 140, 255],
      night: [17, 23, 37],
      line: [220, 231, 255],
    };

    let width = 1;
    let height = 1;
    let dpr = 1;
    let rows = 0;
    let cols = 0;
    let offsets = new Float32Array(0);
    let velocities = new Float32Array(0);
    let last = 0;
    let clock = 0;
    let raf = 0;
    let pointer = { x: -1000, y: -1000, active: false };
    let magnet = { x: -1000, y: -1000, vx: 0, vy: 0, active: 0 };
    const rings = [];

    const rgba = (rgb, alpha) =>
      `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(1.25, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      const scale = Math.max(0.65, Math.min(1.15, Math.min(width, height * 1.2) / 820));
      config.gap = Math.max(7, 11 * (0.75 + scale * 0.25));
      config.radius = 18 * scale;
      config.push = 8 * (0.7 + scale * 0.3);
      config.pointStep = width < 500 ? 7 : 9;
      rows = Math.ceil(height / config.gap) + 2;
      cols = Math.ceil(width / config.pointStep) + 2;
      offsets = new Float32Array(rows * cols);
      velocities = new Float32Array(rows * cols);
    }

    function pointerMove(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }

    function pointerLeave() {
      pointer.active = false;
    }

    function pointerDown(event) {
      if (reduceMotion) return;
      rings.push({ x: event.clientX, y: event.clientY, age: 0 });
      if (rings.length > 3) rings.shift();
    }

    function draw(now) {
      // Cap expensive canvas rendering at 30 FPS.
      if (last && now - last < 1000 / 30) {
        raf = window.requestAnimationFrame(draw);
        return;
      }
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
      last = now;
      clock += dt;

      const targetX = pointer.active ? pointer.x : width * 0.5;
      const targetY = pointer.active ? pointer.y : height * 0.5;
      magnet.vx += ((targetX - magnet.x) * 90 - magnet.vx * 15) * dt;
      magnet.vy += ((targetY - magnet.y) * 90 - magnet.vy * 15) * dt;
      magnet.x += magnet.vx * dt;
      magnet.y += magnet.vy * dt;
      magnet.active += ((pointer.active ? 1 : 0) - magnet.active) * Math.min(1, dt * 5);

      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].age += dt;
        if (rings[i].age > 1.8) rings.splice(i, 1);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${config.night.join(",")})`;
      ctx.fillRect(0, 0, width, height);

      if (magnet.active > 0.01 && !reduceMotion) {
        const glowRadius = config.radius * 1.2;
        const glow = ctx.createRadialGradient(
          magnet.x, magnet.y, 0, magnet.x, magnet.y, glowRadius
        );
        glow.addColorStop(0, rgba(config.accent, 0.16 * magnet.active));
        glow.addColorStop(1, rgba(config.accent, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(
          magnet.x - glowRadius, magnet.y - glowRadius,
          glowRadius * 2, glowRadius * 2
        );
      }

      const R = config.radius;
      const R2 = R * R;
      const soft = R * 0.22;
      // Collect accent segments and draw them in batches (far fewer canvas calls).
      const buckets = Array.from({ length: 6 }, () => []);
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      for (let r = 0; r < rows; r++) {
        const y0 = (r - 0.5) * config.gap;
        const dy = y0 - magnet.y;
        const side = Math.tanh(dy / soft);
        const dy2 = dy * dy;
        const sway = 0.6 + 0.4 * Math.sin(clock * 0.31 + r * 0.11);
        const rowPoints = [];
        let previousLight = 0;

        for (let c = 0; c < cols; c++) {
          const x = (c - 1) * config.pointStep;
          const index = r * cols + c;
          const base = reduceMotion ? 0 : config.wave * sway *
            Math.sin(x * 0.0065 + clock * 0.7 + r * 0.33);

          let target = base;
          let light = 0;
          if (magnet.active > 0.001 && !reduceMotion) {
            const dx = x - magnet.x;
            const force = Math.exp(-(dx * dx + dy2) / R2) * magnet.active;
            target += side * config.push * force;
            light = force;
          }

          if (reduceMotion) {
            offsets[index] = 0;
          } else {
            let impulse = 0;
            // Only evaluate click rings while one is active.
            if (rings.length) {
              for (let q = 0; q < rings.length; q++) {
                const ring = rings[q];
                const dx = x - ring.x;
                const ry = y0 - ring.y;
                const distance = Math.hypot(dx, ry) || 1;
                const band = (distance - ring.age * Math.max(width, height) * 0.75) / 26;
                if (band > -2.5 && band < 2.5) {
                  impulse += (ry / distance) * Math.exp(-band * band) *
                    Math.max(0, 1 - ring.age / 1.8) * 20;
                }
              }
            }
            velocities[index] += ((target - offsets[index]) * 150 -
              velocities[index] * 7 + impulse) * dt;
            offsets[index] += velocities[index] * dt;
          }

          const y = y0 + offsets[index];
          const bend = Math.min(
            1,
            Math.abs(offsets[index] - base) / (config.push * 0.6) + light * 0.18
          );

          rowPoints.push({ x, y, bend, previousLight });
          previousLight = bend;
        }

        // Base line is drawn once per row.
        ctx.beginPath();
        rowPoints.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        const edgeStrength = Math.min(1, Math.abs(y0 / height - 0.5) * 2);
        ctx.strokeStyle = rgba(config.line, 0.035 + edgeStrength * 0.055);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Batch bright segments by intensity; no per-segment stroke calls.
        for (let i = 1; i < rowPoints.length; i++) {
          const p = rowPoints[i];
          const avg = (p.bend + rowPoints[i - 1].bend) / 2;
          if (avg > 0.055) {
            const bucket = Math.min(5, Math.floor(avg * 6));
            buckets[bucket].push(
              rowPoints[i - 1].x, rowPoints[i - 1].y, p.x, p.y
            );
          }
        }
      }

      for (let b = 0; b < buckets.length; b++) {
        const segments = buckets[b];
        if (!segments.length) continue;
        ctx.beginPath();
        for (let i = 0; i < segments.length; i += 4) {
          ctx.moveTo(segments[i], segments[i + 1]);
          ctx.lineTo(segments[i + 2], segments[i + 3]);
        }
        const intensity = (b + 0.5) / buckets.length;
        ctx.strokeStyle = rgba(config.accent, Math.min(0.9, 0.2 + intensity * 0.8));
        ctx.lineWidth = 1 + intensity * 0.45;
        ctx.stroke();
      }

      const wash = ctx.createLinearGradient(0, height * 0.55, width, height);
      wash.addColorStop(0, "rgba(40, 75, 145, 0.025)");
      wash.addColorStop(0.55, "rgba(85, 105, 180, 0.055)");
      wash.addColorStop(1, "rgba(18, 26, 46, 0.02)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      raf = window.requestAnimationFrame(draw);
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("pointerdown", pointerDown, { passive: true });
    window.addEventListener("blur", pointerLeave);
    document.addEventListener("mouseleave", pointerLeave);
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("blur", pointerLeave);
      document.removeEventListener("mouseleave", pointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="cerver-interactive-lines" aria-hidden="true" />;
}
