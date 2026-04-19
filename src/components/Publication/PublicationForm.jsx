import React, { useState, useEffect } from 'react'; // Добавлен useEffect
import axios from 'axios';

const PublicationForm = ({ onAddPublication, publication, onUpdatePublication, onCancelEdit }) => { //Изменён
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Добавлено состояние режима редактирования

  // Добавленный useEffect для установки значений полей при редактировании
    useEffect(() => {
        if(publication) {
            setTitle(publication.title);
            setContent(publication.content);
            setImageUrl(publication.image_url);
            setIsEditMode(true);
        } else {
            // Сброс формы
            setTitle('');
            setContent('');
            setImageUrl('');
            setMediaFile(null);
            setIsEditMode(false);
        }
    }, [publication]);

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setMediaFile(file);
      }
  };

    const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!title || !content) {
        setError('Пожалуйста, заполните заголовок и содержание.');
        setIsLoading(false);
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        setError('Вы не авторизованы.');
        setIsLoading(false);
        return;
    }

    let uploadedMediaUrl = imageUrl;
    if (mediaFile) {
        try {
            const formData = new FormData();
            formData.append('media', mediaFile);
            const uploadResponse = await axios.post('http://localhost:5000/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            uploadedMediaUrl = uploadResponse.data.fileUrl;
        } catch (uploadError) {
            setError('Ошибка при загрузке файла.');
            setIsLoading(false);
            return;
        }
    }
    try {
        if(isEditMode){ //Если режим редактирования
            const response = await axios.put(`http://localhost:5000/api/publications/${publication.id}`, {
                title,
                content,
                image_url: uploadedMediaUrl,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            onUpdatePublication(response.data);
            setSuccess('Публикация успешно обновлена!');

        } else { //Если режим добавления
              const response = await axios.post('http://localhost:5000/api/publications', {
                title,
                content,
                image_url: uploadedMediaUrl,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            onAddPublication(response.data);
            setSuccess('Публикация успешно добавлена!');
        }

        //Сброс формы
        setTitle('');
        setContent('');
        setImageUrl('');
        setMediaFile(null);


    } catch (error) {
        console.error('Ошибка при создании/редактировании публикации:', error); // ВСЕГДА ЛОГИРУЙТЕ ПОЛНУЮ ОШИБКУ
  
         // Более информативное сообщение об ошибке:
         let errorMessage = 'Произошла неизвестная ошибка.'; // Сообщение по умолчанию
  
         if (error.response) {
             // Сервер ответил с кодом ошибки (4xx, 5xx)
             errorMessage = error.response.data.error || `Ошибка сервера: ${error.response.status}`;
         } else if (error.request) {
             // Запрос был сделан, но ответ не получен (сетевая проблема)
             errorMessage = 'Не удалось подключиться к серверу.';
         } // Иначе - ошибка настройки запроса, но это менее вероятно
  
         setError(errorMessage); // Устанавливаем *информативное* сообщение
    } finally {
        setIsLoading(false);
    }
};

const handleCancel = () => { //Добавлена функция
    onCancelEdit();  // Вызываем переданный callback
    setIsEditMode(false);  // Выходим из режима редактирования
};


  return (
    <div className="publication-form">
      {isLoading ? (
        <div>Публикуется...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="publication-error">{error}</div>}
          {success && <div className="publication-success">{success}</div>}
          <div>
            <label htmlFor="title">Заголовок:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="content">Содержание:</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="imageUrl">URL изображения (необязательно):</label>
            <input
              type="text"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="mediaFile">Загрузить медиа:</label>
            <input
              type="file"
              id="mediaFile"
              onChange={handleFileChange}
              accept="image/*, video/*, .gif"
            />
          </div>
          <button type="submit">{isEditMode ? 'Сохранить изменения' : 'Опубликовать'}</button>
          {isEditMode && <button type="button" onClick={handleCancel}>Отмена</button>}
        </form>
      )}
    </div>
  );
};

export default PublicationForm;