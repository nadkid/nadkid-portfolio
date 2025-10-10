import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModernTile from './ModernTile.jsx';

const HorizontalTileLayout = ({
  children,
  theme,
  isMobile = false,
  showNavigation = true
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScrollPosition = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [children]);

  const scrollToDirection = (direction) => {
    if (!scrollRef.current) return;

    const scrollAmount = isMobile ? 280 : 320; // Account for tile width + gap
    const newScrollLeft = direction === 'left'
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Mouse/touch handlers for drag scrolling
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;

    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;

    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    if (!scrollRef.current) return;

    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !scrollRef.current) return;

    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (isMobile) {
    return (
      <div className="relative">
        {/* Mobile horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto overflow-y-hidden pt-4 pb-6 px-4 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
          onScroll={checkScrollPosition}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </div>

        {/* Mobile scroll indicators */}
        <div className="flex justify-center mt-2 space-x-2">
          <div className={`w-2 h-2 rounded-full transition-colors ${canScrollLeft ? 'bg-gray-400' : 'bg-gray-200'}`} />
          <div className={`w-2 h-2 rounded-full transition-colors ${canScrollRight ? 'bg-gray-400' : 'bg-gray-200'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Desktop horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto overflow-y-hidden pt-4 pb-6 px-6"
        onScroll={checkScrollPosition}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>

      {/* Desktop navigation arrows */}
      {showNavigation && (
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollToDirection('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
              aria-label="Scroll left"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {showNavigation && (
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollToDirection('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
              aria-label="Scroll right"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default HorizontalTileLayout;
