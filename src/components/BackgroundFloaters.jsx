// src/components/BackgroundFloaters.jsx
import React, { useEffect, useRef } from "react";

// version stamp so we know this file is running
console.log("[BF] FILE VERSION v-fix-assetsRef-1");

export default function BackgroundFloaters(props) {
  const {
    theme = "persimmon",
    basePath = "/shapes/",
    filenames,               // e.g. ["01.svg","02.svg"]
    maxParticles = 42,
  } = props;

  console.log("[BF] MOUNT", { theme, basePath, filenames });

  // --- refs / state ---
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef([]);
  const pausedRef = useRef(false);
  const assetsRef = useRef([]); // <-- THIS WAS MISSING

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const DEBUG_ON_TOP = false; // set true if you want magenta outline / max z-index

  // ---- loaders ----
  async function loadSVGAsBitmap(url) {
    try {
      if (typeof createImageBitmap !== "function") return null;
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) return null;
      const bmp = await createImageBitmap(await res.blob());
      return { kind: "bmp", data: bmp, url };
    } catch {
      return null;
    }
  }

  function loadOneImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        try { if (img.decode) await img.decode(); } catch {}
        resolve({ kind: "img", data: img, url });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function loadAsset(url) {
    return (await loadSVGAsBitmap(url)) || (await loadOneImage(url));
  }

  // ---- asset effect ----
  useEffect(() => {
    let cancelled = false;

    const names = Array.isArray(filenames) && filenames.length
      ? filenames
      : ["01.svg", "02.svg", "03.svg", "04.svg", "05.svg", "06.svg"];

    const urls = names.map((n) => `${basePath}${theme}/${n}`);
    console.log("[BF] asset URLs for", theme, urls);

    (async () => {
      const loaded = (await Promise.all(urls.map(loadAsset))).filter(Boolean);
      if (cancelled) return;
      assetsRef.current = loaded; // <-- in-scope ref
      console.log("[BF] assets loaded:", loaded.length, loaded.map(a => a.url));
      if (!loaded.length) console.warn("[BF] No assets loaded; will draw primitives.");
      spawnParticles(true);
    })();

    return () => { cancelled = true; };
  }, [theme, basePath, JSON.stringify(filenames || [])]);

  // ---- canvas setup (fixed to viewport for reliability) ----
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "5";
    if (DEBUG_ON_TOP) canvas.style.outline = "2px solid magenta";
    document.body.prepend(canvas);
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(document.body);
    window.addEventListener("resize", handleResize);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const onLeave = () => (mouseRef.current.x = mouseRef.current.y = -9999);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    const onVis = () => {
      pausedRef.current = document.visibilityState !== "visible";
      if (!pausedRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);

    spawnParticles(true);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- particles ----
  function spawnParticles(reset = false) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: W, height: H } = canvas;
    const w = W / DPR, h = H / DPR;
    const count = Math.min(maxParticles, Math.round((w * h) / (1600 * 900) * maxParticles));
    const particles = reset ? [] : particlesRef.current.slice();
    const need = count - particles.length;
    for (let i = 0; i < need; i++) particles.push(makeParticle(w, h));
    if (need < 0) particles.length = count;
    particlesRef.current = particles;
  }

  function randomAsset() {
    const a = assetsRef.current;
    if (!a || !a.length) return null;
    return a[Math.floor(Math.random() * a.length)];
  }

  function makeParticle(w, h) {
    const size = rand(20, 64);
    const angle = rand(0, Math.PI * 2);
    const baseSpeed = rand(0.05, 0.18);
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
      ax: 0, ay: 0,
      size,
      rot: rand(0, Math.PI * 2),
      rSpeed: rand(-0.0015, 0.0015),
      alpha: rand(0.25, 0.65),
      wobble: rand(0, 1000),
      asset: randomAsset(),
    };
  }

  // ---- render loop ----
  function tick() {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouse = mouseRef.current;
    const repelR = 160;
    const repelStrength = 160;
    const friction = 0.995;

    for (const p of particlesRef.current) {
      // float
      p.wobble += 0.005;
      p.ax += Math.cos(p.wobble * 0.7) * 0.0002;
      p.ay += Math.sin(p.wobble * 0.9) * 0.0002;

      // repel
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < repelR * repelR) {
        const d = Math.sqrt(d2) || 1e-4;
        const f = (repelStrength / (d * d)) * 0.8;
        p.ax += (dx / d) * f;
        p.ay += (dy / d) * f;
      }

      // integrate
      p.vx = (p.vx + p.ax) * friction;
      p.vy = (p.vy + p.ay) * friction;
      p.x += p.vx; p.y += p.vy;
      p.ax = 0; p.ay = 0;
      p.rot += p.rSpeed;

      // wrap
      if (p.x < -80) p.x = w + 80;
      if (p.x > w + 80) p.x = -80;
      if (p.y < -80) p.y = h + 80;
      if (p.y > h + 80) p.y = -80;

      // draw
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const s = p.size;

      if (p.asset) {
        try {
          if (p.asset.kind === "bmp") {
            ctx.drawImage(p.asset.data, -s / 2, -s / 2, s, s);
          } else if (p.asset.kind === "img" && p.asset.data.complete) {
            ctx.drawImage(p.asset.data, -s / 2, -s / 2, s, s);
          } else {
            throw new Error("asset not ready");
          }
        } catch (e) {
          console.warn("[BF] draw fallback for", p.asset?.url, e?.message);
        }
      }

      if (!p.asset) {
        // visible primitive only if no asset loaded at all
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        roundRect(ctx, -s / 2, -s / 2, s, s, Math.min(8, s * 0.2));
        ctx.fill();
      }

      ctx.restore();
    }

    if (!pausedRef.current) rafRef.current = requestAnimationFrame(tick);
  }

  return null; // canvas is managed imperatively
}

// ---- utils ----
function rand(a, b) { return Math.random() * (b - a) + a; }
function roundRect(ctx, x, y, w, h, r) {
  const min = Math.min(w, h) * 0.5;
  if (r > min) r = min;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}