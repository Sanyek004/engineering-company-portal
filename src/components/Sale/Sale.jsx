import React, { useState, useEffect } from 'react';
import SaleImage from './image/priority-promotion.png';
import PromotionModal from '../PromotionModal/PromotionModal';
import './Sale.css';

const Sale = ({ isActive }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saleData, setSaleData] = useState(null);

  // Запрос данных об акции с сервера
  useEffect(() => {
    if (!isActive) return;

    const fetchSaleData = async () => {
      try {
        const response = await fetch('${API_BASE_URL}5000/api/sale');
        const data = await response.json();
        if (data.active) {
          setSaleData(data);
        } else {
          setSaleData(null);
        }
      } catch (error) {
        console.error('Ошибка при получении данных об акции:', error);
      }
    };

    fetchSaleData();
  }, [isActive]);

  // Эффект для таймера
  useEffect(() => {
    if (!isActive || !saleData) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(saleData.endDate) - +new Date();
      let timeLeft = {};

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      } else {
        timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return null; // Акция закончилась
      }

      return timeLeft;
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (!newTimeLeft) {
        clearInterval(timer);
        setSaleData(null);
        return;
      }
      setTimeLeft(newTimeLeft);
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [isActive, saleData]);

  const handlePromotionClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (!isActive || !saleData) {
    return null;
  }

  return (
    <>
      <div className="sale__timer">
        <div className="timer__title">До конца акции:</div>
        <div className="timer__countdown">
          <div className="timer__item">
            <span className="timer__value">{timeLeft.days}</span>
            <span className="timer__label">дней</span>
          </div>
          <div className="timer__item">
            <span className="timer__value">{timeLeft.hours}</span>
            <span className="timer__label">часов</span>
          </div>
          <div className="timer__item">
            <span className="timer__value">{timeLeft.minutes}</span>
            <span className="timer__label">минут</span>
          </div>
          <div className="timer__item">
            <span className="timer__value">{timeLeft.seconds}</span>
            <span className="timer__label">секунд</span>
          </div>
        </div>
      </div>
      <div className="sale__promotion-overlay" onClick={handlePromotionClick}>
        <img src={SaleImage} alt="Promotion" className="sale__promotion-image" />
      </div>
      <PromotionModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default Sale;
