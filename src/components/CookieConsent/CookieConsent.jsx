import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom'; // Импортируем useNavigate
import './CookieConsent.css';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate(); // Хук для навигации

  useEffect(() => {
    const cookieConsent = document.cookie.includes('cookieConsent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('http://localhost:5000/api/accept-cookies', {
          token,
          accept: true,
        }, { withCredentials: true });
      }
      setIsVisible(false);
    } catch (error) {
      console.error('Ошибка при принятии куки:', error);
    }
  };

  const handleDetails = () => {
    navigate('/politics'); // Переход на маршрут /contacts
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent">
      <h3 className="cookie-consent-header">Мы используем файлы cookie.</h3>
      <p className="cookie-consent-text">
        Работая с этим сайтом, вы даете свое согласие на использование файлов cookie сервисов. Это необходимо для нормального функционирования сайта, показа целевой рекламы и анализа трафика.
      </p>
      <div className="cookie-consent-buttons">
        <Button className="cookie-consent-button details" onClick={handleDetails}>
          Подробнее
        </Button>
        <Button className="cookie-consent-button accept" onClick={handleAccept}>
          ОК
        </Button>
      </div>
    </div>
  );
};

export default CookieConsent;