import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Slider.css';

function resolveImagePath(imageStr) {
  if (!imageStr) return null;
  if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    return imageStr;
  }
  try {
    return require(`./images/${imageStr}`);
  } catch (err) {
    console.error('Локальный файл не найден:', imageStr);
    return 'BROKEN_LOCAL';
  }
}

const Slider = () => {
  const allCards = [
    { id: 1, image: 'https://spaceaqua.ru/upload/resize_webp/iblock/359/188_281_140cd750bba9870f18aada2478b24840a/839m1j3bhjquritsp8dhsirjk3j0wtlx.webp', heading: 'Для скважины и коттеджа', backgroundColor: '#2C3E50' },
    { id: 2, image: 'https://spaceaqua.ru/upload/resize_webp/iblock/060/188_281_140cd750bba9870f18aada2478b24840a/fdh5327l1vd011u5eaid7b18mahnaoz1.webp', heading: 'Коммерческие осмосы', backgroundColor: '#2C3E50' },
    { id: 3, image: 'https://spaceaqua.ru/upload/resize_webp/iblock/087/188_281_140cd750bba9870f18aada2478b24840a/hjxbmcb4h8ety332t0mn1xkq2jux59id.webp', heading: 'Обезжелезивание и аэрация', backgroundColor: '#2C3E50' },
    { id: 4, image: 'https://spaceaqua.ru/upload/resize_webp/iblock/e24/188_281_140cd750bba9870f18aada2478b24840a/x5dz7c0x1b8e2nmlerzbvtnq87svdqhw.webp', heading: 'Умягчение воды', backgroundColor: '#2C3E50' },
    { id: 5, image: 'https://spaceaqua.ru/upload/resize_webp/iblock/4c1/188_281_140cd750bba9870f18aada2478b24840a/xjboyb85hzos7jppk3kkw29stf9lifqs.webp', heading: 'Коммерческие основы', backgroundColor: '#2C3E50' },
    { id: 6, image: 'https://spaceaqua.ru/upload/resize_webp/iblock/e2a/188_281_140cd750bba9870f18aada2478b24840a/n2qojywcr2v5yd39168pp6ybf5kk53l2.webp', heading: 'Для квартиры', backgroundColor: '#2C3E50' },
  ];

  const STEP = 3;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flashPrev, setFlashPrev] = useState(false);
  const [flashNext, setFlashNext] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024); // Увеличиваем порог до 1024px
  const sliderRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024); // Планшеты до 1024px считаем мобильными
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex + STEP < allCards.length;

  const triggerFlash = useCallback((dir) => {
    if (dir === 'prev') {
      setFlashPrev(true);
      setTimeout(() => setFlashPrev(false), 300);
    } else {
      setFlashNext(true);
      setTimeout(() => setFlashNext(false), 300);
    }
  }, []);

  const goPrev = () => {
    if (!canGoPrev) {
      triggerFlash('prev');
      return;
    }
    setCurrentIndex((prev) => prev - STEP);
  };

  const goNext = () => {
    if (!canGoNext) {
      triggerFlash('next');
      return;
    }
    setCurrentIndex((prev) => prev + STEP);
  };

  const handleStart = (clientX) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = useCallback((clientX) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setCurrentTranslate(diff);
  }, [isDragging, startX]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = isDesktop ? 100 : 50; // 50px для смартфонов и планшетов
    if (currentTranslate > threshold) {
      goPrev();
    } else if (currentTranslate < -threshold) {
      goNext();
    }
    setCurrentTranslate(0);
  }, [isDragging, currentTranslate, goPrev, goNext, isDesktop]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleMouseDown = (e) => {
      if (e.button !== 0 || e.target.tagName.toLowerCase() === 'img') return;
      handleStart(e.clientX);
    };
    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();
    const handleMouseLeave = () => handleEnd();

    const handleTouchStart = (e) => handleStart(e.touches[0].clientX);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientX);
    const handleTouchEnd = () => handleEnd();

    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mousemove', handleMouseMove);
    slider.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mouseleave', handleMouseLeave);
    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchmove', handleTouchMove);
    slider.addEventListener('touchend', handleTouchEnd);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mousemove', handleMouseMove);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('touchstart', handleTouchStart);
      slider.removeEventListener('touchmove', handleTouchMove);
      slider.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove, handleEnd]);

  const visibleCards = isDesktop ? allCards.slice(currentIndex, currentIndex + STEP) : allCards;
  const isEmpty = allCards.length === 0;
  let extraClass = '';
  if (isDesktop) {
    if (visibleCards.length === 1) extraClass = 'slide-container--single';
    if (visibleCards.length === 2) extraClass = 'slide-container--double';
  }

  const CardItem = ({ card }) => {
    const heading = card.heading && card.heading.trim() ? card.heading : 'Unknown';
    if (!card.image) {
      return (
        <div className="card" style={{ backgroundColor: card.backgroundColor }}>
          <div className="card-no-image">:( Картинки нет</div>
          <h3>{heading}</h3>
        </div>
      );
    }

    const resolvedPath = resolveImagePath(card.image);
    if (resolvedPath === 'BROKEN_LOCAL') {
      return (
        <div className="card" style={{ backgroundColor: card.backgroundColor }}>
          <div className="card-broken-image">:( Картинка не работает</div>
          <h3>{heading}</h3>
        </div>
      );
    }

    const [isImgBroken, setIsImgBroken] = useState(false);
    if (isImgBroken) {
      return (
        <div className="card" style={{ backgroundColor: card.backgroundColor }}>
          <div className="card-broken-image">:( Картинка не работает</div>
          <h3>{heading}</h3>
        </div>
      );
    }

    return (
      <div className="card" style={{ backgroundColor: card.backgroundColor }}>
        <img src={resolvedPath} alt={heading} onError={() => setIsImgBroken(true)} style={{ pointerEvents: 'none' }} />
        <h3>{heading}</h3>
      </div>
    );
  };

  return (
    <div className="slider">
      <div className="catalog-header">
        <h2 className="catalog-title">Каталог</h2>
      </div>

      {isEmpty ? (
        <div className="no-slides">Больше слайдов нет</div>
      ) : (
        <div
          className={`slide-container ${extraClass}`}
          ref={sliderRef}
          style={{
            transform: `translateX(${currentTranslate}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {visibleCards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      )}

      {isDesktop && (
        <div className="category-navigation">
          <button className={`category-button category-button--prev ${flashPrev ? 'flash' : ''}`} onClick={goPrev} />
          <button className={`category-button category-button--next ${flashNext ? 'flash' : ''}`} onClick={goNext} />
        </div>
      )}
    </div>
  );
};

export default Slider;