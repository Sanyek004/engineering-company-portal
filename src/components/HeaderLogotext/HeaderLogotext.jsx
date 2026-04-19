import React from 'react';

const App = () => {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'row', // По умолчанию для десктопа
    alignItems: 'center',
    padding: '20px',
  };

  const logoStyles = {
    width: 500,
    height: 500,
  };

  const contentStyles = {
    marginLeft: 20,
  };

  const titleStyles = {
    fontSize: '2rem',
    margin: '0 0 10px 0',
  };

  const descriptionStyles = {
    fontSize: '1rem',
    margin: 0,
  };

  // Медиа-запросы через объект стилей
  const mobileStyles = {
    '@media (max-width: 767px)': {
      containerStyles: {
        ...containerStyles,
        flexDirection: 'column', // Вертикальное расположение для мобильных
        padding: '10px',
      },
      logoStyles: {
        ...logoStyles,
        width: '100%', // Адаптивная ширина логотипа
        height: 'auto',
        maxWidth: 300, // Ограничение для маленьких экранов
      },
      contentStyles: {
        marginLeft: 0,
        marginTop: 20, // Отступ сверху для контента после логотипа
      },
      titleStyles: {
        ...titleStyles,
        fontSize: '1.5rem', // Уменьшаем заголовок для мобильных
      },
      descriptionStyles: {
        ...descriptionStyles,
        fontSize: '0.9rem', // Уменьшаем текст для мобильных
      },
    },
    '@media (min-width: 768px) and (max-width: 1023px)': {
      containerStyles: {
        ...containerStyles,
        flexDirection: 'row', // Горизонтальное расположение для планшетов
        padding: '15px',
      },
      logoStyles: {
        ...logoStyles,
        width: 400, // Уменьшаем логотип для планшетов
        height: 400,
      },
      contentStyles: {
        ...contentStyles,
        marginLeft: 15,
        maxWidth: '50%', // Ограничиваем ширину контента
      },
      titleStyles: {
        ...titleStyles,
        fontSize: '1.8rem', // Чуть меньше заголовок для планшетов
      },
      descriptionStyles: {
        ...descriptionStyles,
        fontSize: '0.95rem', // Чуть меньше текст для планшетов
      },
    },
  };

  return (
    <div style={{ ...containerStyles, ...mobileStyles['@media (max-width: 767px)']?.containerStyles }}>
      <img
        src="https://spaceaqua.ru/upload/medialibrary/214/xs2easvl7p9jh8ogss4h1jmo1sucwus8r.png.pagespeed.ic.fkcCbP21BJ.png"
        alt="Go Screen"
        style={{ ...logoStyles, ...mobileStyles['@media (max-width: 767px)']?.logoStyles }}
      />
      <div style={{ ...contentStyles, ...mobileStyles['@media (max-width: 767px)']?.contentStyles }}>
        <h1 style={{ ...titleStyles, ...mobileStyles['@media (max-width: 767px)']?.titleStyles }}>
          Экологическое движение SpaceAqua Go Green
        </h1>
        <p style={{ ...descriptionStyles, ...mobileStyles['@media (max-width: 767px)']?.descriptionStyles }}>
          Сейчас, когда проблемы экологии стоят очень остро, мы объединяемся со всеми небезразличными людьми, чтобы сохранить наш мир — мир зелёных деревьев, синего неба и чистой воды! Покупая наши продукты, вы не только обеспечиваете себя качественной водой с превосходным вкусом, но и помогаете экологии, сокращая использование одноразового пластика.
        </p>
      </div>
    </div>
  );
};

export default App;