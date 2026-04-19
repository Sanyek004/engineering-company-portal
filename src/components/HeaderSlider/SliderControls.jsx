import React from 'react';
import prevIcon from './icons/prev.png';
import nextIcon from './icons/next.png';

const SliderControls = ({ currentSlide, totalSlides, onPrevClick, onNextClick }) => {
  return (
    <div className="slider-controls">
      <button
        onClick={onPrevClick}
        className="slider-button"
      >
        <img src={prevIcon} alt="Previous Slide" />
      </button>
      <span className="slider-counter">{currentSlide + 1} / {totalSlides}</span>
      <button
        onClick={onNextClick}
        className="slider-button"
      >
        <img src={nextIcon} alt="Next Slide" />
      </button>
    </div>
  );
};

export default SliderControls;
