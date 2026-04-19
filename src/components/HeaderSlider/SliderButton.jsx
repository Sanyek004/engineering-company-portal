import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SliderButton.css';

const SliderButton = ({ buttonConfig, slideIndex }) => {
  const navigate = useNavigate();

  if (!buttonConfig || buttonConfig.type === 'none') {
    return null;
  }

  const handleClick = () => {
    switch (buttonConfig.type) {
      case 'newPage':
        navigate(`/slide-detail/${slideIndex}`, {
          state: { 
            title: buttonConfig.title,
            content: buttonConfig.content 
          }
        });
        break;
      case 'component':
        if (buttonConfig.componentId) {
          const element = document.getElementById(buttonConfig.componentId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          } else {
            console.warn(`Element with id "${buttonConfig.componentId}" not found`);
          }
        }
        break;
      case 'external':
        window.open(buttonConfig.url, '_blank');
        break;
      default:
        break;
    }
  };

  return (
    <button 
      className="slider-button-custom"
      onClick={handleClick}
    >
      {buttonConfig.label || 'Подробнее'}
    </button>
  );
};

export default SliderButton;