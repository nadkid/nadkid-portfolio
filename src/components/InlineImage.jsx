import React, { useState } from 'react';
import { motion } from 'framer-motion';

const InlineImage = ({ 
  src, 
  alt, 
  className = "", 
  onClick = () => {},
  isClickable = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    if (isClickable) {
      e.preventDefault();
      onClick(src);
    }
  };

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={isClickable ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      <img
        src={src}
        alt={alt}
        className={`max-w-full h-auto rounded-lg shadow-lg transition-all duration-300 ${
          isClickable ? 'cursor-pointer hover:shadow-xl' : ''
        } ${isHovered && isClickable ? 'ring-2 ring-blue-400' : ''}`}
        onClick={handleClick}
        onError={() => setImageError(true)}
      />
      
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Click indicator overlay */}
      {isClickable && (
        <motion.div
          className="absolute inset-0 bg-blue-500/0 rounded-lg flex items-center justify-center pointer-events-none"
          animate={{ 
            backgroundColor: isHovered ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0)'
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white/90 rounded-full p-2 shadow-lg"
            animate={{ 
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8
            }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InlineImage;
