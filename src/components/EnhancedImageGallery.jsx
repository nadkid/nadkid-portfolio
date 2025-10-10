import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FullscreenGallery from './FullscreenGallery.jsx';

export default function EnhancedImageGallery({ 
  images = [], 
  currentIndex = 0, 
  setCurrentIndex = () => {},
  title = "Gallery",
  className = "",
  showThumbnails = true,
  showCounter = true,
  showArrows = true,
  isMobile = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!images || images.length === 0) return null;

  const hasMultipleImages = images.length > 1;
  const displayImage = images[currentIndex];

  const goToImage = (index) => {
    setCurrentIndex(index);
    setImageError(false);
  };

  const nextImage = () => {
    const newIndex = (currentIndex + 1) % images.length;
    goToImage(newIndex);
  };

  const prevImage = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    goToImage(newIndex);
  };

  // Single image display
  if (images.length === 1) {
    return (
      <div className={`flex justify-center mb-8 ${className}`}>
        <div className="relative group max-w-2xl w-full">
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <img
              src={images[0]}
              alt={title}
              className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              onClick={() => setIsExpanded(true)}
              onError={() => setImageError(true)}
            />
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Gallery for Single Image */}
        <FullscreenGallery
          images={images}
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          initialIndex={0}
          title={title}
        />
      </div>
    );
  }

  // Multiple images display
  return (
    <>
      <div className={`flex justify-center mb-8 ${className}`}>
        <div className="relative group max-w-2xl w-full">
          {/* Main Image Container */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <motion.img
              key={currentIndex}
              src={displayImage}
              alt={`${title} ${currentIndex + 1}`}
              className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsExpanded(true)}
              onError={() => setImageError(true)}
            />
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Navigation Arrows */}
            {showArrows && hasMultipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full z-10 hover:bg-opacity-75 transition-opacity ${
                    isMobile ? 'p-3' : 'p-2'
                  }`}
                  aria-label="Previous image"
                >
                  <svg className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full z-10 hover:bg-opacity-75 transition-opacity ${
                    isMobile ? 'p-3' : 'p-2'
                  }`}
                  aria-label="Next image"
                >
                  <svg className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image Counter */}
            {showCounter && hasMultipleImages && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
          
          {/* Thumbnail Strip */}
          {showThumbnails && hasMultipleImages && (
            <div className={`flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
              isMobile ? 'px-1' : ''
            }`}>
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToImage(index);
                  }}
                  className={`flex-shrink-0 rounded overflow-hidden transition-all duration-200 ${
                    isMobile ? 'w-14 h-14' : 'w-16 h-16'
                  } ${
                    index === currentIndex 
                      ? 'ring-2 ring-blue-500 scale-105' 
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
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
          )}
        </div>
      </div>

      {/* Fullscreen Gallery for Multiple Images */}
      <FullscreenGallery
        images={images}
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        initialIndex={currentIndex}
        title={title}
      />
    </>
  );
}
