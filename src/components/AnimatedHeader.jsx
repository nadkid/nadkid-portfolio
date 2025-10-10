import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedHeader = ({ 
  words = ["Howdy", "Hey", "おはよう", "أهلين"], 
  duration = 2500, // 2.5 seconds per word
  className = "",
  style = {}
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <div 
      className={`relative ${className}`}
      style={{
        ...style,
        minHeight: '120px', // Ensure enough height for animation
        paddingTop: '25px', // Add padding to prevent clipping
        paddingBottom: '25px'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentIndex}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] // Custom easing for smooth animation
          }}
          className="font-header leading-[0.95] font-semibold text-[var(--fg)]"
          style={{ 
            fontFeatureSettings: "'ss01' on, 'ss02' on",
            textAlign: 'center',
            fontSize: 'clamp(81px, 18vw, 150px)', // 50% bigger on mobile, responsive scaling
            lineHeight: '0.95'
          }}
        >
          {words[currentIndex]}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
};

export default AnimatedHeader;
