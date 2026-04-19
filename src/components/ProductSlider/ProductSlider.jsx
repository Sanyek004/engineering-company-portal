import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ProductSlider.css';

const ProductImage = ({ imageUrl, altText }) => (
  <div className="product-image">
    <img src={imageUrl} alt={altText} loading="lazy" />
  </div>
);

const ProductCard = ({ product, observeRef }) => (
  <div className="product-card product-animate-from-right" ref={observeRef}>
    <ProductImage imageUrl={product.imageUrl} altText={product.title} />
    <div className="product-info card-content">
      <h3 className="product-title">{product.title}</h3>
      <p className="price">{product.price} ₽</p>
      <p className={`availability ${product.available ? 'in-stock' : 'out-of-stock'}`}>
        {product.available ? 'В наличии' : 'Нет в наличии'}
      </p>
    </div>
  </div>
);

const ProductSlider = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hintOffset, setHintOffset] = useState(0); // Сдвиг для анимации подсказки
  const [lastInteraction, setLastInteraction] = useState(Date.now()); // Время последнего взаимодействия
  const sliderRef = useRef(null);
  const cardRefs = useRef([]);
  const touchStartX = useRef(null);
  const hintTimeoutRef = useRef(null); // Для задержки перед анимацией
  const hintAnimationRef = useRef(null); // Для текущей анимации

  const getSlidesToShow = () => {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    if (window.innerWidth <= 1200) return 3;
    return 4;
  };

  const [slidesToShow, setSlidesToShow] = useState(getSlidesToShow);
  const totalSlides = Math.ceil(products.length / slidesToShow);

  useEffect(() => {
    const handleResize = () => setSlidesToShow(getSlidesToShow());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slideGroups = Array.from({ length: totalSlides }, (_, i) =>
    products.slice(i * slidesToShow, (i + 1) * slidesToShow)
  );

  const clearHintAnimation = useCallback(() => {
    clearTimeout(hintTimeoutRef.current);
    clearTimeout(hintAnimationRef.current);
    setHintOffset(0);
    hintTimeoutRef.current = null;
    hintAnimationRef.current = null;
  }, []);

  const nextSlide = useCallback(() => {
    if (isAnimating || currentIndex >= totalSlides - 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => prev + 1);
    setLastInteraction(Date.now()); // Обновляем время взаимодействия
    clearHintAnimation(); // Прерываем анимацию при прокрутке
  }, [isAnimating, currentIndex, totalSlides, clearHintAnimation]);

  const prevSlide = useCallback(() => {
    if (isAnimating || currentIndex <= 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);
    setLastInteraction(Date.now()); // Обновляем время взаимодействия
    clearHintAnimation(); // Прерываем анимацию при прокрутке
  }, [isAnimating, currentIndex, clearHintAnimation]);

  useEffect(() => {
    if (!isAnimating) return;
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [isAnimating]);

  const addToRefs = useCallback((el) => {
    if (el && !cardRefs.current.includes(el)) cardRefs.current.push(el);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) {
            target.classList.add('product-in-view');
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.1 }
    );

    cardRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, [slideGroups]);

  // Логика анимации подсказки
  const startHintAnimation = useCallback(() => {
    if (window.innerWidth > 600) return; // Только для смартфонов

    clearHintAnimation(); // Сбрасываем текущую анимацию

    const canGoLeft = currentIndex > 0;
    const canGoRight = currentIndex < totalSlides - 1;

    if (!canGoLeft && !canGoRight) return; // Нет доступных направлений

    if (canGoLeft && canGoRight) {
      // Анимация для обоих направлений
      setHintOffset(-20); // Сдвиг налево
      hintAnimationRef.current = setTimeout(() => {
        setHintOffset(0); // Возврат
        hintAnimationRef.current = setTimeout(() => {
          setHintOffset(20); // Сдвиг направо
          hintAnimationRef.current = setTimeout(() => {
            setHintOffset(0); // Возврат
          }, 2000); // Направо длится 2 секунды
        }, 1000); // Пауза 1 секунда перед сдвигом направо
      }, 2000); // Налево длится 2 секунды
    } else {
      // Анимация в единственном доступном направлении
      const direction = canGoRight ? 1 : -1;
      setHintOffset(direction * 20); // Сдвиг
      hintAnimationRef.current = setTimeout(() => {
        setHintOffset(0); // Возврат
      }, 2000); // Длительность 2 секунды
    }
  }, [currentIndex, totalSlides, clearHintAnimation]);

  // Проверка бездействия и запуск анимации
  useEffect(() => {
    if (window.innerWidth > 600) return;

    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastInteraction >= 3000 && sliderRef.current && !hintTimeoutRef.current) {
        // 3 секунды бездействия и анимация не запущена
        startHintAnimation();
        hintTimeoutRef.current = setInterval(startHintAnimation, 5000); // Повтор каждые 5 секунд
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          checkInactivity();
          const interval = setInterval(checkInactivity, 1000); // Проверяем каждую секунду
          return () => clearInterval(interval);
        } else {
          clearHintAnimation();
          clearInterval(hintTimeoutRef.current);
        }
      },
      { threshold: 0.5 }
    );

    if (sliderRef.current) observer.observe(sliderRef.current);

    return () => {
      observer.disconnect();
      clearHintAnimation();
      clearInterval(hintTimeoutRef.current);
    };
  }, [lastInteraction, startHintAnimation]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    clearHintAnimation(); // Прерываем анимацию
    clearInterval(hintTimeoutRef.current); // Сбрасываем интервал
    setLastInteraction(Date.now()); // Обновляем время взаимодействия
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = touchStartX.current - currentX;

    if (Math.abs(deltaX) > 50) {
      deltaX > 0 ? nextSlide() : prevSlide();
      touchStartX.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  useEffect(() => {
    const slider = sliderRef.current;
    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchmove', handleTouchMove);
    slider.addEventListener('touchend', handleTouchEnd);
    slider.addEventListener('mousedown', handleTouchStart);
    slider.addEventListener('mousemove', handleTouchMove);
    slider.addEventListener('mouseup', handleTouchEnd);
    slider.addEventListener('mouseleave', handleTouchEnd);

    return () => {
      slider.removeEventListener('touchstart', handleTouchStart);
      slider.removeEventListener('touchmove', handleTouchMove);
      slider.removeEventListener('touchend', handleTouchEnd);
      slider.removeEventListener('mousedown', handleTouchStart);
      slider.removeEventListener('mousemove', handleTouchMove);
      slider.removeEventListener('mouseup', handleTouchEnd);
      slider.removeEventListener('mouseleave', handleTouchEnd);
      clearHintAnimation();
      clearInterval(hintTimeoutRef.current);
    };
  }, [nextSlide, prevSlide]);

  const translateXPercentage = (currentIndex * 100) / totalSlides;
  const hintTransform = hintOffset
    ? `translateX(calc(-${translateXPercentage}% + ${hintOffset}px))`
    : `translateX(-${translateXPercentage}%)`;

  return (
    <div className="product-slider" ref={sliderRef}>
      <div className="product-catalog-header">
        <h2 className="product-catalog-title">Рекомендуем</h2>
      </div>
      <div className="product-slide-container">
        <div
          className="product-slide"
          style={{
            transform: hintTransform,
            transition: isAnimating
              ? 'transform 0.5s ease-in-out'
              : 'transform 1s ease-in-out', // Плавная анимация для подсказки
            width: `${totalSlides * 100}%`,
          }}
        >
          {slideGroups.map((group, index) => (
            <div
              className="product-slide-group"
              key={`slide-${index}`}
              style={{ flex: `0 0 ${100 / totalSlides}%` }}
            >
              {group.map((product, idx) => (
                <ProductCard
                  key={`${product.title}-${index * slidesToShow + idx}`}
                  product={product}
                  observeRef={addToRefs}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <button
        className={`product-slider-controls__button product-slider-controls__button--prev ${
          currentIndex === 0 ? 'product-slider-controls__button--disabled' : ''
        }`}
        onClick={prevSlide}
        aria-label="Previous slide"
        disabled={currentIndex === 0 || isAnimating}
      />
      <button
        className={`product-slider-controls__button product-slider-controls__button--next ${
          currentIndex >= totalSlides - 1 ? 'product-slider-controls__button--disabled' : ''
        }`}
        onClick={nextSlide}
        aria-label="Next slide"
        disabled={currentIndex >= totalSlides - 1 || isAnimating}
      />
    </div>
  );
};

export default ProductSlider;