const knowledgeBase = require('./knowledgeBase.json');

/**
 * Функция для получения рекомендаций на основе пользовательского ввода.
 * @param {Object} input - Вводимые данные пользователя.
 * @param {number} input.area - Площадь помещения.
 * @param {number} input.budget - Бюджет.
 * @param {string} input.climate - Климат.
 * @returns {Array<string>} - Список рекомендаций или сообщение об отсутствии решений.
 */
function getRecommendations(input) {
  const { area, budget, climate } = input;

  // Поиск соответствующих рекомендаций в базе знаний
  const results = knowledgeBase
    .filter((item) => {
      const conditions = item.conditions;
      return (
        area >= conditions.min_area &&
        budget <= conditions.max_budget &&
        climate === conditions.climate
      );
    })
    .map((item) => item.recommendations)
    .flat(); // Объединение рекомендаций в один массив

  // Если нет результатов, возвращаем сообщение
  return results.length > 0
    ? results
    : ['К сожалению, подходящих решений не найдено.'];
}

module.exports = { getRecommendations };