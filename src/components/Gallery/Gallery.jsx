import React, { useState, useEffect, useRef } from "react";
import CSSTransition from 'react-transition-group/CSSTransition';
import './Gallery.css';
import video1 from './video/video1.mp4';
import video2 from './video/video2.mp4';
import video3 from './video/video3.mp4';

const media = [
  {
    type: 'video',
    url: video1,
    title: 'Реальное видео укладки теплого пола в доме построенного по технологии фахверк',
    description: ' '
  },
  {
    type: 'video',
    url: video2,
    title: 'Отзыв клиента: Сергей Ким',
    description: 'Красивый дом п. Де-Фриз. 6 систем XL_PIPE обогревают дом большой семьи'
  },
  {
    type: 'video',
    url: video3, 
    title: 'Монтаж тёплых полов в жилом комплексе "Восход"',
    description: ' '
  }
];

const Gallery = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const galleryRef = useRef(null);

  const handlePrevClick = () => {
    setCurrentIndex((currentIndex - 1 + media.length) % media.length);
  };

  const handleNextClick = () => {
    setCurrentIndex((currentIndex + 1) % media.length);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      });
    });

    if (galleryRef.current) {
      observer.observe(galleryRef.current);
    }

    return () => {
      if (galleryRef.current) {
        observer.unobserve(galleryRef.current);
      }
    };
  }, []);

  return (
    <div className="gallery-container" ref={galleryRef}>
      <h2 className="gallery-title">Примеры работ наших клиентов</h2>
      <div className="media-container">
        {media.map((item, index) => (
          <CSSTransition key={item.url} timeout={300} classNames="fade">
            <div 
              className="media-item"
              style={{
                transform: `translateX(${-100 * (index - currentIndex)}%)`
              }}
            >
              {item.type === "image" ? (
                <img 
                  src={item.url} 
                  alt={item.title}
                  className="media-content"
                />
              ) : isVisible ? (
                <video
                  src={item.url}
                  alt={item.title}
                  autoPlay
                  loop
                  muted
                  controls
                  className="media-content"
                />
              ) : null}
            </div>
          </CSSTransition>
        ))}
      </div>
      <div className="description-container">
        <h2 className="media-title">{media[currentIndex].title}</h2>
        <p className="media-description">{media[currentIndex].description}</p>
      </div>
      <div className="controls-container">
        <button onClick={handlePrevClick} className="nav-button prev-button">
          Назад
        </button>
        <button onClick={handleNextClick} className="nav-button next-button">
          Вперёд
        </button>
      </div>
    </div>
  );
};

export default Gallery;