import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import './Footer.css';

const SeparateFooter = () => {
  const navigate = useNavigate();

  const handleLinkClick = (target) => {
    // Проверяем, находимся ли мы уже на главной странице
    if (window.location.pathname !== '/') {
      // Переходим на главную страницу
      navigate('/');
      // Даем время для завершения навигации и рендеринга компонентов
      setTimeout(() => {
        const element = document.getElementById(target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } else {
      // Если уже на главной странице, просто прокручиваем к якорю
      const element = document.getElementById(target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-section">
        <h3>SPACE AQUA</h3>
        <p>
          690033, Владивосток, Бородинская улица,<br />
          Бизнес-парк «Румянцево», оф. 104,<br />1 подъезд, 4 этаж
        </p>
        <p>
          <strong>Режим работы</strong>
          <br />с 8:00 по 18:00
        </p>
      </div>
      <div className="footer-section">
        <h3>Компания</h3>
        <ul>
          <li>
            <ScrollLink
              to="about-container"
              smooth={true}
              duration={75}
              className="white-text catalog-link"
              activeClass="active"
              onClick={() => handleLinkClick('about-container')}
            >
              О компании
            </ScrollLink>
          </li>
          <li>
            <ScrollLink
              to="publications-container"
              smooth={true}
              duration={75}
              className="white-text catalog-link"
              activeClass="active"
              onClick={() => handleLinkClick('publications-container')}
            >
              Публикации
            </ScrollLink>
          </li>
        </ul>
      </div>
      <div className="footer-section">
        <h3>Товары</h3>
        <ul>
          <li>
            <ScrollLink
              to="slider"
              smooth={true}
              duration={75}
              onClick={() => handleLinkClick('slider')}
            >
              Категория товаров
            </ScrollLink>
          </li>
        </ul>
      </div>
      <div className="footer-section">
        <div className="information-container">
          <h3>Информация</h3>
          <ul>
            <li><a href="/politics">Политика конфиденциальности</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-section">
        <div className="contacts-container">
          <h3>Контакты:</h3>
          <a href="https://t.me/your_telegram_channel" className="social-link" target="_blank" rel="noopener noreferrer">
            <img src="https://img.icons8.com/?size=100&id=63306&format=png&color=000000" alt="Telegram" width="32" height="32" />
          </a>
        </div>
      </div>
      <div className="footer-info">
        <p>© {new Date().getFullYear()} г.</p>
        <p>Разработчик сайта: Александр Хван, Игорь Калашников</p>
      </div>
    </footer>
  );
};

export default SeparateFooter;