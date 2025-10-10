import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModernTile from "./components/ModernTile.jsx";
import HorizontalTileLayout from "./components/HorizontalTileLayout.jsx";
import BackgroundFloaters from "./components/BackgroundFloaters.jsx";
import CartIcon from "./components/CartIcon.jsx";
import Checkout from "./components/Checkout.jsx";
import AnimatedHeader from "./components/AnimatedHeader.jsx";
import ImageGallery from "./components/ImageGallery.jsx";
import CommercialDisclosure from "./components/CommercialDisclosure.jsx";
import { useWordPressPostsSafe } from "./hooks/useWordPressSafe";
import { useWooCommerceProductsSafe as useShopProducts } from "./hooks/useWordPressSafe";
import { useCart } from "./hooks/useWordPressSafe";
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
    "--fg": "#FAFAFA",
    "--body": "#0f0f0f",
    "--wheel": "#FFFFFF",
    "--stroke": "#0E0E0E",
    "--accent": "#E24D00",
    "--accentSoft": "#ffc8ad",
  },
  matcha: {
    name: "Matcha",
    "--bg": "#b3d198",
    "--fg": "#FAFAFA",
    "--body": "#0f0f0f",
    "--wheel": "#FFFFFF",
    "--stroke": "#0E0E0E",
    "--accent": "#364203",
    "--accentSoft": "#cfe0c8",
  },
  glacier: {
    name: "Glacier",
    "--bg": "#F7F7F7",
    "--fg": "#333A3F",
    "--body": "#1a1a1a",
    "--wheel": "#FFFFFF",
    "--stroke": "#0E0E0E",
    "--accent": "#9aa7c1",
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

// Utility function to extract images from WordPress content
function extractImagesFromContent(content) {
  if (!content) return [];
  
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  const images = [];
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }
  
  return images;
}

// Enhanced content renderer - simplified for backward compatibility
function EnhancedContentRenderer({ content, theme, showGalleryOnly = false, showTextOnly = false }) {
  if (!content) return null;

  // Show only gallery (for backward compatibility)
  if (showGalleryOnly) {
    return null; // No longer used in new implementation
  }

  // Show only text content (for backward compatibility)
  if (showTextOnly) {
    return (
      <div
        className="text-lg md:text-xl leading-8 text-[var(--body)]/90"
        style={{ lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{
          __html: content.replace(/<\/p>/g, '</p><div class="mb-6"></div>')
        }}
      />
    );
  }

  // Default: render content with inline images
  return (
    <div
      className="text-lg md:text-xl leading-8 text-[var(--body)]/90 prose prose-gray max-w-none"
      style={{ lineHeight: '1.8' }}
      dangerouslySetInnerHTML={{
        __html: content.replace(/<\/p>/g, '</p><div class="mb-6"></div>')
      }}
    />
  );
}

// Reusable loading component
function LoadingState({ title }) {
  return (
    <div className="h-full relative">
      <SectionTitle>{title}</SectionTitle>
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[var(--body)]/70">Loading {title.toLowerCase()}...</div>
      </div>
    </div>
  );
}

// Reusable error component
function ErrorState({ title, error }) {
  return (
    <div className="h-full relative">
      <SectionTitle>{title}</SectionTitle>
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Error loading {title.toLowerCase()}: {error}</div>
      </div>
    </div>
  );
}

// Reusable empty state component
function EmptyState({ title, message = "No items found." }) {
  return (
    <div className="h-full relative">
      <SectionTitle>{title}</SectionTitle>
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[var(--body)]/70">
          {message}
          <br />
          <span className="text-sm">Configure WordPress integration to see your {title.toLowerCase()}.</span>
        </div>
      </div>
    </div>
  );
}

// Custom hook for popup management
function usePopup() {
  const [openId, setOpenId] = useState(null);
  const isPopupOpen = openId !== null;

  const openPopup = (id, setIsPopupOpen) => {
    setOpenId(id);
    if (setIsPopupOpen) setIsPopupOpen(true);
  };

  const closePopup = (setIsPopupOpen) => {
    setOpenId(null);
    if (setIsPopupOpen) setIsPopupOpen(false);
  };

  return { openId, isPopupOpen, openPopup, closePopup };
}

function PortfolioSite() {
  const [active, setActive] = useState("home");
  const [rotation, setRotation] = useState(55);
  const [theme, setTheme] = useState("persimmon");
  const [currentPage, setCurrentPage] = useState(() => {
    // Check URL for routing
    const path = window.location.pathname;
    if (path === '/checkout') return "checkout";
    return "portfolio";
  });

  const filesByTheme = {
  persimmon: ["Floater_Persimmon.svg"],   // Updated filenames to avoid caching issues
  matcha:    ["Floater_Matcha.svg"],
  glacier:   ["Floater_Glacier.svg"],
  };
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Cart functionality
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, validateCartStock } = useCart();

  // Handle checkout navigation
  const handleCheckout = () => {
    window.history.pushState({}, '', '/checkout');
    setCurrentPage("checkout");
  };

  // Handle back to portfolio
  const handleBackToPortfolio = () => {
    window.history.pushState({}, '', '/');
    setCurrentPage("portfolio");
  };

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/checkout') {
        setCurrentPage("checkout");
      } else {
        setCurrentPage("portfolio");
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    // Only set overflow hidden for portfolio page, not checkout page
    if (currentPage !== "checkout") {
      document.body.style.overflow = "hidden";
    }
    document.body.setAttribute('data-theme', theme);
  }, [theme, currentPage]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      if (e.key === "ArrowRight") setRotation((r) => r + 8);
      if (e.key === "ArrowLeft") setRotation((r) => r - 8);
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
        setRotation((r) => r + e.deltaY * 0.05);
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
    setRotation((r) => r + (dy - dx) * 0.15);
    last.current = { x: e.clientX, y: e.clientY };
  };

  const getSnap = useCallback(
    (r) => {
      const arrowCenter = 0;
      const baseAngles = [-60, -20, 20, 60, 100];
      let best = { diff: Infinity, key: active, eff: 0 };
      NAV_ITEMS.forEach((it, idx) => {
        const eff = toSigned(norm(baseAngles[idx] + r));
        const d = angDiff(eff, arrowCenter);
        if (d < best.diff) best = { diff: d, key: it.key, eff };
      });
      const inArrow = best.diff <= 8;
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

  // Render checkout page if on checkout route
  if (currentPage === "checkout") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--glacier-light)] via-[var(--glacier-medium)] to-[var(--glacier-dark)]">
        <div className="h-screen overflow-y-auto">
          <div className="container mx-auto px-4 py-8 pb-32">
            <div className="mb-6">
              <button
                onClick={handleBackToPortfolio}
                className="flex items-center text-[var(--body)]/70 hover:text-[var(--body)] transition-colors mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Portfolio
              </button>
            </div>
            <Checkout cart={cart} clearCart={clearCart} theme={theme} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <BackgroundFloaters
        theme={theme}
        basePath="./shapes/"
        filenames={filesByTheme[theme]}
      />
  
  <div
  className={`min-h-screen w-full ${isMobile ? 'flex flex-col' : 'flex'} overflow-hidden font-sans`}
  style={{ ...cssVars, position: "relative", zIndex: 10 }}
