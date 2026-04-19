import React, { useState, useEffect } from 'react';
import { Link } from 'react-scroll';
import { Link as RouterLink } from 'react-router-dom';
import './HomeHeader.css';
import ContactInfo from './ContactInfo';
import logoImage from '../../images/Engineering space.svg';

const Header = () => {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.reload();
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="header">
            <div className="header-top">
                <div className="logo">
                    <img src={logoImage} alt="SPACE AQUA" className="logo-image" />
                </div>
                <button className="hamburger" onClick={toggleMenu}>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
                <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
                    <ul>
                        <li>
                            <Link 
                                to="slider" 
                                smooth={true} 
                                duration={75} 
                                className="white-text catalog-link" 
                                activeClass="active"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Категория товаров
                            </Link>
                        </li>
                        <li>
                            <RouterLink 
                                to="/contacts" 
                                className="white-text catalog-link"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Контакты
                            </RouterLink>
                        </li>
                        <li>
                            <RouterLink 
                                to="/publications" 
                                className="white-text catalog-link"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Публикации
                            </RouterLink>
                        </li>
                        <li>
                            <Link 
                                to="about-container" 
                                smooth={true} 
                                duration={75} 
                                className="white-text catalog-link" 
                                activeClass="active"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                О компании
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div className="auth-container">
                    <ContactInfo />
                    {user && (
                        <div className="profile-info">
                            <span>Профиль: {user.username}</span>
                            <button onClick={handleLogout} className="logout-button">
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
                <div className="contact-info">
                    <a href="tel:+7800" className="phone-number">
                        +7 (800) ***-**-**
                    </a>
                    <a href="mailto:test@yandex.ru" className="email">
                        test@yandex.ru
                    </a>
                </div>
            </div>
        </header>
    );
};

export default Header;
