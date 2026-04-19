import React from 'react';
import './about.css';

const IconDescription = ({ iconUrl, description }) => (
  <div className="icon-description">
    <img src={iconUrl} alt="Icon" />
    <p>{description}</p>
  </div>
);

const App = () => {
  const iconDescriptions = [
    { iconUrl: 'https://img.icons8.com/?size=100&id=yvBLuIft6LuV&format=png&color=000000', description: 'Монтируем современную бесшовую систему водоснабжения в любом помещении, которая управляется с единого водяного коллектора.' },
    { iconUrl: 'https://img.icons8.com/?size=100&id=IR9P3Iwhb0tN&format=png&color=000000', description: 'Решим задачи, связанные с проектированием, монтажом и обслуживанием электрических систем.' },
    { iconUrl: 'https://img.icons8.com/?size=100&id=VIIZWNhpAM3w&format=png&color=000000', description: 'Производим подборку и монтаж систем очистки сточных вод, которые функционируют, независимо от центральных систем канализации.' },
    { iconUrl: 'https://img.icons8.com/?size=100&id=mXiQbUJbWqiD&format=png&color=000000', description: 'Подберем оборудование и смонтриуем системы видеонаблюдения, шлагбаумы и любые другие системы и устройства для обеспечения безопасности объекта.' },
  ];

  return (
    <div className="about-container">
      <div className="left-section">
        <h1>О компании</h1>
        <p>Engineering Space — это прогрессивный бренд для людей, где мечты становятся реальность через наши системы!</p>
      </div>
      <div className="right-section">
        {iconDescriptions.map((iconDescription, index) => (
          <IconDescription key={index} {...iconDescription} />
        ))}
      </div>
    </div>
  );
};

export default App;