>
        {!isMobile ? (
          <>
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
              className="absolute top-1/2 -translate-y-1/2 right-10 z-50 hover:scale-110 transition-transform duration-200"
            >
              <Caret dir="left" theme={theme} />
            </button>
          )}
        </motion.div>
  
        <div className="relative flex-1" style={{ background: "rgba(246,234,226,0)" }}>
          {collapsed && (
            <button
              aria-label="Expand navigation"
              onClick={() => setCollapsed(false)}
              className="fixed left-5 top-1/2 -translate-y-1/2 z-50 hover:scale-110 transition-transform duration-200"
            >
              <Caret dir="right" theme={theme} />
            </button>
          )}
          <ColorSchemePicker theme={theme} setTheme={setTheme} />
          <CartIcon cart={cart} onClick={() => setActive("cart")} theme={theme} isExpanded={isPopupOpen} />
          <motion.div 
            className="relative h-full w-full py-12 md:py-16"
            animate={{ 
              paddingLeft: collapsed ? '6rem' : '8rem',
              paddingRight: collapsed ? '2rem' : '8rem'
            }}
            transition={{ 
              duration: 0.35, 
              ease: [0.22, 1, 0.36, 1] 
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                    <Content area={active} collapsed={collapsed} isMobile={false} theme={theme} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} setActive={setActive} onCheckout={handleCheckout} validateCartStock={validateCartStock} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
          </>
        ) : (
          <>
            {/* Mobile Content Area */}
            <div className="relative flex-1" style={{ background: "rgba(246,234,226,0)" }}>
              <motion.div 
                className="relative h-full w-full px-4 py-8"
                animate={{ 
                  paddingBottom: collapsed ? '5rem' : '2rem'
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.22, 1, 0.36, 1] 
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full"
                  >
                    <Content area={active} collapsed={false} isMobile={isMobile} setIsPopupOpen={setIsPopupOpen} theme={theme} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} setActive={setActive} onCheckout={handleCheckout} validateCartStock={validateCartStock} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              
              {/* Mobile Theme Picker */}
              <MobileThemePicker theme={theme} setTheme={setTheme} isPopupOpen={isPopupOpen} />
              {/* Mobile Cart Icon */}
              <div className={`fixed top-4 right-4 ${isPopupOpen ? 'z-40' : 'z-50'}`}>
                <CartIcon cart={cart} onClick={() => setActive("cart")} theme={theme} isExpanded={isPopupOpen} positioned={false} />
              </div>
        </div>
            
            {/* Mobile Navigation */}
            <MobileNavigation 
              active={active} 
              setActive={setActive} 
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              theme={theme}
              isPopupOpen={isPopupOpen}
            />
          </>
        )}
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
  const baseAngles = [-60, -20, 20, 60, 100];
  const wheelImageByTheme = {
    persimmon: "/png/Wheel_Persimmon.png",
    matcha: "/png/Wheel_Matcha.png",
    glacier: "/png/Wheel_Glacier.png",
  };
  const navTextColor = theme === "glacier" ? "#333A3F" : "#FAFAFA";

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
              className="absolute uppercase font-akira font-medium text-bold tracking-wide select-none text-right"
              style={{
                width: "580px",
                top: radius,
                left: radius,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "0 0",
                fontSize: idx === 1 ? 42 : 36,
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


function Caret({ dir = "right", size = 18, theme = "persimmon" }) {
  // Base rotation: right=0, left=180, up=-90, down=90
  // Additional 90 degrees clockwise for both states
  const baseRotate = { right: 0, left: 180, up: -90, down: 90 }[dir] ?? 0;
  const additionalRotation = 90; // 90 degrees clockwise
  const rotate = baseRotate + additionalRotation;
  
  const themeArrows = {
    persimmon: "/shapes/NavIcons/Navarrow_Persimmon.svg",
    matcha: "/shapes/NavIcons/Navarrow_Matcha.svg",
    glacier: "/shapes/NavIcons/Navarrow_Glacier.svg"
  };
  
  return (
    <img 
      src={themeArrows[theme] || themeArrows.persimmon} 
      alt={dir === "left" ? "Collapse" : "Expand"} 
      className="w-6 h-6"
      style={{ 
        transform: `rotate(${rotate}deg)`,
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
      }}
    />
  );
}

function MobileNavigation({ active, setActive, collapsed, setCollapsed, theme, isPopupOpen = false }) {
  const currentIndex = NAV_ITEMS.findIndex(item => item.key === active);
  
  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : NAV_ITEMS.length - 1;
    setActive(NAV_ITEMS[prevIndex].key);
  };
  
  const goToNext = () => {
    const nextIndex = currentIndex < NAV_ITEMS.length - 1 ? currentIndex + 1 : 0;
    setActive(NAV_ITEMS[nextIndex].key);
  };

  // For 5 items, calculate angles evenly spaced around the circle
  // Starting at 0° (12 o'clock position) and going clockwise
  const itemCount = NAV_ITEMS.length;
  const angleStep = 360 / itemCount; // 72° for 5 items
  
  // Calculate rotation needed to bring current item to the viewing position (45° angle)
  // The viewing position is at 45° (northeast, towards visible quadrant)
  const targetAngle = 45; // Where we want the active label to appear
  const currentItemAngle = currentIndex * angleStep; // Current item's base position
  const rotation = targetAngle - currentItemAngle; // Rotation needed

  const wheelImageByTheme = {
    persimmon: "/png/Wheel_Persimmon.png",
    matcha: "/png/Wheel_Matcha.png",
    glacier: "/png/Wheel_Glacier.png",
  };

  // Auto-collapse when popup is open
  if (isPopupOpen) {
    return null;
  }

  if (collapsed) {
    return (
      <>
        {/* Collapsed state - minimize button anchored to bottom-left corner */}
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center justify-center w-12 h-12 hover:scale-110 transition-transform duration-200"
            aria-label="Expand navigation"
          >
            <img 
              src={`/shapes/NavIcons/Navarrow_${theme.charAt(0).toUpperCase() + theme.slice(1)}.svg`}
              alt="Expand" 
              className="w-6 h-6"
              style={{ transform: 'rotate(45deg)' }}
            />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile Wheel Navigation */}
      <motion.div 
        className="fixed bottom-0 left-0 z-50"
        animate={{
          x: collapsed ? -300 : 0,
          opacity: collapsed ? 0 : 1
        }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {/* Navigation Wheel - positioned in bottom-left corner */}
        <div className="relative" style={{ width: '300px', height: '300px', overflow: 'visible' }}>
          <motion.div
            className="absolute"
            style={{ 
              width: 400, 
              height: 400,
              left: '-200px', // Half off screen
              bottom: '-200px', // Aligned to bottom
              filter: "drop-shadow(0 0 20px rgba(0,0,0,0.15)) drop-shadow(0 0 40px rgba(0,0,0,0.08))"
            }}
            animate={{ rotate: rotation }}
            transition={{ type: "tween", duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Wheel Background */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ 
                backgroundImage: `url(${wheelImageByTheme[theme]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.12))" 
              }}
            />
            
            {/* ALL Labels - positioned around the wheel at their fixed angles */}
            {NAV_ITEMS.map((item, idx) => {
              const itemAngle = idx * angleStep; // 0°, 72°, 144°, 216°, 288°
              const isActive = active === item.key;
              const radius = 120; // Distance from center to label
              
              // Calculate position on the circle
              // 0° is at 12 o'clock (top), going clockwise
              const angleRad = (itemAngle - 90) * (Math.PI / 180); // -90 to start at 12 o'clock
              const x = 200 + radius * Math.cos(angleRad); // 200 is wheel center
              const y = 200 + radius * Math.sin(angleRad);
              
              // Labels counter-rotate the wheel's rotation, then add 45° tilt
              // -rotation keeps them horizontal, +45° tilts them diagonally
              const labelRotation = -rotation - 45;
              
              return (
                <div
                  key={item.key}
                  className="absolute font-akira select-none pointer-events-none"
                  style={{
                    top: y,
                    left: x,
                    transform: `translate(-50%, -50%) rotate(${labelRotation}deg)`,
                    fontSize: isActive ? 18 : 18,
                    letterSpacing: .8,
                    color: isActive ? "var(--accent)" : "var(--fg)",
                    opacity: isActive ? 1 : 0.6,
                    userSelect: "none",
                    cursor: "default",
                    padding: "6px 12px",
                    textShadow: isActive ? "0 1px 4px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.1)",
                    whiteSpace: "nowrap",
                    fontWeight: isActive ? 600 : 500,
                    transition: "all 0.3s ease",
                  }}
                >
                  {item.label}
                </div>
              );
            })}
          </motion.div>
          
          {/* Static Navigation Arrows - positioned above/below labels at -45°, middle position */}
          <div 
            className="absolute pointer-events-auto"
            style={{
              // Middle position between edge (100px) and more inward (70px) = 85px
              bottom: '85px', // Halfway between 100px and 70px
              left: '85px',   // Halfway between 100px and 70px
              transform: 'translate(-50%, 50%) rotate(-45deg)',
            }}
          >
            <div className="flex flex-col items-center gap-16">
              {/* Up Arrow */}
              <button
                onClick={goToPrevious}
                className="flex items-center justify-center w-12 h-12 hover:scale-110 transition-transform duration-200"
                aria-label="Previous page"
              >
                <img 
                  src={`/shapes/NavIcons/Navarrow_${theme.charAt(0).toUpperCase() + theme.slice(1)}.svg`}
                  alt="Up" 
                  className="w-8 h-8"
                  style={{ transform: 'rotate(0deg)' }}
                />
              </button>
              
              {/* Down Arrow */}
              <button
                onClick={goToNext}
                className="flex items-center justify-center w-12 h-12 hover:scale-110 transition-transform duration-200"
                aria-label="Next page"
              >
                <img 
                  src={`/shapes/NavIcons/Navarrow_${theme.charAt(0).toUpperCase() + theme.slice(1)}.svg`}
                  alt="Down" 
                  className="w-8 h-8"
                  style={{ transform: 'rotate(180deg)' }}
                />
              </button>
            </div>
          </div>
          
          {/* Collapse Button - Positioned northeast from wheel center at 45° diagonal, with more padding */}
          <div 
            className="absolute pointer-events-auto"
            style={{
              // Wheel center in container coordinates is at (200, 200) in the wheel
              // But wheel is positioned at left: -200px, bottom: -200px
              // So wheel center appears at (0, 0) in the container
              // For 45° northeast position from actual wheel center:
              // Increased distance from ~170px to ~210px for more padding
              // In screen coords: left = 0 + 210*cos(45°), bottom = 0 + 210*sin(45°)
              bottom: '130px', // 210*sin(45°) = ~148px from bottom of container
              left: '130px',   // 210*cos(45°) = ~148px from left of container
              transform: 'rotate(-45deg)',
            }}
          >
            <button
              onClick={() => setCollapsed(true)}
              className="flex items-center justify-center w-12 h-12 hover:scale-110 transition-transform duration-200"
              aria-label="Collapse navigation"
            >
              <img 
                src={`/shapes/NavIcons/Navarrow_${theme.charAt(0).toUpperCase() + theme.slice(1)}.svg`}
                alt="Collapse" 
                className="w-6 h-6"
                style={{ transform: 'rotate(-90deg)' }}
              />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Content({ area, collapsed, isMobile = false, setIsPopupOpen, theme, cart, addToCart, removeFromCart, updateQuantity, clearCart, setActive, onCheckout, validateCartStock }) {
  switch (area) {
    case "home":
      return <Home collapsed={collapsed} />;
    case "portfolio":
      return <Portfolio collapsed={collapsed} isMobile={isMobile} setIsPopupOpen={setIsPopupOpen} theme={theme} />;
    case "shop":
      return <Shop collapsed={collapsed} isMobile={isMobile} setIsPopupOpen={setIsPopupOpen} theme={theme} addToCart={addToCart} validateCartStock={validateCartStock} />;
    case "cart":
      return <Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} theme={theme} setActive={setActive} onCheckout={onCheckout} validateCartStock={validateCartStock} />;
    case "blog":
      return <Blog collapsed={collapsed} isMobile={isMobile} setIsPopupOpen={setIsPopupOpen} theme={theme} />;
    case "contact":
      return <Contact theme={theme} />;
    default:
      return <Home />;
  }
}

function Cart({ cart, removeFromCart, updateQuantity, clearCart, theme, setActive, onCheckout, validateCartStock }) {
  const { items, total, itemCount } = cart;
  const { data: products } = useShopProducts();
  const [isCommercialDisclosureOpen, setIsCommercialDisclosureOpen] = useState(false);

  if (items.length === 0) {
    return (
      <div className="h-full relative">
        <SectionTitle>Shopping Cart</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-[var(--body)]/70 mb-4">
              Your cart is empty
            </div>
            <div className="text-sm text-[var(--body)]/50">
              Add some products from the Shop to get started.
            </div>
          </div>
        </div>
        
        {/* Commercial Disclosure Button - Visible even when cart is empty */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setIsCommercialDisclosureOpen(true)}
            className="text-white hover:text-white/80 underline font-medium transition-colors"
          >
            Commercial Disclosure
          </button>
        </div>
        
        {/* Commercial Disclosure Modal */}
        <CommercialDisclosure
          isOpen={isCommercialDisclosureOpen}
          onClose={() => setIsCommercialDisclosureOpen(false)}
          theme={theme}
        />
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <SectionTitle>Shopping Cart</SectionTitle>

      <div className="space-y-6">
        {/* Cart Items */}
        <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 flex items-center gap-4">
              <img
                src={item.images?.[0]?.src}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">${item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => {
                    // Find the product to check stock
                    const product = products?.find(p => p.id === item.id);
                    if (product && product.manageStock && product.stockQuantity !== null) {
                      if (item.quantity >= product.stockQuantity) {
                        alert(`Only ${product.stockQuantity} items available in stock`);
                        return;
                      }
                    }
                    updateQuantity(item.id, item.quantity + 1);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-sm text-red-500 hover:text-red-700 mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total ({itemCount} items)</span>
            <span className="text-xl font-bold">${total.toFixed(2)}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearCart}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Clear Cart
            </button>
            <button
              onClick={onCheckout}
              className="flex-1 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded-lg font-medium transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>

        {/* Commercial Disclosure Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setIsCommercialDisclosureOpen(true)}
            className="text-white hover:text-white/80 underline font-medium transition-colors"
          >
            Commercial Disclosure
          </button>
        </div>
      </div>

      {/* Commercial Disclosure Modal */}
      <CommercialDisclosure
        isOpen={isCommercialDisclosureOpen}
        onClose={() => setIsCommercialDisclosureOpen(false)}
        theme={theme}
      />
    </div>
  );
}

function Home({ collapsed = false }) {
  const { data: homepagePosts, loading, error } = useWordPressPostsSafe('homepage');

  // Determine max-width based on collapsed state
  const maxWidth = collapsed ? 'max-w-5xl' : 'max-w-3xl';

  // Default content if no WordPress content is available
  const defaultContent = (
    <div className={`${maxWidth} mt-8`} style={{ fontFeatureSettings: "'ss01' on, 'ss02' on" }}>
      <AnimatedHeader 
        words={["Howdy", "Hey", "おはよう"]}
        duration={2500}
        className="mb-6"
      />
      <p className="text-lg md:text-xl leading-8 text-[var(--body)]/90">Welcome to my little plot of virtual land. Like many of you, I was feeling a bit claustrophobic trying to fit all of my projects within the framework of a handful of apps, so I've decided to move to my own space. This site hosts both work and play: my work portfolio in brand development and graphic design, my humble webshop selling my work both physical and digital, and a journal area for those of you interested in keeping up with my travels. 

This place is a little rough around the edges, but it feels like home nonetheless. Pick a theme from the corner and navigate using the potter's wheel on the left. Happy browsing!</p>
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col">
        {/* Fixed AnimatedHeader */}
        <div className={`flex-shrink-0 ${collapsed ? 'w-full flex justify-center' : ''} mt-8`} style={{ fontFeatureSettings: "'ss01' on, 'ss02' on" }}>
          <div className={maxWidth}>
            <AnimatedHeader 
              words={["Howdy", "Hey", "おはよう"]}
              duration={2500}
              className="mb-6"
            />
          </div>
        </div>
        
        {/* Scrollable loading content */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden homepage-scroll"
          style={{ 
            maxHeight: 'calc(100vh - 300px)' // Account for fixed header and padding
          }}
        >
          <div className={`${collapsed ? 'w-full flex justify-center' : ''} pb-8`}>
            <div className={maxWidth}>
              <div className="flex items-center justify-center h-32">
                <div className="text-lg text-[var(--body)]/70">Loading homepage content...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state or no content - fall back to default
  if (error || !homepagePosts || homepagePosts.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Fixed AnimatedHeader */}
        <div className={`flex-shrink-0 ${collapsed ? 'w-full flex justify-center' : ''} mt-8`} style={{ fontFeatureSettings: "'ss01' on, 'ss02' on" }}>
          <div className={maxWidth}>
            <AnimatedHeader 
              words={["Howdy", "Hey", "おはよう"]}
              duration={2500}
              className="mb-6"
            />
          </div>
        </div>
        
        {/* Scrollable default content */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden homepage-scroll"
          style={{ 
            maxHeight: 'calc(100vh - 300px)' // Account for fixed header and padding
          }}
        >
          <div className={`${collapsed ? 'w-full flex justify-center' : ''} pb-8`}>
            <div className={maxWidth}>
              <p className="text-lg md:text-xl leading-8 text-[var(--body)]/90">Welcome to my little plot of virtual land. Like many of you, I was feeling a bit claustrophobic trying to fit all of my projects within the framework of a handful of apps, so I've decided to move to my own space. This site hosts both work and play: my work portfolio in brand development and graphic design, my humble webshop selling my work both physical and digital, and a journal area for those of you interested in keeping up with my travels. 

This place is a little rough around the edges, but it feels like home nonetheless. Pick a theme from the corner and navigate using the potter's wheel on the left. Happy browsing!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render WordPress content with fixed header and scrollable content
  return (
    <div className="h-full flex flex-col">
      {/* Fixed AnimatedHeader */}
      <div className={`flex-shrink-0 ${collapsed ? 'w-full flex justify-center' : ''} mt-8`} style={{ fontFeatureSettings: "'ss01' on, 'ss02' on" }}>
        <div className={maxWidth}>
          <AnimatedHeader 
            words={["Howdy", "Hey", "おはよう"]}
            duration={2500}
            className="mb-6"
          />
        </div>
      </div>
      
      {/* Scrollable WordPress content container */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden homepage-scroll"
        style={{ 
          maxHeight: 'calc(100vh - 300px)' // Account for fixed header and padding
        }}
      >
        <div className={`${collapsed ? 'w-full flex justify-center' : ''} pb-8`}>
          <div className={maxWidth}>
          {/* Render WordPress homepage posts */}
          <div className="space-y-6">
            {homepagePosts.map((post, index) => (
              <div key={post.id} className="prose prose-lg max-w-none">
                {/* Post title (optional, only if different from AnimatedHeader) */}
                {post.title && !post.title.toLowerCase().includes('welcome') && (
                  <h2 className="text-2xl md:text-3xl font-semibold text-[var(--body)] mb-4">
                    {post.title}
                  </h2>
                )}
                
                {/* Post content with enhanced gallery support */}
                <EnhancedContentRenderer content={post.content} theme="persimmon" />
                
                {/* Featured image if available */}
                {post.featuredImage && (
                  <div className="mt-6">
                    <img 
                      src={post.featuredImage} 
                      alt={post.title || 'Homepage image'}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Fallback content if WordPress content is minimal */}
          {homepagePosts.length === 0 && (
            <p className="text-lg md:text-xl leading-8 text-[var(--body)]/90">Welcome to my little plot of virtual land. Like many of you, I was feeling a bit claustrophobic trying to fit all of my projects within the framework of a handful of apps, so I've decided to move to my own space. This site hosts both work and play: my work portfolio in brand development and graphic design, my humble webshop selling my work both physical and digital, and a journal area for those of you interested in keeping up with my travels. 

This place is a little rough around the edges, but it feels like home nonetheless. Pick a theme from the corner and navigate using the potter's wheel on the left. Happy browsing!</p>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}


function SectionTitle({ children }) {
  return <h2 className="font-header text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[var(--fg)] mb-6 sm:mb-8 tracking-tight mt-8 px-4 sm:px-6" style={{ fontSize: window.innerWidth < 768 ? 'clamp(54px, 12vw, 132px)' : undefined }}>{children}</h2>;
}

function Grid({ children, collapsed, isMobile = false }) {
  if (isMobile) {
  return (
      <div className="grid gap-4 p-2 grid-cols-1 sm:grid-cols-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {children}
    </div>
  );
}

  return (
    <div className={`grid gap-6 p-4 ${collapsed ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2'} max-h-[calc(100vh-200px)] overflow-y-auto`}>
      {children}
    </div>
  );
}




function Portfolio({ collapsed, isMobile = false, setIsPopupOpen, theme }) {
  const { data, loading, error } = useWordPressPostsSafe('portfolio');
  const { openId, isPopupOpen, openPopup, closePopup } = usePopup();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNavigate = (direction) => {
    if (!data || data.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % data.length;
    } else {
      newIndex = currentIndex === 0 ? data.length - 1 : currentIndex - 1;
    }

    setCurrentIndex(newIndex);
    const newPost = data[newIndex];
    if (newPost) {
      openPopup(newPost.id, setIsPopupOpen);
    }
  };

  if (loading) return <LoadingState title="Portfolio" />;
  if (error) return <ErrorState title="Portfolio" error={error} />;
  if (!data || data.length === 0) return <EmptyState title="Portfolio" />;

  return (
    <ErrorBoundary fallback="Portfolio section is temporarily unavailable. Please try again later.">
      <div className="h-full relative">
        <SectionTitle>Portfolio</SectionTitle>

        <HorizontalTileLayout theme={theme} isMobile={isMobile}>
          {data.map((post, idx) => (
            <ModernTile
              key={post.id}
              layoutId={`portfolio-${post.id}`}
              title={post.title}
              subtitle={new Date(post.date).toLocaleDateString()}
              imageSrc={post.featuredImage}
              images={extractImagesFromContent(post.content || post.excerpt)}
              description={post.content || post.excerpt}
              theme={theme}
              delay={idx * 0.03}
              onClick={() => {
                setCurrentIndex(idx);
                openPopup(post.id, setIsPopupOpen);
              }}
              isMobile={isMobile}
              isPopupOpen={isPopupOpen && openId === post.id}
              currentIndex={idx}
              totalItems={data.length}
              onNavigate={handleNavigate}
            />
          ))}
        </HorizontalTileLayout>

        <AnimatePresence>
          {openId !== null && (
            <ModernTile
              key={`portfolio-expanded-${openId}`}
              title={data.find(p => p.id === openId)?.title || ''}
              subtitle={new Date(data.find(p => p.id === openId)?.date || '').toLocaleDateString()}
              imageSrc={data.find(p => p.id === openId)?.featuredImage || ''}
              images={extractImagesFromContent(data.find(p => p.id === openId)?.content || data.find(p => p.id === openId)?.excerpt || '')}
              description={data.find(p => p.id === openId)?.content || data.find(p => p.id === openId)?.excerpt || ''}
              theme={theme}
              isExpanded={true}
              onClick={() => closePopup(setIsPopupOpen)}
              isMobile={isMobile}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              totalItems={data.length}
              onNavigate={handleNavigate}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

function Shop({ collapsed, isMobile = false, setIsPopupOpen, theme, addToCart, validateCartStock }) {
  const { data, loading, error } = useShopProducts();
  const { openId, isPopupOpen, openPopup, closePopup } = usePopup();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNavigate = (direction) => {
    if (!data || data.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % data.length;
    } else {
      newIndex = currentIndex === 0 ? data.length - 1 : currentIndex - 1;
    }

    setCurrentIndex(newIndex);
    const newProduct = data[newIndex];
    if (newProduct) {
      openPopup(newProduct.id, setIsPopupOpen);
    }
  };

  if (loading) return <LoadingState title="Shop" />;
  if (error) {
    // Handle WooCommerce API errors gracefully
    const isAuthError = error.includes('401') || error.includes('cannot list resources') || error.includes('authentication required');
    const isCorsError = error.includes('CORS');
    const isConfigError = error.includes('404') || error.includes('endpoint not found');

    return (
      <div className="h-full relative">
        <SectionTitle>Shop</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="text-lg text-[var(--body)]/70 mb-4">
              {isAuthError
                ? "WooCommerce API authentication required"
                : isCorsError
                ? "CORS configuration needed"
                : isConfigError
                ? "WooCommerce API endpoint not found"
                : "Shop integration is being configured"
              }
            </div>
            <div className="text-sm text-[var(--body)]/50 mb-4">
              {isAuthError
                ? "Please configure your WooCommerce API credentials in the environment variables."
                : isCorsError
                ? "Please configure CORS headers on your WordPress site to allow cross-origin requests."
                : isConfigError
                ? "Please check your WordPress URL configuration and ensure WooCommerce is installed."
                : "WooCommerce API requires proper configuration. Check the setup guide for details."
              }
            </div>
            {isAuthError && (
              <div className="text-xs text-[var(--body)]/40 bg-white/50 p-3 rounded-lg">
                <p className="font-medium mb-1">Required Environment Variables:</p>
                <p>VITE_WC_CONSUMER_KEY=your_consumer_key</p>
                <p>VITE_WC_CONSUMER_SECRET=your_consumer_secret</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) return <EmptyState title="Shop" message="No products found. Configure WooCommerce integration to see your products." />;

  return (
    <ErrorBoundary fallback="Shop section is temporarily unavailable. Please try again later.">
      <div className="h-full relative">
        <SectionTitle>Shop</SectionTitle>

        <HorizontalTileLayout theme={theme} isMobile={isMobile}>
          {data.map((product, idx) => (
            <ModernTile
              key={product.id}
              layoutId={`shop-${product.id}`}
              title={product.name}
              subtitle={`$${product.price}`}
              imageSrc={product.images[0]?.src}
              images={product.images.map(img => img.src)}
              description={product.description}
              theme={theme}
              delay={idx * 0.03}
              onClick={() => {
                setCurrentIndex(idx);
                openPopup(product.id, setIsPopupOpen);
              }}
              isMobile={isMobile}
              isPopupOpen={isPopupOpen && openId === product.id}
              currentIndex={idx}
              totalItems={data.length}
              onNavigate={handleNavigate}
              isShopItem={true}
              addToCart={addToCart}
              product={product}
            />
          ))}
        </HorizontalTileLayout>

        <AnimatePresence>
          {openId !== null && (
            <ModernTile
              key={`shop-expanded-${openId}`}
              title={data.find(p => p.id === openId)?.name || ''}
              subtitle={`$${data.find(p => p.id === openId)?.price || ''}`}
              imageSrc={data.find(p => p.id === openId)?.images[0]?.src || ''}
              images={data.find(p => p.id === openId)?.images?.map(img => img.src) || []}
              description={data.find(p => p.id === openId)?.description || ''}
              theme={theme}
              isExpanded={true}
              onClick={() => closePopup(setIsPopupOpen)}
              isMobile={isMobile}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              totalItems={data.length}
              onNavigate={handleNavigate}
              isShopItem={true}
              addToCart={addToCart}
              product={data.find(p => p.id === openId)}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}


function Blog({ collapsed, isMobile = false, setIsPopupOpen, theme }) {
  const { data, loading, error } = useWordPressPostsSafe('journal');
  const { openId, isPopupOpen, openPopup, closePopup } = usePopup();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNavigate = (direction) => {
    if (!data || data.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % data.length;
    } else {
      newIndex = currentIndex === 0 ? data.length - 1 : currentIndex - 1;
    }

    setCurrentIndex(newIndex);
    const newPost = data[newIndex];
    if (newPost) {
      openPopup(newPost.id, setIsPopupOpen);
    }
  };

  if (loading) return <LoadingState title="Journal" />;
  if (error) return <ErrorState title="Journal" error={error} />;
  if (!data || data.length === 0) return <EmptyState title="Journal" />;

  return (
    <ErrorBoundary fallback="Journal section is temporarily unavailable. Please try again later.">
      <div className="h-full relative">
        <SectionTitle>Journal</SectionTitle>

        <HorizontalTileLayout theme={theme} isMobile={isMobile}>
          {data.map((post, idx) => (
            <ModernTile
              key={post.id}
              layoutId={`blog-${post.id}`}
              title={post.title}
              subtitle={new Date(post.date).toLocaleDateString()}
              imageSrc={post.featuredImage}
              images={extractImagesFromContent(post.content || post.excerpt)}
              description={post.content || post.excerpt}
              theme={theme}
              delay={idx * 0.03}
              onClick={() => {
                setCurrentIndex(idx);
                openPopup(post.id, setIsPopupOpen);
              }}
              isMobile={isMobile}
              isPopupOpen={isPopupOpen && openId === post.id}
              currentIndex={idx}
              totalItems={data.length}
              onNavigate={handleNavigate}
            />
          ))}
        </HorizontalTileLayout>

        <AnimatePresence>
          {openId !== null && (
            <ModernTile
              key={`blog-expanded-${openId}`}
              title={data.find(p => p.id === openId)?.title || ''}
              subtitle={new Date(data.find(p => p.id === openId)?.date || '').toLocaleDateString()}
              imageSrc={data.find(p => p.id === openId)?.featuredImage || ''}
              images={extractImagesFromContent(data.find(p => p.id === openId)?.content || data.find(p => p.id === openId)?.excerpt || '')}
              description={data.find(p => p.id === openId)?.content || data.find(p => p.id === openId)?.excerpt || ''}
              theme={theme}
              isExpanded={true}
              onClick={() => closePopup(setIsPopupOpen)}
              isMobile={isMobile}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              totalItems={data.length}
              onNavigate={handleNavigate}
              isJournalPost={true}
              postId={openId}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

function Contact({ theme }) {

  const socialLinks = [
    { name: 'LinkedIn', url: 'https://linkedin.com/in/kevin-dikdan' },
    { name: 'YouTube', url: 'https://youtube.com/@kevin-dikdan' },
    { name: 'Instagram', url: 'https://instagram.com/nadkidceramics' }
  ];

  return (
    <ErrorBoundary fallback="Contact section is temporarily unavailable. Please try again later.">
      <div className="h-full relative">
        <SectionTitle>Contact</SectionTitle>

        <div className="flex justify-start items-start h-[calc(100vh-200px)] px-4">
          <div className="w-full max-w-xl">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Get in Touch</h2>
              <div className="space-y-6">
                {/* Social Media Buttons */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 items-center">
                    {socialLinks.map((social) => (
                      <button
                        key={social.name}
                        onClick={() => window.open(social.url, '_blank')}
                        className="flex items-center justify-center px-6 py-3 rounded-full border-2 border-gray-200 bg-gray-50 font-medium text-gray-700 hover:scale-105 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 w-full max-w-xs"
                      >
                        {social.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Contact */}
                <div className="text-center">
                  <p className="text-gray-700 mb-2">Or feel free to shoot me a message here</p>
                  <a 
                    href="mailto:kdikdan@gmail.com" 
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    kdikdan@gmail.com
                  </a>
                </div>
              </div>
            </div>
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
      <div className="text-[var(--fg)]/90 text-xs mb-1 tracking-wide font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>COLOR SCHEME</div>
      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/10 backdrop-blur">
        {entries.map(([key, val]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            aria-pressed={theme === key}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border transition ${theme === key ? "ring-2 ring-[var(--accent)] bg-white/70" : ""}`}
          >
            <span className="inline-block w-4 h-4 border rounded-sm" style={{ background: val["--accentSoft"] }} />
            <span className="text-[var(--fg)] text-xs" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{val.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileThemePicker({ theme, setTheme, isPopupOpen = false }) {
  const entries = Object.entries(themes);
  
  // Hide theme picker when content is expanded
  if (isPopupOpen) {
    return null;
  }
  
  return (
    <div className="fixed right-4 bottom-4 z-50 pointer-events-auto select-none">
      <div className="flex items-center gap-2">
        {entries.map(([key, val]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            aria-pressed={theme === key}
            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
              theme === key 
                ? "ring-2 ring-white shadow-lg" 
                : "border-white/30 hover:border-white/60"
            }`}
            style={{ 
              background: val["--accentSoft"],
              borderColor: theme === key ? val["--accent"] : undefined
            }}
            aria-label={`Switch to ${val.name} theme`}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return <PortfolioSite />;
}
