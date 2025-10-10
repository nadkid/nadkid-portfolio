import React from "react";

const RetroCRTTile = ({
  title = "PROJECT NAME",
  imageSrc,
  images = [],
  description = "A short description of the project goes here.",
  primaryLabel = "VIEW PROJECT",
  secondaryLabel = "",
  onPrimary = () => {},
  onSecondary = () => {},
  onClose = () => {},
  showClose = true,
  expanded = false,
  onImageClick = () => {},
  customContent = null,
}) => {
  const hasImage = Boolean(imageSrc) || (images && images.length > 0);
  const hasMultipleImages = images && images.length > 1;
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const nextImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const displayImage = hasMultipleImages ? images[currentImageIndex] : (imageSrc || images[0]);

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

      {customContent ? (
        <div className="retro-desc-wrap">
          {customContent}
        </div>
      ) : (
        <>
          {hasImage && (
            <div className="retro-panel">
              <div className="retro-panel-inner">
                <div
                  className="retro-image"
                  style={{
                    backgroundImage: displayImage ? `url(${displayImage})` : undefined,
                    cursor: onImageClick !== (() => {}) ? 'pointer' : 'default'
                  }}
                  onClick={onImageClick}
                  role={onImageClick !== (() => {}) ? 'button' : undefined}
                  tabIndex={onImageClick !== (() => {}) ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onImageClick();
                    }
                  }}
                >
                  {!displayImage && (
                    <div className="retro-image placeholder">
                      No Image Available
                    </div>
                  )}
                  {hasMultipleImages && (
                    <>
                      <button
                        className="gallery-arrow gallery-arrow-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        className="gallery-arrow gallery-arrow-right"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        aria-label="Next image"
                      >
                        ›
                      </button>
                    </>
                  )}
                  <div className="scanlines"></div>
                </div>
              </div>
            </div>
          )}

          <div className="retro-desc-wrap">
            <div
              className="retro-desc"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>

          {(primaryLabel && primaryLabel.trim() !== '') || (secondaryLabel && secondaryLabel.trim() !== '') ? (
            <div className="retro-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center', padding: '12px' }}>
              {primaryLabel && primaryLabel.trim() !== '' && (
                <button
                  className="retro-button"
                  onClick={onPrimary}
                  style={{
                    background: 'var(--retro-button)',
                    color: 'var(--retro-button-text)',
                    border: '2px solid var(--retro-stroke)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {primaryLabel}
                </button>
              )}
              {secondaryLabel && secondaryLabel.trim() !== '' && (
                <button
                  className="retro-button-secondary"
                  onClick={onSecondary}
                  style={{
                    background: 'transparent',
                    color: 'var(--retro-text)',
                    border: '2px solid var(--retro-stroke)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {secondaryLabel}
                </button>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default RetroCRTTile;


