import React, { useRef, useState, useEffect } from 'react';
import './SpecialSlider.css';

const SpecialSlider = ({ mediaUrl, mediaType, listItems, hasSpecialFunction = false, title }) => {
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(null);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      setShowOverlay(false);
    };
  }, [mediaUrl]);

  const handleTap = () => {
    if (!hasSpecialFunction) return;

    const currentTime = Date.now();

    if (showOverlay) {
      if (lastTapTime && (currentTime - lastTapTime) > 5000) {
        setShowOverlay(false);
      } else {
        setShowOverlay(false);
      }
    } else {
      setShowOverlay(true);
      setLastTapTime(currentTime);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, 5000);
    }
  };

  const handleMouseEnter = () => {
    if (!hasSpecialFunction || window.innerWidth <= 768) return;

    clearTimeout(timeoutRef.current);
    setShowOverlay(true);
  };

  const handleMouseLeave = () => {
    if (!hasSpecialFunction || window.innerWidth <= 768) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowOverlay(false);
    }, 2000);
  };

  return (
    <div 
      className="special-slider" 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleTap}
    >
      {mediaType === 'image' ? (
        <img
          src={mediaUrl}
          alt="Slide"
          className="special-slider__image"
        />
      ) : (
        <video
          src={mediaUrl}
          loop
          autoPlay
          muted
          className="special-slider__video"
        />
      )}
      
      {hasSpecialFunction && (
        <div className={`special-slider__overlay ${showOverlay ? 'active' : 'hidden'}`}>
          <h3 className="special-slider__title">Преимущества:</h3>
          <ul className="special-slider__list">
            {listItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SpecialSlider;