import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FullscreenGallery = ({
  images = [],
  isOpen = false,
  onClose = () => {},
  initialIndex = 0,
  title = "Gallery"
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Reset current index and zoom state when opening with new initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setImageError(false);
      setIsZoomed(false);
      setZoomLevel(1);
      setZoomPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
          setImageError(false);
          resetZoom(); // Reset zoom when changing images
          break;
        case 'ArrowRight':
          setCurrentIndex(prev => (prev + 1) % images.length);
          setImageError(false);
          resetZoom(); // Reset zoom when changing images
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
        case 'Escape':
          if (isZoomed) {
            resetZoom();
          } else {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose, isZoomed, zoomLevel]);

  if (!isOpen || !images || images.length === 0) return null;

  const hasMultipleImages = images.length > 1;
  const displayImage = images[currentIndex];

  const goToImage = (index) => {
    setCurrentIndex(index);
    setImageError(false);
    resetZoom(); // Reset zoom when changing images
  };

  const nextImage = () => {
    const newIndex = (currentIndex + 1) % images.length;
    goToImage(newIndex);
  };

  const prevImage = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    goToImage(newIndex);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5)); // Max zoom 5x
    setIsZoomed(true);
  };

  const zoomOut = () => {
    const newZoom = zoomLevel / 1.5;
    if (newZoom <= 1) {
      setZoomLevel(1);
      setIsZoomed(false);
      setZoomPosition({ x: 0, y: 0 });
    } else {
      setZoomLevel(newZoom);
    }
  };

  const toggleZoom = () => {
    if (isZoomed) {
      zoomOut();
    } else {
      zoomIn();
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setZoomPosition({ x: 0, y: 0 });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header with title and close button */}
          <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm flex-shrink-0">
            <h2 className="text-white text-lg font-medium truncate">{title}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-2"
              aria-label="Close gallery"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main image container */}
          <div
            className="flex-1 flex items-center justify-center p-4 relative min-h-0 max-h-[calc(100vh-200px)]"
            onClick={(e) => {
              // Only close if clicking on the container itself, not on the image
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            {/* Navigation arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3 hover:bg-white/20 transition-all duration-200 z-10"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3 hover:bg-white/20 transition-all duration-200 z-10"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Main image */}
            <motion.div
              key={`${currentIndex}-${isZoomed}-${zoomLevel}`}
              className={`w-full h-full flex items-center justify-center ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleZoom();
              }}
            >
              <motion.img
                src={displayImage}
                alt={`${title} ${currentIndex + 1}`}
                className={`max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in hover:scale-105'}`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${zoomPosition.x}px, ${zoomPosition.y}px)`,
                  transformOrigin: 'center center'
                }}
                onError={() => setImageError(true)}
                drag={isZoomed}
                dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
                onDragEnd={(e, { offset }) => {
                  if (isZoomed) {
                    setZoomPosition({
                      x: zoomPosition.x + offset.x,
                      y: zoomPosition.y + offset.y
                    });
                  }
                }}
              />

              {imageError && (
                <div className="flex items-center justify-center bg-gray-800 rounded-lg w-full h-full max-w-md max-h-96 mx-auto">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </motion.div>

            {/* Image counter and zoom controls */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              {hasMultipleImages && (
                <div className="bg-black/50 text-white px-3 py-1 rounded text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              )}

              {/* Zoom controls */}
              {isZoomed && (
                <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      zoomOut();
                    }}
                    className="hover:text-blue-300 transition-colors"
                    aria-label="Zoom out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>

                  <span className="min-w-[3rem] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      zoomIn();
                    }}
                    className="hover:text-blue-300 transition-colors"
                    aria-label="Zoom in"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail strip at bottom */}
          {hasMultipleImages && (
            <div className="flex-shrink-0 p-4 bg-black/50 backdrop-blur-sm max-h-24 overflow-hidden">
              <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent justify-center h-full">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToImage(index);
                    }}
                    className={`flex-shrink-0 rounded overflow-hidden transition-all duration-200 w-16 h-16 ${
                      index === currentIndex
                        ? 'ring-2 ring-white scale-105'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullscreenGallery;
