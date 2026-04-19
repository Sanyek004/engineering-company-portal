# Веб-портал и Экспертная система для инженерной компании

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)

Full-stack веб-приложение, разработанное для компании, специализирующейся на инженерных системах и водоочистке. Платформа включает в себя **Экспертную систему** для автоматического подбора оборудования и систему сбора лидов с моментальной отправкой заявок через **Telegram API**.

*Read this in [English](./README.md).*

## 🚀 Основной функционал

*   **Интерактивная экспертная система:** Пошаговый опросник, который анализирует ответы пользователя и выдает персонализированные рекомендации по подбору услуг и оборудования.
*   **Интеграция с Telegram (CRM):** Модуль «Обратный звонок» валидирует данные клиента и мгновенно отправляет уведомление в закрытый Telegram-канал менеджеров.
*   **Система управления контентом (CMS):** Защищенная административная панель для публикации новостей, управления акциями и контентом сайта.
*   **Безопасная авторизация:** Защита админ-панели с помощью JWT-токенов и хэширования паролей (bcrypt).
*   **Адаптивный дизайн:** Современный UI, корректно работающий на мобильных устройствах, планшетах и десктопах.

## 🛠 Стек технологий

**Frontend:**
*   React 18 (Сборщик Vite)
*   React Router DOM (Маршрутизация)
*   Redux Toolkit (Управление состоянием)
*   Ant Design & Styled Components (UI компоненты и стилизация)
*   Axios (HTTP запросы)

**Backend:**
*   Node.js & Express.js
*   MySQL (Библиотека mysql2/promise)
*   JWT (JSON Web Tokens)
*   Node Telegram Bot API

**Проектирование:**
*   UML-диаграммы (Use Case, Sequence, Class diagrams)
*   DFD (Анализ потоков данных)

## ⚙️ Локальный запуск

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/Sanyek004/engineering-company-portal.git
   cd engineering-company-portal
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройка переменных окружения:**
   Создайте файл `.env` в корне проекта и добавьте следующие ключи:
   ```env
   # База данных
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=ваш_пароль
   DB_NAME=users

   # Telegram Bot
   TELEGRAM_BOT_TOKEN=токен_вашего_бота
   TELEGRAM_CHAT_ID=id_вашего_чата

   # Настройки API и Безопасности
   JWT_SECRET=ваш_секретный_ключ
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. **Запуск проекта:**
   ```bash
   # Запуск клиентской части (Vite)
   npm run dev

   # Запуск сервера (Node.js)
   npm run server
   ```

## 📝 Примечание
Данный проект был разработан в рамках дипломной работы (концепт) и публикуется в качестве портфолио.
