import React, { useState } from 'react';
import './AuthForm.css';
import axios from 'axios';
import { Modal } from 'antd';

function AuthForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(true);

  const handleCancel = () => {
    setIsModalVisible(false);
    window.location.href = '/';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password || !secretCode) {
      setError('Пожалуйста, заполните все поля.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('${API_BASE_URL}/api/login', {
        username,
        password,
        secretCode,
      }, { withCredentials: true });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsModalVisible(false);
      onLogin(response.data.user);
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Неверные данные или секретный код.');
        } else if (err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('Ошибка сервера. Попробуйте позже.');
        }
      } else if (err.code === 'ERR_NETWORK') {
        setError('Ошибка сети. Проверьте соединение или настройки CORS.');
      } else {
        setError('Неизвестная ошибка. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Авторизация сотрудников"
      open={isModalVisible}
      onCancel={handleCancel}
      footer={null}
      centered
      width={350}
    >
      {isLoading ? (
        <div>Загрузка...</div>
      ) : (
        <form onSubmit={handleSubmit} className="form-auth">
          <input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="text"
            placeholder="Секретный код"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            required
            className="auth-input"
          />
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-button">
            Войти
          </button>
        </form>
      )}
    </Modal>
  );
}

export default AuthForm;
