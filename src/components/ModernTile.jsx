import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ImageGallery from './ImageGallery.jsx';
import EnhancedImageGallery from './EnhancedImageGallery.jsx';
import CommentSection from './CommentSection.jsx';
import FullscreenGallery from './FullscreenGallery.jsx';
import InlineWordPressContent from './InlineWordPressContent.jsx';

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

// Enhanced content renderer with gallery support
function EnhancedContentRenderer({ content, theme, showGalleryOnly = false, showTextOnly = false, isMobile = false }) {
  if (!content) return null;
  
  const images = extractImagesFromContent(content);
  const contentWithoutImages = content.replace(/<img[^>]*>/gi, '');
  
  // Mobile-specific line spacing
  const lineHeight = isMobile ? '1.6' : '1.8';
  
  // Show only gallery (for positioning above text)
  if (showGalleryOnly) {
    if (images.length > 1) {
      return (
        <EnhancedImageGallery
          images={images}
          currentIndex={0}
          setCurrentIndex={() => {}}
          title=""
          showThumbnails={true}
          showCounter={true}
          showArrows={true}
          isMobile={isMobile}
        />
      );
    }
    return null;
  }
  
  // Show only text content (for positioning below gallery)
  if (showTextOnly) {
    return (
      <div 
        className="text-gray-700 leading-relaxed prose prose-gray max-w-none"
        style={{ lineHeight }}
        dangerouslySetInnerHTML={{ 
          __html: contentWithoutImages.replace(/<\/p>/g, '</p><div class="mb-6"></div>')
        }}
      />
    );
  }
  
  // Default behavior - render everything together (for backward compatibility)
  if (images.length > 1) {
    return (
      <div>
        <div 
          className="text-gray-700 leading-relaxed prose prose-gray max-w-none"
          style={{ lineHeight }}
          dangerouslySetInnerHTML={{ 
            __html: contentWithoutImages.replace(/<\/p>/g, '</p><div class="mb-6"></div>')
          }}
        />
        <EnhancedImageGallery
          images={images}
          currentIndex={0}
          setCurrentIndex={() => {}}
          title=""
          showThumbnails={true}
          showCounter={true}
          showArrows={true}
          isMobile={isMobile}
        />
      </div>
    );
  }
  
  // Single image or no images - render normally
  return (
    <div 
      className="text-gray-700 leading-relaxed prose prose-gray max-w-none"
      style={{ lineHeight }}
      dangerouslySetInnerHTML={{ 
        __html: content.replace(/<\/p>/g, '</p><div class="mb-6"></div>')
      }}
    />
  );
}

