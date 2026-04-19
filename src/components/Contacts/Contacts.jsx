import React, { useState, useEffect } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps'; // Исправленный импорт

const CompanyContact = ({ phone, email, telegram, address, coordinates }) => {
  const [mapState, setMapState] = useState({ center: [55.75, 37.57], zoom: 9 });

  useEffect(() => {
    if (coordinates) {
      setMapState({ center: coordinates, zoom: 15 });
    }
  }, [coordinates]);

  return (
    <div className="contact-container" style={{ border: '1px solid white', padding: '10px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
      <h2 style={{ color: 'white' }}>Контактная информация</h2>
      <p style={{ color: 'white' }}><strong>Телефон:</strong> {phone}</p>
      <p style={{ color: 'white' }}><strong>Email:</strong> <a href={`mailto:${email}`} style={{ color: 'white' }}>{email}</a></p>
      <p style={{ color: 'white' }}><strong>Telegram:</strong> <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>{telegram}</a></p>
      <p style={{ color: 'white' }}><strong>Адрес:</strong> {address}</p>

      {coordinates && (
        <YMaps query={{ apikey: import.meta.env.VITE_YANDEX_MAPS_KEY  }}> 
          <Map state={mapState} width="100%" height="300px">
            <Placemark geometry={coordinates} />
          </Map>
        </YMaps>
      )}
      {!coordinates && <p style={{ color: 'white' }}>Геометка недоступна.</p>}
    </div>
  );
};



const App = () => {
    const contactData = {
        phone: "+7 (495) 555-12-34",
        email: "info@company.com",
        telegram: "company_official",  //  Имя пользователя в Telegram (без @)
        address: "г.Владивосток, Бородинская улица, Бизнес-парк «Румянцево», оф. 104, 1 подъезд, 4 этаж",
        coordinates: [55.633744, 37.442990]  
    };

    return (
        <div style={{ backgroundColor: '#333', padding: '20px' }}>
            <CompanyContact {...contactData} />
        </div>
    );
};

export default App;
