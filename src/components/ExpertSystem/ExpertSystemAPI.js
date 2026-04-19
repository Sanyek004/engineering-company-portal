const express = require('express');
const { getRecommendations } = require('./ExpertSystemLogic');
const app = express();

app.use(express.json()); // Для обработки JSON-запросов

// Маршрут для обработки запросов экспертной системы
app.post('/api/expert-system', (req, res) => {
  const input = req.body; // Данные пользователя
  try {
    const recommendations = getRecommendations(input);
    res.json({ recommendation: recommendations });
  } catch (error) {
    console.error('Ошибка при обработке данных:', error);
    res.status(500).json({ error: 'Произошла ошибка. Попробуйте позже.' });
  }
});

// Запуск сервера
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});