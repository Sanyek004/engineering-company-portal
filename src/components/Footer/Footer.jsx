// Footer.js
import React from 'react';
import { Link } from 'react-scroll';
import './Footer.css';

const Footer = () => {
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
          <Link to="about-container" smooth={true} duration={75} className="white-text catalog-link" activeClass="active">О компании</Link>
          <Link to="publications-container" smooth={true} duration={75} className="white-text catalog-link" activeClass="active">Публикации</Link>
        </ul>
      </div>
      <div className="footer-section">
        <h3>Товары</h3>
        <ul>
        <Link to="slider" smooth={true} duration={75}>Категория товаров</Link>
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
        <p>&copy; {new Date().getFullYear()} г.</p>
        <p>Разработчик сайта: Александр Хван</p>
      </div>
    </footer>
  );
};

export default Footer;
