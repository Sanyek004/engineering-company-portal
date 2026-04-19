# Engineering Company Web Portal & Expert System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)

A full-stack web application developed for an engineering and water filtration company. The platform serves as a corporate portal, featuring a custom **Expert System** for equipment selection and automated lead generation integrated with the **Telegram API**.

*Read this in [Russian](./README_ru.md).*

## 🚀 Key Features

*   **Interactive Expert System:** A multi-step questionnaire that analyzes user needs and provides personalized equipment recommendations.
*   **Telegram CRM Integration:** The "Request a Call" module automatically validates user input and sends instant notifications to a closed Telegram channel for managers.
*   **Content Management System (CMS):** A secure admin panel for creating, editing, and deleting publications and promotions.
*   **Secure Authentication:** JWT-based authorization for the admin panel with hashed passwords (bcrypt).
*   **Responsive Design:** Fully adaptive UI built with React, CSS Modules, and Ant Design.

## 🛠 Tech Stack

**Frontend:**
*   React 18 (Vite)
*   React Router DOM
*   Redux Toolkit
*   Ant Design & Styled Components
*   Axios

**Backend:**
*   Node.js & Express.js
*   MySQL (mysql2/promise)
*   JWT (JSON Web Tokens)
*   Node Telegram Bot API

**Architecture & Design:**
*   UML & DFD Modeling
*   REST API

## ⚙️ Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sanyek004/engineering-company-portal.git
   cd engineering-company-portal
   ```

2. **Install dependencies (Frontend & Backend):**
   ```bash
   npm install
   # If you have a separate backend folder, run npm install there too
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and configure the following variables:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=users

   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id

   # JWT & API
   JWT_SECRET=your_secret_key
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. **Run the application:**
   ```bash
   # Start the frontend (Vite)
   npm run dev

   # Start the backend server (Node.js)
   npm run server
   ```

## 📝 Disclaimer
This project was developed as a graduation thesis/concept for portfolio purposes.
