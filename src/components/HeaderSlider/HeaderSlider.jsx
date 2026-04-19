import React, { useState, useRef, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import SliderControls from './SliderControls';
import Loader from '../Loader/Loader'; // Or your preferred import path
import './HeaderSlider.css';
import PromotionModal from '../PromotionModal/PromotionModal';
import SpecialSlider from '../SpecialSlider/SpecialSlider'; 
import SliderButton from './SliderButton';
import Sale from '../Sale/Sale'; 
import image1 from "../HeaderSlider/image/Collector_Water_Filtration.png";
import image2 from "../HeaderSlider/image/Water_Hot_Floor.png";
import image3 from "../HeaderSlider/image/Electric_tech_work.png";
import image4 from "../HeaderSlider/image/System_Water_and_Clear.png";
import image5 from "../HeaderSlider/image/System_Canalisation.png";
import image6 from "../HeaderSlider/image/Camera_CCTV.png";
import image7 from "../HeaderSlider/image/Smart_House.png";
import image8 from "../HeaderSlider/image/Skvazhina.png";
import image9 from "../HeaderSlider/image/vent_cond.png";

const slides = [
  {
    title: 'Коллекторная система',
    description: 'Наша компания монтирует современные бесшовые системы водоснабжения в любом помещении, которая управляется с единого водяного коллектора.',
    mediaUrl: image1,
    mediaType: 'image',
    hasSpecialFunction: true, // Включена специальная функция
    listItems: ['Эффективное использование пространства', 'Устройчивость к отказам', 'Бесшовая система водоснабжения', 'Равномерное распределение воды', 'Простота и надежность'],
    buttonConfig: {
      type: 'newPage', // Открывает новую страницу
      label: 'Подробнее о системе',
      title: 'Коллекторная система водоснабжения',
      content: 'Детальное описание коллекторной системы...'
    },
    hasPromotion: true // Добавляем параметр акции
  },
  {
    title: 'Водяной теплый пол от электрокотла',
    description: 'Мы эффективно и комфортно устанавливаем системы отоплений для помещений. Электрокотел служит источником тепла для нагрева теплоносителя, который циркулирует в трубах, уложенных в стяжку пола.',
    mediaUrl: image2,
    mediaType: 'image',
    hasSpecialFunction: true, // Включена специальная функция
    listItems: ['Равномерное распределение тепла', 'Эффективность', 'Экономия места', 'Экономия энергии', 'Удобство управления'],
    buttonConfig: {
      type: 'component',
      label: 'Подробнее',
      componentId: 'product-slider' 
    }
  },
  {
    title: 'Электро-технические работы',
    description: 'Решим  задачи, связанные с проектированием, монтажом и обслуживанием электрических систем.',
    mediaUrl: image3,
    mediaType: 'image',
    hasSpecialFunction: true, // Включена специальная функция
    listItems: ['Безопасность и надежность', 'Энергоэффективность', 'Автоматизация и управление', 'Комфорт', 'Апгрейт'],
    buttonConfig: {
      type: 'external', // Внешняя ссылка
      label: 'Посмотреть примеры',
      url: 'https://example.com/electrical-works'
    }
  },
  {
    title: 'Системы водоподготовки и очистки',
    description: 'Устанавливаем системы для улучшения качества воды, делая ее безопасной для потребления или использования в различных сферах. Эти системы обычно включают в себя различные технологии и оборудования для удаления загрязнений, химических веществ, бактерий',
    mediaUrl: image4,
    mediaType: 'image',
    hasSpecialFunction: true, // Включена специальная функция
    listItems: ['Безопасность здоровья', 'Улучшение вкуса и запаха', 'Предотвращение образования накипи', 'Защита оборудования', 'Снижение затрат на замену оборудования'],
    buttonConfig: {
      type: 'none' 
    }
  },
  {
    title: 'Автономная канализация',
    description: 'Производим подборку и монтаж систем очистки сточных вод, которые функционируют, независимо от центральных систем канализации',
    mediaUrl: image5,
    mediaType: 'image',
    hasSpecialFunction: true, // Включена специальная функция
    listItems: ['Независимость от централизованных систем','Эффективность использования', 'Низкие эксплуатационные расходы', 'Универсальность и надежность', 'Экологические преимущества'],
    buttonConfig: {
      type: 'none'
    }
  },
  {
    title: 'Системы безопасности и видеонаблюдения',
    description: 'Подберем оборудование и смонтируем системы видеонаблюдения, шлагбаумы и любые другие системы и устройства для обеспечения безопасности объекта',
    mediaUrl: image6,
    mediaType: 'image',
    hasSpecialFunction: true, // Включена специальная функция
    listItems: ['Защита от вторжений и краж', 'Детский мониторинг', 'Быстрое регулирование на чрезвычайные ситуации', 'Возможность удаленного управления', 'Улучшение общего комфорта'],
    buttonConfig: {
      type: 'none'
    }
  },
  {
    title: 'Умный дом',
    description: 'Устанавливаем системы умного дома, в котором внедрены технологии автоматизации и управления для обеспечения более эффективного, безопасного и комфортабельного проживания',
    mediaUrl: image7,
    mediaType: 'image',
    hasSpecialFunction: true, // Включена специальная функция
    listItems: ['Энергоэффективность', 'Удаленное управление', 'Безопасность', 'Экономия времени', 'Задачи по уходу за домом'],
    buttonConfig: {
      type: 'none'
    }
  },
  {
    title: 'Автоматизация и обустройство скважины',
    description: 'Обустраиваем водяные скважины, используем современные технологии и системы для автоматизации и управлением водоснабжением',
    mediaUrl: image8,
    mediaType: 'image',
    hasSpecialFunction: true, // Включена специальная функция
    listItems: ['Стабильное водоснабжение', 'Улучшенное управление', 'Удаленный мониторинг', 'Экономия времени и усилий', 'Избежание протечек'],
    buttonConfig: {
      type: 'none'
    }
  },
  {
    title: 'Вентиляция и кондионирование',
    description: 'Подберем и установим систему вентиляции и кондиционирования для обеспечения комфортных условий для проживания в вашем доме',
    mediaUrl: image9,
    mediaType: 'image',
    buttonConfig: {
      type: 'none'
    }
  }
];

const HeaderSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const videoRef = useRef(null);
  const [preloadedMedia, setPreloadedMedia] = useState({});
  const textSlideRef = useRef(null);
  const mediaSlideRef = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const handlePrevClick = () => {
    handleSlideChange(currentIndex - 1);
  };

  const handleNextClick = () => {
    handleSlideChange(currentIndex + 1);
  };

  const handleSlideChange = (newIndex) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((newIndex + slides.length) % slides.length);
      setIsAnimating(false);
    }, 500);
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  useEffect(() => {
    const preload = (index) => {
      const slide = slides[index];
      if (slide && !preloadedMedia[index]) {
        const updatePreloaded = () => {
          setPreloadedMedia((prev) => ({ ...prev, [index]: true }));
          if (index === 0) {
            setInitialLoad(false);
          }
        };
        if (slide.mediaType === 'image') {
          const img = new Image();
          img.src = slide.mediaUrl;
          img.onload = updatePreloaded;
          img.onerror = () => {
            console.error(`Failed to preload image at index ${index}: ${slide.mediaUrl}`);
            updatePreloaded();
          };
        } else if (slide.mediaType === 'video') {
          const video = document.createElement('video');
          video.src = slide.mediaUrl;
          video.oncanplaythrough = updatePreloaded;
          video.onerror = () => {
            console.error(`Failed to preload video at index ${index}: ${slide.mediaUrl}`);
            updatePreloaded();
          };
          video.load();
        }
      }
    };
    preload(currentIndex);
    const nextIndex = (currentIndex + 1) % slides.length;
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;

    preload(nextIndex);
    preload(prevIndex);
  }, [currentIndex, preloadedMedia]);

  return (
    <div className="header-slider">
      <div className="header-slider__content">
        <CSSTransition
          in={!isAnimating}
          timeout={500}
          classNames="slide"
          unmountOnExit
          nodeRef={textSlideRef}
        >
          <div ref={textSlideRef} className="header-slider__text">
            <h2>{slides[currentIndex].title}</h2>
            <p>{slides[currentIndex].description}</p>
            <div className="header-slider__button-wrapper">
              <SliderButton 
                buttonConfig={slides[currentIndex].buttonConfig}
                slideIndex={currentIndex}
              />
              {slides[currentIndex].hasPromotion && (
                <Sale isActive={true} />
              )}
            </div>
          </div>
        </CSSTransition>
      </div>
      <div className="header-slider__media">
        <CSSTransition
          in={!isAnimating}
          timeout={500}
          classNames="slide"
          unmountOnExit
          nodeRef={mediaSlideRef}
        >
          <div ref={mediaSlideRef} className="header-slider__media-wrapper">
            {(initialLoad || !preloadedMedia[currentIndex]) ? (
              <Loader subject={slides[currentIndex].mediaType} />
            ) : (
              <>
                <SpecialSlider
                  mediaUrl={slides[currentIndex].mediaUrl}
                  mediaType={slides[currentIndex].mediaType}
                  listItems={slides[currentIndex].listItems}
                  hasSpecialFunction={slides[currentIndex].hasSpecialFunction}
                  slideIndex={currentIndex}
                  currentIndex={currentIndex}
                />
                {slides[currentIndex].hasPromotion && (
                  <Sale isActive={true} />
                )}
              </>
            )}
          </div>
        </CSSTransition>
      </div>
      <SliderControls
        onPrevClick={handlePrevClick}
        onNextClick={handleNextClick}
        currentSlide={currentIndex}
        totalSlides={slides.length}
      />
    </div>
  );
};

export default HeaderSlider;