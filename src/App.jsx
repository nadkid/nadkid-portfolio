import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RetroCRTTile from "./components/RetroCRTTile.jsx";
import BackgroundFloaters from "./components/BackgroundFloaters.jsx";
import { useWordPressPostsSafe as usePortfolioPosts, useWordPressPostsSafe as useJournalPosts } from "./hooks/useWordPressSafe";
import { useWooCommerceProductsSafe as useShopProducts } from "./hooks/useWordPressSafe";
import ErrorBoundary from "./components/ErrorBoundary";

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
  },
};

const NAV_ITEMS = [
  { key: "home", label: "Home" },
  { key: "portfolio", label: "Portfolio" },
  { key: "shop", label: "Shop" },
  { key: "blog", label: "Journal" },
  { key: "contact", label: "Contact" },
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
    document.body.setAttribute('data-theme', theme);
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
              className="absolute top-1/2 -translate-y-1/2 right-3 z-50 rounded-full bg-[var(--accentSoft)] backdrop-blur px-2 py-2 shadow-md hover:shadow-lg transition"
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
              className="fixed left-3 top-1/2 -translate-y-1/2 z-50 rounded-full bg-[var(--accentSoft)] backdrop-blur px-2 py-2 shadow-md hover:shadow-lg transition"
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
                <Content area={active} collapsed={collapsed} />
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
                fontSize: idx === 1 ? 36 : 31,
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

function Content({ area, collapsed }) {
  switch (area) {
    case "home":
      return <Home />;
    case "portfolio":
      return <Portfolio collapsed={collapsed} />;
    case "shop":
      return <Shop collapsed={collapsed} />;
    case "blog":
      return <Blog collapsed={collapsed} />;
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


function SectionTitle({ children }) {
  return <h2 className="font-header text-6xl md:text-7xl font-semibold text-[var(--fg)] mb-8 tracking-tight ml-4">{children}</h2>;
}

function Grid({ children, collapsed }) {
  return (
    <div className={`grid gap-6 p-4 ${collapsed ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2'} max-h-[calc(100vh-200px)] overflow-y-auto`}>
      {children}
    </div>
  );
}

function Tile({ layoutId, title, subtitle, delay, onClick, imageSrc, showBuy = true }) {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className="cursor-pointer"
    >
      <RetroCRTTile
        title={title}
        imageSrc={imageSrc}
        description={subtitle}
        primaryLabel="VIEW"
        secondaryLabel={showBuy && price ? "BUY" : ""}
        onPrimary={onClick}
        onSecondary={showBuy && price ? onClick : () => {}}
        onClose={() => {}}
        showClose={false}
      />
    </motion.div>
  );
}



function Portfolio({ collapsed }) {
  const { posts, loading, error } = usePortfolioPosts('portfolio');
  const [openId, setOpenId] = useState(null);

  if (loading) {
    return (
      <div className="h-full relative">
        <SectionTitle>Portfolio</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[var(--body)]/70">Loading portfolio...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full relative">
        <SectionTitle>Portfolio</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error loading portfolio: {error}</div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-full relative">
        <SectionTitle>Portfolio</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[var(--body)]/70">
            No portfolio items found. 
            <br />
            <span className="text-sm">Configure WordPress integration to see your portfolio.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback="Portfolio section is temporarily unavailable. Please try again later.">
      <div className="h-full relative">
        <SectionTitle>Portfolio</SectionTitle>
        <Grid collapsed={collapsed}>
          {posts.map((post, idx) => (
            <Tile 
              key={post.id} 
              layoutId={`card-${post.id}`} 
              title={post.title} 
              subtitle={post.excerpt} 
              imageSrc={post.featuredImage} 
              delay={idx * 0.03} 
              onClick={() => setOpenId(post.id)} 
              showBuy={false} 
            />
          ))}
        </Grid>
        <AnimatePresence>
          {openId !== null && (
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              {(() => {
                const post = posts.find(p => p.id === openId);
                if (!post) return null;
                
                return (
                  <RetroCRTTile
                    title={post.title}
                    imageSrc={post.featuredImage}
                    images={[post.featuredImage]} // You can add more images to WordPress posts
                    description={post.excerpt}
                    primaryLabel="VIEW PROJECT"
                    onPrimary={() => window.open(post.link, '_blank')}
                    onClose={() => setOpenId(null)}
                    expanded={true}
                    onImageClick={() => window.open(post.featuredImage, '_blank')}
                  />
                );
              })()}
            </div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

function Shop({ collapsed }) {
  const { products, loading, error } = useShopProducts();
  const [openId, setOpenId] = useState(null);

  if (loading) {
    return (
      <div className="h-full relative">
        <SectionTitle>Shop</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[var(--body)]/70">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full relative">
        <SectionTitle>Shop</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error loading products: {error}</div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-full relative">
        <SectionTitle>Shop</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[var(--body)]/70">
            No products found. 
            <br />
            <span className="text-sm">Configure WooCommerce integration to see your products.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback="Shop section is temporarily unavailable. Please try again later.">
      <div className="h-full relative">
        <SectionTitle>Shop</SectionTitle>
        <Grid collapsed={collapsed}>
          {products.map((product, idx) => (
            <Tile 
              key={product.id} 
              layoutId={`shop-${product.id}`} 
              title={product.name} 
              subtitle={`$${product.price}`} 
              imageSrc={product.images[0]?.src} 
              delay={idx * 0.03} 
              onClick={() => setOpenId(product.id)} 
            />
          ))}
        </Grid>
        <AnimatePresence>
          {openId !== null && (
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              {(() => {
                const product = products.find(p => p.id === openId);
                if (!product) return null;
                
                return (
                  <RetroCRTTile
                    title={product.name}
                    imageSrc={product.images[0]?.src}
                    images={product.images.map(img => img.src)}
                    description={product.shortDescription || product.description}
                    primaryLabel="BUY NOW"
                    onPrimary={() => window.open(product.permalink, '_blank')}
                    secondaryLabel="ADD TO CART"
                    onSecondary={() => window.open(product.permalink, '_blank')}
                    onClose={() => setOpenId(null)}
                    expanded={true}
                    onImageClick={() => window.open(product.images[0]?.src, '_blank')}
                  />
                );
              })()}
            </div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}


function Blog({ collapsed }) {
  const { posts, loading, error } = useJournalPosts('journal');
  const [openId, setOpenId] = useState(null);

  if (loading) {
    return (
      <div className="h-full relative">
        <SectionTitle>Journal</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[var(--body)]/70">Loading journal...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full relative">
        <SectionTitle>Journal</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error loading journal: {error}</div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-full relative">
        <SectionTitle>Journal</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[var(--body)]/70">
            No journal posts found. 
            <br />
            <span className="text-sm">Configure WordPress integration to see your journal.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback="Journal section is temporarily unavailable. Please try again later.">
      <div className="relative">
        <SectionTitle>Journal</SectionTitle>
        <Grid collapsed={collapsed}>
          {posts.map((post, idx) => (
            <Tile 
              key={post.id} 
              layoutId={`post-${post.id}`} 
              title={post.title} 
              subtitle={new Date(post.date).toLocaleDateString()} 
              imageSrc={post.featuredImage} 
              delay={idx * 0.03} 
              onClick={() => setOpenId(post.id)} 
              showBuy={false} 
            />
          ))}
        </Grid>
        <AnimatePresence>
          {openId !== null && (
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              {(() => {
                const post = posts.find(p => p.id === openId);
                if (!post) return null;
                
                return (
                  <RetroCRTTile
                    title={post.title}
                    imageSrc={post.featuredImage}
                    images={[post.featuredImage]}
                    description={post.excerpt}
                    primaryLabel="READ FULL POST"
                    onPrimary={() => window.open(post.link, '_blank')}
                    secondaryLabel="SHARE"
                    onSecondary={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: post.title,
                          text: post.excerpt,
                          url: post.link
                        });
                      } else {
                        navigator.clipboard.writeText(post.link);
                      }
                    }}
                    onClose={() => setOpenId(null)}
                    expanded={true}
                    onImageClick={() => window.open(post.featuredImage, '_blank')}
                  />
                );
              })()}
            </div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio Inquiry from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    const mailtoLink = `mailto:kdikdan@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const socialLinks = [
    { name: 'LinkedIn', url: 'https://linkedin.com/in/kevin-dikdan' },
    { name: 'YouTube', url: 'https://youtube.com/@kevin-dikdan' },
    { name: 'Instagram', url: 'https://instagram.com/nadkidceramics' }
  ];

  return (
    <ErrorBoundary fallback="Contact section is temporarily unavailable. Please try again later.">
      <div className="h-full relative px-8 md:px-16 lg:px-24">
        <SectionTitle>Contact</SectionTitle>
        <div className="flex justify-start items-start h-[calc(100vh-200px)] ml-4">
          <div className="w-full max-w-4xl contact-window h-full">
            <RetroCRTTile
              title="Get in Touch"
              imageSrc=""
              description="Connect with me on social media or send a message directly to my inbox."
              primaryLabel=""
              onPrimary={() => {}}
              onClose={() => {}}
              showClose={false}
              expanded={true}
              customContent={
                <div className="flex flex-col h-full space-y-8 px-6">
                  {/* Social Media Buttons */}
                  <div className="flex-shrink-0 space-y-4 pt-6">
                    <div className="flex flex-col gap-4 items-center">
                      {socialLinks.map((social) => (
                        <button
                          key={social.name}
                          onClick={() => window.open(social.url, '_blank')}
                          className="flex items-center justify-center px-4 py-3 rounded-full border-2 border-[var(--accent)] bg-[var(--accentSoft)] font-medium text-[var(--body)] hover:scale-105 hover:bg-[var(--accent)] hover:text-[var(--wheel)] transition-all duration-200 w-3/4"
                        >
                          {social.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="flex-1 space-y-4 min-h-0">
                    <h3 className="text-xl font-bold text-[var(--body)] mb-4" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, "Noto Sans JP", system-ui, -apple-system, Segoe UI, Roboto, "Apple Color Emoji", "Segoe UI Emoji", sans-serif' }}>Send a Message</h3>
                    <form onSubmit={handleSubmit} className="space-y-5 w-3/4 mx-auto">
                      <div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your Name"
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-[var(--stroke)] bg-[var(--wheel)] text-[var(--body)] placeholder-[var(--body)]/60 focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Your Email"
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-[var(--stroke)] bg-[var(--wheel)] text-[var(--body)] placeholder-[var(--body)]/60 focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Your Message"
                          required
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border-2 border-[var(--stroke)] bg-[var(--wheel)] text-[var(--body)] placeholder-[var(--body)]/60 focus:outline-none focus:border-[var(--accent)] resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 px-6 bg-[var(--accent)] text-[var(--wheel)] font-semibold rounded-lg border-2 border-[var(--stroke)] hover:bg-[var(--accentSoft)] hover:text-[var(--body)] transition-colors duration-200"
                      >
                        Send Message
                      </button>
                    </form>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
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
