import React, { useEffect, useRef } from 'react';

const InlineWordPressContent = ({
  content,
  onImageClick = () => {},
  className = ""
}) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!content || !contentRef.current) return;

    // Find all img elements in the content
    const images = contentRef.current.querySelectorAll('img');

    images.forEach((img) => {
      // Make images clickable
      img.style.cursor = 'pointer';
      img.style.transition = 'all 0.3s ease';
      img.style.borderRadius = '12px';
      img.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.margin = '2rem auto';
      img.style.display = 'block';
      img.style.textAlign = 'center';

      // Add click handler
      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onImageClick(img.src);
      };

      img.addEventListener('click', clickHandler);

      // Add hover effects
      const hoverEnterHandler = () => {
        img.style.transform = 'scale(1.02)';
        img.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.2)';
        img.style.border = '2px solid rgba(59, 130, 246, 0.6)';
      };

      const hoverLeaveHandler = () => {
        img.style.transform = 'scale(1)';
        img.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        img.style.border = 'none';
      };

      img.addEventListener('mouseenter', hoverEnterHandler);
      img.addEventListener('mouseleave', hoverLeaveHandler);

      // Clean up function for this image
      const cleanup = () => {
        img.removeEventListener('click', clickHandler);
        img.removeEventListener('mouseenter', hoverEnterHandler);
        img.removeEventListener('mouseleave', hoverLeaveHandler);
      };

      // Store cleanup function for component unmount
      img._cleanup = cleanup;
    });

    // Cleanup function for component unmount
    return () => {
      images.forEach((img) => {
        if (img._cleanup) {
          img._cleanup();
        }
      });
    };
  }, [content, onImageClick]);

  return (
    <div
      ref={contentRef}
      className={`prose prose-gray max-w-none text-left w-full ${className}`}
      style={{
        lineHeight: '1.8'
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default InlineWordPressContent;
