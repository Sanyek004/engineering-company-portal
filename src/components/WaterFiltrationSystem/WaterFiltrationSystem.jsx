import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { Avatar } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import './WaterFiltrationSystem.css';

const WaterFiltrationSystem = () => {
  const [showInfo, setShowInfo] = useState(null);

  // Объект с позициями иконок для разных разрешений
  const iconPositions = {
    desktop: {
      1: { top: '60px', left: '96px' },
      2: { top: '60px', left: '210px' },
      3: { top: '60px', left: '325px' },
    },
    tablet: {
      1: { top: '50px', left: '115px' },
      2: { top: '50px', left: '226px' },
      3: { top: '50px', left: '343px' },
    },
    mobile: {
      1: { top: '10px', left: '43px' },
      2: { top: '10px', left: '105px' },
      3: { top: '10px', left: '167px' },
    },
  };

  const handleIconClick = (index) => {
    setShowInfo(showInfo === index ? null : index);
  };

  const closeInfoPopup = (e) => {
    if (e.target.classList.contains('info-popup') || e.target.closest('.info-popup')) {
      return;
    }
    setShowInfo(null);
  };

  // Компонент для рендеринга иконок
  const renderIcons = () => (
    <>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className={`plus-icon plus-icon-${index} ${showInfo === index ? 'active' : ''}`}
          onClick={() => handleIconClick(index)}
        >
          <Avatar size={32} icon={<PlusOutlined />} />
          <CSSTransition
            in={showInfo === index}
            timeout={2000}
            classNames="info-popup"
            unmountOnExit
          >
            <div className="info-popup" onMouseDown={closeInfoPopup}>
              {index === 1 && (
                <>
                  <h3>Система аэрации</h3>
                  <p>Насыщает воду кислородом, переводя растворённое железо в осадок и удаляет запах сероводорода</p>
                </>
              )}
              {index === 2 && (
                <>
                  <h3>Система обезжелезивания</h3>
                  <p>Очищает от железа</p>
                </>
              )}
              {index === 3 && (
                <>
                  <h3>Система ProMix</h3>
                  <p>Очищает от марганца, органических веществ, аммония, жёсткости и железа</p>
                </>
              )}
            </div>
          </CSSTransition>
        </div>
      ))}
    </>
  );

  return (
    <div className="water-filtration-system">
      {/* Контейнер для смартфонов и планшетов */}
      <div className="mobile-tablet-container">
        <h1>Бесплатный подбор системы водоочистки</h1>
        <p>
          Мы готовы предложить комплектующие и готовые решения систем водоочистки для загородного дома, квартиры и производства.
        </p>
        <div className="image-container">
          <img
            src="https://spaceaqua.ru/upload/medialibrary/6eb/sgc7obfse0ku87jp256gak6lmb2an6is.png"
            alt="Water Filtration System"
          />
          {renderIcons()}
        </div>
        <button type="button">Подобрать оборудование</button>
      </div>

      {/* Контейнер для десктопов */}
      <div className="desktop-container">
        <div className="text-container">
          <h1>Бесплатный подбор системы водоочистки</h1>
          <p>
            Мы готовы предложить комплектующие и готовые решения систем водоочистки для загородного дома, квартиры и производства.
          </p>
          <button type="button">Подобрать оборудование</button>
        </div>
        <div className="image-container">
          <img
            src="https://spaceaqua.ru/upload/medialibrary/6eb/sgc7obfse0ku87jp256gak6lmb2an6is.png"
            alt="Water Filtration System"
          />
          {renderIcons()}
        </div>
      </div>

      {/* Встраиваем стили для иконок прямо в компонент */}
      <style jsx>{`
        .plus-icon-1 {
          top: ${iconPositions.desktop[1].top};
          left: ${iconPositions.desktop[1].left};
        }
        .plus-icon-2 {
          top: ${iconPositions.desktop[2].top};
          left: ${iconPositions.desktop[2].left};
        }
        .plus-icon-3 {
          top: ${iconPositions.desktop[3].top};
          left: ${iconPositions.desktop[3].left};
        }

        @media (max-width: 767px) {
          .plus-icon-1 {
            top: ${iconPositions.mobile[1].top};
            left: ${iconPositions.mobile[1].left};
          }
          .plus-icon-2 {
            top: ${iconPositions.mobile[2].top};
            left: ${iconPositions.mobile[2].left};
          }
          .plus-icon-3 {
            top: ${iconPositions.mobile[3].top};
            left: ${iconPositions.mobile[3].left};
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .plus-icon-1 {
            top: ${iconPositions.tablet[1].top};
            left: ${iconPositions.tablet[1].left};
          }
          .plus-icon-2 {
            top: ${iconPositions.tablet[2].top};
            left: ${iconPositions.tablet[2].left};
          }
          .plus-icon-3 {
            top: ${iconPositions.tablet[3].top};
            left: ${iconPositions.tablet[3].left};
          }
        }
      `}</style>
    </div>
  );
};

export default WaterFiltrationSystem;