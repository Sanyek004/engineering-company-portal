import React from 'react';
import { toast } from 'react-toastify'; 

const Partners = () => {
  const handleClick = () => {
    // Красивое уведомление вместо перехода по ссылке
    toast.info('Форма регистрации партнёров находится в разработке', {
      position: "bottom-right",
      autoClose: 3000,
    });
  };

  return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '50%' }}>
        <h1>Станьте партнёром компании</h1>
      </div>
      <div style={{ width: '50%', borderRadius: '8px' }}>
        <p>
          Более 5000 партнёров уже зарабатывают вместе с нами. С
          высококачественным оборудованием и гарантией на наши системы
          водоочистки вы застрахованы от репутационных и финансовых рисков.
        </p>
        <button onClick={handleClick}>Стать дилером</button>
      </div>
    </div>
  );
};

export default Partners;
