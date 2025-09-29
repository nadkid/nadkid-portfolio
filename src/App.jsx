import React, { useMemo, useRef, useState, useEffect, useCallback, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundFloaters from "./components/BackgroundFloaters.jsx";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const norm = (deg) => ((deg % 360) + 360) % 360;
const toSigned = (deg) => (deg > 180 ? deg - 360 : deg);
const angDiff = (a, b) => {
  const d = Math.abs(toSigned(norm(a) - norm(b)));
  return Math.min(d, 360 - d);
};

const themes = {
  persimmon: {
    name: "Persimmon",
    "--bg": "#d3793c",
    "--fg": "#0B0B0B",
    "--body": "#0f0f0f",
    "--wheel": "#FFFFFF",
    "--stroke": "#0E0E0E",
    "--accent": "#E24D00",
    "--accentSoft": "#ffc8ad",
    "--glass": "rgba(0,0,0,0.1)",
  },
  matcha: {
    name: "Matcha",
    "--bg": "#b3d198",
    "--fg": "#0B0B0B",
    "--body": "#0f0f0f",
    "--wheel": "#FFFFFF",
    "--stroke": "#0E0E0E",
    "--accent": "#74995b",
    "--accentSoft": "#cfe0c8",
    "--glass": "rgba(0,0,0,0.1)",
  },
  glacier: {
    name: "Glacier",
    "--bg": "#F7F7F7",
    "--fg": "#0F0F0F",
    "--body": "#1a1a1a",
    "--wheel": "#FFFFFF",
    "--stroke": "#0E0E0E",
    "--accent": "#1a1a1a",
    "--accentSoft": "#eaeaea",
    "--glass": "rgba(255,255,255,0.1)",
  },
};

const NAV_ITEMS = [
  { key: "home", label: "HOME" },
  { key: "portfolio", label: "PORTFOLIO" },
  { key: "shop", label: "SHOP" },
  { key: "blog", label: "JOURNAL" },
  { key: "contact", label: "CONTACT" },
];

function PortfolioSite() {
  const [active, setActive] = useState("home");
  const [rotation, setRotation] = useState(70);
  const [theme, setTheme] = useState("matcha");
  const filesByTheme = {
  persimmon: ["01.svg"],   // add more if you have them: ["01.svg","02.svg",...]
  matcha:    ["01.svg"],
  glacier:   ["01.svg"],
};
console.log("[BF] APP filesByTheme:", filesByTheme[theme]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const vars = themes[theme];
    Object.keys(vars).forEach((k) => {
      if (k.startsWith("--")) root.style.setProperty(k, vars[k]);
    });
    root.style.setProperty(
      "--font-family",
      'Inter, "Noto Sans JP", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
    );
    document.body.style.background = vars["--bg"];
    document.body.style.color = vars["--body"];
    document.body.style.overflow = "hidden";
  }, [theme]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `.font-sans { font-family: var(--font-family), ui-sans-serif, system-ui, -apple-system, "Noto Sans JP", sans-serif; }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const wheelRef = useRef(null);
  const frame = useRef(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setRotation((r) => clamp(r + 8, -90, 90));
      if (e.key === "ArrowLeft") setRotation((r) => clamp(r - 8, -90, 90));
      if (e.key === "Enter") {
        const { inArrow, key, targetRotation } = getSnap(rotation);
        if (inArrow) {
          setActive(key);
          setRotation(targetRotation);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rotation]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!frame.current) {
        frame.current = requestAnimationFrame(() => (frame.current = 0));
        setRotation((r) => clamp(r + e.deltaY * 0.05, -90, 90));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerUp = () => {
    dragging.current = false;
    const { targetRotation, inArrow, key } = getSnap(rotation);
    if (inArrow) {
      setRotation(targetRotation);
      setActive(key);
    }
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    setRotation((r) => clamp(r + (dy - dx) * 0.15, -90, 90));
    last.current = { x: e.clientX, y: e.clientY };
  };

  const getSnap = useCallback(
    (r) => {
      const arrowCenter = 0;
      const baseAngles = [-70, -25, 10, 45, 80];
      let best = { diff: Infinity, key: active, eff: 0 };
      NAV_ITEMS.forEach((it, idx) => {
        const eff = toSigned(norm(baseAngles[idx] + r));
        const d = angDiff(eff, arrowCenter);
        if (d < best.diff) best = { diff: d, key: it.key, eff };
      });
      const inArrow = best.diff <= 15;
      const targetRotation = r - best.eff;
      return { inArrow, key: best.key, targetRotation };
    },
    [active]
  );

  useEffect(() => {
    const { inArrow, key } = getSnap(rotation);
    if (inArrow && key !== active) setActive(key);
  }, [rotation]);

  const cssVars = themes[theme];
  const leftWidth = collapsed ? "0px" : "clamp(340px, 40vw, 560px)";

  return (
    <>
      <BackgroundFloaters
        theme={theme}
        basePath="/shapes/"
        filenames={filesByTheme[theme]}
      />
  
  <div
  className="min-h-screen w-full flex overflow-hidden font-sans"
  style={{ ...cssVars, position: "relative", zIndex: 10 }}
>
        <motion.div
          className="relative overflow-hidden"
          style={{ width: leftWidth, minWidth: 0, background: "rgba(246,234,226,0)" }}
          animate={{ width: leftWidth }}
          transition={{ type: "tween", duration: 0.35 }}
        >
          <div
            ref={wheelRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onPointerMove={onPointerMove}
            className="absolute inset-0"
            aria-label="Section navigation wheel"
            role="tablist"
          >
            <RadialDial rotation={rotation} active={active} theme={theme} />
          </div>
          {!collapsed && (
            <button
              aria-label="Collapse navigation"
              onClick={() => setCollapsed(true)}
              className="absolute top-1/2 -translate-y-1/2 right-3 z-50 rounded-full bg-[var(--glass)] backdrop-blur px-2 py-2 shadow-md hover:shadow-lg transition"
            >
              <Caret dir="left" />
            </button>
          )}
        </motion.div>
  
        <div className="relative flex-1" style={{ background: "rgba(246,234,226,0)" }}>
          {collapsed && (
            <button
              aria-label="Expand navigation"
              onClick={() => setCollapsed(false)}
              className="fixed left-3 top-1/2 -translate-y-1/2 z-50 rounded-full bg-[var(--glass)] backdrop-blur px-2 py-2 shadow-md hover:shadow-lg transition"
            >
              <Caret dir="right" />
            </button>
          )}
          <ColorSchemePicker theme={theme} setTheme={setTheme} />
          <div className="relative h-full w-full px-8 md:px-16 lg:px-24 py-12 md:py-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <Content area={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

function RadialDial({ rotation = 0, active, theme }) {
  const size = 1200;
  const radius = size / 2;
  const leftShift = -size * 0.62;
  const arrowCenter = 0;
  const labelInset = 220;
  const baseAngles = [-70, -25, 10, 45, 80];
  const wheelImageByTheme = {
    persimmon: "/png/Wheel_Persimmon.png",
    matcha: "/png/Wheel_Matcha.png",
    glacier: "/png/Wheel_Glacier.png",
  };
  const navTextColor = theme === "glacier" ? "#f7f7f7" : "#1a1a1a";

  return (
    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: leftShift }}>
      <motion.div
        className="relative rounded-full"
        style={{ 
          width: size, 
          height: size,
          filter: "drop-shadow(0 0 20px rgba(0,0,0,0.15)) drop-shadow(0 0 40px rgba(0,0,0,0.08))"
        }}
        animate={{ rotate: rotation }}
        transition={{ type: "tween", duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute inset-0 rounded-full backdrop-blur"
          style={{ 
            backgroundImage: `url(${wheelImageByTheme[theme]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.12))" 
          }}
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,0.06), transparent)" }}
        />
        <ArrowMarker rotation={rotation} radius={radius} />
        {NAV_ITEMS.map((item, idx) => {
          const angle = baseAngles[idx];
          const eff = toSigned(norm(angle + rotation));
          const inArrow = angDiff(eff, arrowCenter) <= 14;
          const isActive = active === item.key;
          // Nav label typography and color rules
          const color = isActive ? "var(--accent)" : navTextColor;
          return (
            <div
              key={item.key}
              role="tab"
              aria-selected={isActive}
              className="absolute font-header font-medium tracking-wide select-none"
              style={{
                top: radius,
                left: radius,
                transform: `rotate(${angle}deg) translate(${radius - labelInset}px) rotate(${-angle - rotation}deg)`,
                transformOrigin: "0 0",
                fontSize: idx === 1 ? 28 : 24,
                letterSpacing: 1.4,
                color,
                userSelect: "none",
                cursor: "default",
                padding: "6px 12px",
              }}
            >
              {item.label}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

function ArrowMarker({ rotation, radius }) {
  const size = 18;
  return (
    <div
      className="absolute"
      aria-hidden
      style={{
        top: radius,
        left: radius,
        zIndex: 3,
        transform: `rotate(${-rotation}deg) translate(${radius - 14}px, -50%)`,
        transformOrigin: "0 0",
        pointerEvents: "none",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M18 12 L8 7 L8 17 Z" fill="var(--accent)" />
      </svg>
    </div>
  );
}

function Caret({ dir = "right", size = 18 }) {
  const rotate = { right: 0, left: 180 }[dir] ?? 0;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M9 6 L17 12 L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Content({ area }) {
  switch (area) {
    case "home":
      return <Home />;
    case "portfolio":
      return <Portfolio />;
    case "shop":
      return <Shop />;
    case "blog":
      return <Blog />;
    case "contact":
      return <Contact />;
    default:
      return <Home />;
  }
}

function Home() {
  return (
    <div className="max-w-3xl" style={{ fontFeatureSettings: "'ss01' on, 'ss02' on" }}>
      <h1 className="font-header text-[clamp(36px,8vw,88px)] leading-[0.95] font-semibold text-[var(--fg)] mb-6">HI, I’M KEVIN.</h1>
      <p className="text-lg md:text-xl leading-8 text-[var(--body)]/90">lorum ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos yada yada yada</p>
    </div>
  );
}

function WindowChrome({ title, onClose, onToggleMin, onToggleMax, maximized, minimized }) {
  return (
    <div className="relative flex items-center gap-2 px-3 py-2 border-b bg-[var(--glass)] backdrop-blur">
      <div className="flex items-center gap-2 absolute left-3">
        <button aria-label="Close" onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-[#ff5f57]" />
        <button aria-label="Minimize" onClick={onToggleMin} className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
        <button aria-label="Maximize" onClick={onToggleMax} className="w-3.5 h-3.5 rounded-full bg-[#28c840]" />
      </div>
      <div className="w-full text-center text-sm font-medium text-[var(--body)]">{title}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="font-header text-4xl md:text-5xl font-semibold text-[var(--fg)] mb-8 tracking-tight">{children}</h2>;
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>;
}

function Tile({ layoutId, title, subtitle, price, delay, onClick }) {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl shadow border border-black/5 backdrop-blur overflow-hidden cursor-pointer hover:shadow-lg transition"
      style={{ background: "var(--accentSoft)" }}
    >
      <div className="aspect-video bg-black/5" />
      <div className="p-4 flex items-baseline justify-between gap-2">
        <h3 className="font-medium text-[var(--body)]">{title}</h3>
        {price ? <div className="text-[var(--body)]/80 text-sm">{price}</div> : <p className="text-sm text-[var(--body)]/70">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

function Window({ layoutId, title, onClose, onToggleMax, maximized, children }) {
  const [minimized, setMinimized] = useState(false);
  const containerBase = maximized
    ? "absolute inset-0 bg-white rounded-none shadow-2xl border"
    : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border w-[min(92vw,980px)] max-w-[95vw] min-w-[320px] h-[min(82vh,760px)] overflow-hidden";
  return (
    <>
      {!maximized && !minimized && (
        <motion.div className="fixed inset-0 bg-black/30 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      )}
      <motion.div
        layoutId={layoutId}
        drag={!maximized && !minimized}
        dragMomentum={false}
        className={`${containerBase} z-50`}
      >
        <WindowChrome title={title} onClose={onClose} onToggleMin={() => setMinimized((m) => !m)} onToggleMax={onToggleMax} maximized={maximized} minimized={minimized} />
        {!minimized && <div className="p-6 h-[calc(100%-40px)] overflow-auto">{children}</div>}
      </motion.div>
    </>
  );
}

function GalleryButton({ side, onClick }) {
  return (
    <button onClick={onClick} className={`absolute ${side === "left" ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 rounded-full bg-[var(--glass)] backdrop-blur px-2 py-2 shadow hover:shadow-lg`} aria-label={side === "left" ? "Previous" : "Next"}>
      <Caret dir={side === "left" ? "left" : "right"} />
    </button>
  );
}

function Portfolio() {
  const items = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({ id: i, title: `Project ${i + 1}`, blurb: "A short description of the project goes here." })), []);
  const [openId, setOpenId] = useState(null);
  const [maximized, setMaximized] = useState(false);
  return (
    <div className="h-full relative">
      <SectionTitle>Portfolio</SectionTitle>
      <Grid>
        {items.map((it, idx) => (
          <Tile key={it.id} layoutId={`card-${it.id}`} title={it.title} subtitle={it.blurb} delay={idx * 0.03} onClick={() => { setOpenId(it.id); setMaximized(false); }} />
        ))}
      </Grid>
      <AnimatePresence>
        {openId !== null && (
          <Window layoutId={`card-${openId}`} title={`Project ${openId + 1}`} onClose={() => setOpenId(null)} onToggleMax={() => setMaximized((m) => !m)} maximized={maximized}>
            <div className="aspect-video bg-black/10 rounded-xl mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-[var(--body)]">Title of the project</h3>
            <p className="text-[var(--body)]/80">Replace this with real content. This draggable window has rounded edges and can be closed (red) or expanded (green).</p>
          </Window>
        )}
      </AnimatePresence>
    </div>
  );
}

function Shop() {
  const items = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ id: i, title: `Item ${i + 1}`, price: (i + 1) * 1200, images: [`https://picsum.photos/seed/shop${i}-a/800/500`, `https://picsum.photos/seed/shop${i}-b/800/500`, `https://picsum.photos/seed/shop${i}-c/800/500`], desc: "Short description: materials, size, and special details." })), []);
  const [openId, setOpenId] = useState(null);
  const [maximized, setMaximized] = useState(false);
  return (
    <div className="h-full relative">
      <SectionTitle>Shop</SectionTitle>
      <Grid>
        {items.map((it, idx) => (
          <Tile key={it.id} layoutId={`shop-${it.id}`} title={it.title} price={`¥${it.price.toLocaleString()}`} delay={idx * 0.03} onClick={() => { setOpenId(it.id); setMaximized(false); }} />
        ))}
      </Grid>
      <AnimatePresence>
        {openId !== null && (
          <ShopWindow item={items[openId]} layoutId={`shop-${openId}`} onClose={() => setOpenId(null)} onToggleMax={() => setMaximized((m) => !m)} maximized={maximized} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ShopWindow({ item, onClose, layoutId, onToggleMax, maximized }) {
  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => (i + 1) % item.images.length);
  const prev = () => setIndex((i) => (i - 1 + item.images.length) % item.images.length);
  return (
    <Window layoutId={layoutId} title={`${item.title} · ¥${item.price.toLocaleString()}`} onClose={onClose} onToggleMax={onToggleMax} maximized={maximized}>
      <div className="grid grid-rows-[auto_1fr] md:grid-cols-[1fr_280px] gap-0">
        <div className="relative p-4">
          <div className="relative aspect-video bg-black/10 rounded-xl overflow-hidden">
            <img src={item.images[index]} alt={item.title} className="w-full h-full object-cover" />
            <GalleryButton side="left" onClick={prev} />
            <GalleryButton side="right" onClick={next} />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {item.images.map((src, i) => (
              <button key={i} onClick={() => setIndex(i)} className={`h-16 w-24 rounded-lg overflow-hidden border ${i === index ? "ring-2 ring-black" : ""}`}>
                <img src={src} aqlt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 md:border-l">
          <h3 className="text-lg font-semibold text-[var(--body)] mb-2">{item.title}</h3>
          <div className="text-[var(--body)]/70 mb-4">¥{item.price.toLocaleString()}</div>
          <p className="text-[var(--body)]/80 mb-4">{item.desc}</p>
          <button className="px-4 py-2 rounded-xl border bg-[var(--wheel)] hover:shadow">Add to Cart (stub)</button>
        </div>
      </div>
    </Window>
  );
}

function Blog() {
  const posts = useMemo(() => [
    { id: 0, title: "Kiln Firing Notes: Summer Session", date: "2025-07-02", body: "Long-form notes from a multi-day firing. Heat, cones, and community.", cover: "https://picsum.photos/seed/kiln/800/500" },
    { id: 1, title: "Designing a Wheel Nav", date: "2025-06-11", body: "R&D on arc-based navigation with smooth snapping.", cover: "https://picsum.photos/seed/wheel/800/500" },
    { id: 2, title: "Mashiko Fieldnotes", date: "2025-05-28", body: "Observations from studio visits and markets.", cover: "https://picsum.photos/seed/mashiko/800/500" },
  ], []);
  const [openId, setOpenId] = useState(null);
  const [maximized, setMaximized] = useState(false);
  return (
    <div className="relative">
      <SectionTitle>Journal</SectionTitle>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p, idx) => (
          <motion.li
            key={p.id}
            layoutId={`post-${p.id}`}
            onClick={() => { setOpenId(p.id); setMaximized(false); }}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.03 }}
            className="rounded-2xl backdrop-blur border border-black/5 overflow-hidden cursor-pointer shadow hover:shadow-lg transition"
            style={{ background: "var(--accentSoft)" }}
          >
            <div className="aspect-video overflow-hidden">
              <img src={p.cover} alt="cover" className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="text-sm text-[var(--body)]/60">{p.date}</div>
              <div className="text-lg font-medium text-[var(--body)]">{p.title}</div>
            </div>
          </motion.li>
        ))}
      </ul>
      <AnimatePresence>
        {openId !== null && (
          <Window layoutId={`post-${openId}`} title={posts.find((p) => p.id === openId)?.title ?? ""} onClose={() => setOpenId(null)} onToggleMax={() => setMaximized((m) => !m)} maximized={maximized}>
            <div className="aspect-video bg-black/10 rounded-xl mb-4 overflow-hidden">
              <img src={posts.find((p) => p.id === openId)?.cover} alt="cover" className="w-full h-full object-cover" />
            </div>
            <div className="text-sm text-[var(--body)]/60 mb-2">{posts.find((p) => p.id === openId)?.date}</div>
            <p className="text-[var(--body)]/80">{posts.find((p) => p.id === openId)?.body}</p>
          </Window>
        )}
      </AnimatePresence>
    </div>
  );
}

function Contact() {
  return (
    <div className="max-w-2xl">
      <SectionTitle>Contact</SectionTitle>
      <p className="text-lg text-[var(--body)]/90 mb-6">For collaborations, inquiries, or commissions, drop a note:</p>
      <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-4 max-w-xl">
        <input className="border rounded-xl px-4 py-3 bg-white/95" placeholder="Your name" />
        <input type="email" className="border rounded-xl px-4 py-3 bg-white/95" placeholder="Email" />
        <textarea rows={5} className="border rounded-xl px-4 py-3 bg-white/95" placeholder="Message" />
        <button className="justify-self-start px-5 py-2.5 rounded-xl border bg-[var(--wheel)] hover:shadow" type="submit">Send</button>
      </form>
    </div>
  );
}

function ColorSchemePicker({ theme, setTheme }) {
  const entries = Object.entries(themes);
  return (
    <div className="fixed right-4 bottom-4 z-50 pointer-events-auto select-none">
      <div className="text-[var(--fg)]/90 text-sm mb-2 tracking-wide">COLOR SCHEME</div>
      <div className="flex items-center gap-3 p-2 rounded-xl bg-black/10 backdrop-blur">
        {entries.map(([key, val]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            aria-pressed={theme === key}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border transition ${theme === key ? "ring-2 ring-[var(--accent)] bg-white/70" : ""}`}
          >
            <span className="inline-block w-5 h-5 border rounded-sm" style={{ background: val["--accentSoft"] }} />
            <span className="text-[var(--fg)] text-sm">{val.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return <PortfolioSite />;
}