const ModernTile = ({
  title,
  subtitle,
  imageSrc,
  images = [],
  description,
  onClick,
  theme,
  layoutId,
  delay = 0,
  isExpanded = false,
  currentIndex = 0,
  setCurrentIndex = () => {},
  totalItems = 1,
  onNavigate = () => {},
  customContent = null,
  isMobile = false,
  isPopupOpen = false,
  isShopItem = false,
  isJournalPost = false,
  postId = null,
  addToCart = null,
  product = null
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFullscreenGalleryOpen, setIsFullscreenGalleryOpen] = useState(false);
  const [fullscreenGalleryImages, setFullscreenGalleryImages] = useState([]);
  const [fullscreenGalleryInitialIndex, setFullscreenGalleryInitialIndex] = useState(0);

  const hasImage = Boolean(imageSrc) || (images && images.length > 0);
  const hasMultipleImages = images && images.length > 1;
  const displayImage = hasMultipleImages ? images[currentIndex] : (imageSrc || images[0]);

  // Handle image clicks to open fullscreen gallery
  const handleImageClick = (clickedImageSrc) => {
    // Get all images from the content (excluding featured image)
    const allImages = extractImagesFromContent(description);

    // Only include content images in the gallery, not the featured image
    const galleryImages = [...allImages];

    // Find the index of the clicked image
    const initialIndex = galleryImages.findIndex(img => img === clickedImageSrc);

    setFullscreenGalleryImages(galleryImages);
    setFullscreenGalleryInitialIndex(Math.max(0, initialIndex));
    setIsFullscreenGalleryOpen(true);
  };

  // Set up image click handling
  const handleContentImageClick = (imageSrc) => {
    handleImageClick(imageSrc);
  };

  // Theme-specific gradient backgrounds
  const gradientStyles = {
    persimmon: {
      background: 'radial-gradient(circle at 20% 80%, rgba(226, 77, 0, 0.1) 0%, rgba(211, 121, 60, 0.05) 50%, transparent 100%)',
      border: 'rgba(226, 77, 0, 0.2)'
    },
    matcha: {
      background: 'radial-gradient(circle at 20% 80%, rgba(116, 153, 91, 0.1) 0%, rgba(179, 209, 152, 0.05) 50%, transparent 100%)',
      border: 'rgba(116, 153, 91, 0.2)'
    },
    glacier: {
      background: 'radial-gradient(circle at 20% 80%, rgba(26, 26, 26, 0.1) 0%, rgba(247, 247, 247, 0.05) 50%, transparent 100%)',
      border: 'rgba(26, 26, 26, 0.2)'
    }
  };

  const currentGradient = gradientStyles[theme] || gradientStyles.persimmon;

  const handleTileClick = (e) => {
    e.stopPropagation();
    if (onClick && !isExpanded) {
      onClick();
    }
  };

  const handleNavigation = (direction) => (e) => {
    e.stopPropagation();
    onNavigate(direction);
  };

  // Function to strip HTML tags from text for preview
  const stripHtmlTags = (html) => {
    if (!html) return '';
    // Remove HTML entities and tags more thoroughly
    return html
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&hellip;/g, '...') // Replace ellipsis entity
      .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove other HTML entities
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
  };

  if (isExpanded) {
    return (
      <motion.div
        key={`expanded-${layoutId}`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Semi-transparent overlay */}
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClick}
        />

        {/* Navigation arrows */}
        {totalItems > 1 && (
          <>
            <button
              onClick={handleNavigation('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-60 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3 hover:bg-white/20 transition-all duration-200"
              aria-label="Previous item"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNavigation('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-60 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3 hover:bg-white/20 transition-all duration-200"
              aria-label="Next item"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Expanded content */}
        <motion.div
          className="relative z-50 w-full max-w-6xl mx-auto h-[calc(100vh-4rem)] my-8 flex flex-col overflow-auto rounded-3xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero Section or Header */}
          {hasImage ? (
            /* Hero Section with Featured Image and Overlaid Text */
            <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0 rounded-t-3xl">
              <img
                src={displayImage}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Overlaid Text */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center text-white p-8 max-w-4xl mx-auto">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-lg md:text-xl text-white/90 font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClick}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            /* Header for posts without featured image */
            <div className="bg-white/95 backdrop-blur-md p-6 border-b border-gray-100 flex-shrink-0 rounded-t-3xl">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="text-center flex-1">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-lg md:text-xl text-gray-600 font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClick}
                  className="ml-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Content Section */}
          <div className={`bg-white/95 backdrop-blur-md shadow-2xl flex-1 border border-white/20 ${hasImage ? 'border-t-0 rounded-b-3xl' : 'rounded-3xl'}`}>
            <div className="p-10">
              {customContent ? (
                <div className="modern-custom-content max-w-4xl mx-auto">
                  {customContent}
                </div>
              ) : (
                <div className="space-y-8 max-w-4xl mx-auto">
                  {/* Shop Item Gallery */}
                  {isShopItem && images.length > 1 && (
                    <div className="mb-10">
                      <EnhancedImageGallery
                        images={images}
                        currentIndex={currentIndex}
                        setCurrentIndex={setCurrentIndex}
                        title={title}
                        showThumbnails={true}
                        showCounter={true}
                        showArrows={true}
                        isMobile={isMobile}
                      />
                    </div>
                  )}

                  {/* Content with inline images */}
                  <div className="flex justify-center">
                    {isShopItem ? (
                      <div className="prose prose-gray max-w-none text-left w-full">
                        <div
                          className="text-gray-700 leading-relaxed"
                          style={{
                            lineHeight: isMobile ? '1.6' : '1.8',
                            maxWidth: '75ch',
                            margin: '0 auto'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: description.replace(/<\/p>/g, '</p><div class="mb-6"></div>')
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full">
                        <InlineWordPressContent
                          content={description}
                          onImageClick={handleContentImageClick}
                          className="text-gray-700 leading-relaxed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Button for Shop Items */}
                  {isShopItem && addToCart && product && (
                    <div className="flex flex-col items-center mt-6 space-y-3">
                      {/* Stock Status */}
                      {product.manageStock && product.stockQuantity !== null && (
                        <div className="text-sm text-gray-600">
                          {product.stockQuantity > 0 ? (
                            <span className="text-green-600">
                              {product.stockQuantity} in stock
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Out of stock
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Stock Status for non-managed stock */}
                      {!product.manageStock && (
                        <div className="text-sm text-gray-600">
                          {product.inStock ? (
                            <span className="text-green-600">In stock</span>
                          ) : (
                            <span className="text-red-600 font-medium">Out of stock</span>
                          )}
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setIsAddingToCart(true);
                          try {
                            await addToCart(product);
                            // Add a small delay to show the loading state
                            setTimeout(() => setIsAddingToCart(false), 500);
                          } catch (error) {
                            alert(error.message);
                            setIsAddingToCart(false);
                          }
                        }}
                        disabled={isAddingToCart || !product.inStock || (product.manageStock && product.stockQuantity === 0)}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          !product.inStock || (product.manageStock && product.stockQuantity === 0)
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white'
                        }`}
                      >
                        {isAddingToCart ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Adding...
                          </>
                        ) : !product.inStock || (product.manageStock && product.stockQuantity === 0) ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Out of Stock
                          </>
                        ) : (
                          <>
                            <img
                              src="/shapes/NavIcons/CartIcon.svg"
                              alt="Cart"
                              className="w-5 h-5"
                            />
                            Add to Cart - ${product.price}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Comments Section for Journal Posts */}
                  {isJournalPost && postId && (
                    <CommentSection 
                      postId={postId} 
                      theme={theme} 
                      isMobile={isMobile} 
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Fullscreen Gallery */}
        <FullscreenGallery
          images={fullscreenGalleryImages}
          isOpen={isFullscreenGalleryOpen}
          onClose={() => setIsFullscreenGalleryOpen(false)}
          initialIndex={fullscreenGalleryInitialIndex}
          title={title}
        />
      </motion.div>
    );
  }

  // Regular tile view
  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isPopupOpen ? 0 : 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative ${isMobile ? 'w-64 flex-shrink-0' : 'w-80 flex-shrink-0'} ${isPopupOpen ? 'pointer-events-none' : ''}`}
      style={{
        display: isPopupOpen ? 'none' : 'block',
        borderRadius: '1rem', // Ensure rounded corners are maintained during hover
        overflow: 'hidden'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={handleTileClick}
    >
      <div
        className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/20 h-96 flex flex-col w-full"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%), ${currentGradient.background}`,
          borderColor: currentGradient.border
        }}
      >
        {/* Image */}
        {hasImage && (
          <div className="relative h-48 overflow-hidden flex-shrink-0">
            <img
              src={displayImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
              onError={() => setImageError(true)}
            />
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
            {title || 'No title'}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mb-2">
              {subtitle}
            </p>
          )}

          {/* Description preview */}
          <div className="text-sm text-gray-700 line-clamp-3 flex-1">
            {description && stripHtmlTags(description).trim()
              ? (stripHtmlTags(description).length > 120
                  ? stripHtmlTags(description).substring(0, 120) + '...'
                  : stripHtmlTags(description))
              : 'No description available'
            }
          </div>
        </div>

        {/* Hover indicator */}
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-2xl pointer-events-none"
          style={{ borderRadius: '1rem' }} // Ensure rounded corners match the container
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
};

export default ModernTile;
