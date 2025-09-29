import React from "react";

const RetroCRTTile = ({
  title = "PROJECT NAME",
  imageSrc,
  images = [],
  description = "A short description of the project goes here.",
  primaryLabel = "VIEW PROJECT",
  secondaryLabel = "BUY",
  onPrimary = () => {},
  onSecondary = () => {},
  onClose = () => {},
  showClose = true,
  expanded = false,
  onImageClick = () => {},
  customContent = null,
}) => {
  const hasImage = Boolean(imageSrc);
  const hasMultipleImages = images.length > 1;
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const displayImage = images.length > 0 ? images[currentImageIndex] : imageSrc;

  return (
    <div className={`retro-window ${expanded ? 'expanded' : ''}`}>
      <div className="retro-titlebar">
        <div className="retro-title">{title}</div>
        {showClose && (
          <button className="retro-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {(hasImage || images.length > 0) && (
        <div className="retro-panel">
          <div className="retro-panel-inner">
            <div className="relative">
              <img 
                src={displayImage} 
                alt="project" 
                className="retro-image cursor-pointer" 
                onClick={onImageClick}
              />
              {expanded && hasMultipleImages && (
                <>
                  <button 
                    className="gallery-arrow gallery-arrow-left"
                    onClick={prevImage}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button 
                    className="gallery-arrow gallery-arrow-right"
                    onClick={nextImage}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            <div className="scanlines" />
          </div>
        </div>
      )}

      {customContent ? (
        <div className="retro-desc-wrap">
          {customContent}
        </div>
      ) : (
        <>
          <div className="retro-desc-wrap">
            <div className="retro-quote">"</div>
            <p className="retro-desc">{description}</p>
            <div className="retro-quote end">"</div>
          </div>

          <div className="retro-actions">
            <button className="retro-btn primary" onClick={onPrimary}>
              {primaryLabel}
            </button>
            {secondaryLabel && (
              <button className="retro-btn secondary" onClick={onSecondary}>
                {secondaryLabel}
              </button>
            )}
          </div>
        </>
      )}

      <div className="crt-grid" aria-hidden="true" />
    </div>
  );
};

export default RetroCRTTile;


