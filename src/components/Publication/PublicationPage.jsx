import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Modal, Spin } from 'antd';
import { toast } from 'react-toastify';
import PublicationForm from './PublicationForm';
import './Publication.css';

// Мемоизация MediaContent
const MediaContent = memo(({ url, userCountry, notifiedUrls, setNotifiedUrls }) => {
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  const isVideoUrl = (url) =>
    url && ['.mp4', '.webm', '.ogg', '.mov'].some(ext => url.toLowerCase().endsWith(ext));

  const isExternalVideoUrl = (url) =>
    url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vk.com/video') || url.includes('rutube.ru'));

  const isYouTubeUrl = (url) =>
    url && (url.includes('youtube.com') || url.includes('youtu.be'));

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (isYouTubeUrl(url)) {
      const videoId = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('vk.com/video')) {
      const videoId = url.match(/video(-?\d+_\d+)/)?.[1];
      return videoId ? `https://vk.com/video?z=video${videoId}` : null;
    }
    if (url.includes('rutube.ru')) {
      const videoId = url.match(/video\/([0-9a-fA-F]+)/)?.[1];
      return videoId ? `https://rutube.ru/play/embed/${videoId}` : null;
    }
    return null;
  };

  useEffect(() => {
    if (!url || isExternalVideoUrl(url)) {
      setMediaLoading(false);
      if (isYouTubeUrl(url) && userCountry === 'RU' && !notifiedUrls.has(url)) {
        setTimeout(() => {
          if (mediaLoading) {
            setNotifiedUrls(prev => new Set(prev).add(url));
            toast.error('YouTube не работает в регионе Россия', { autoClose: 5000 });
          }
        }, 20000);
      }
    } else {
      setMediaLoading(false); // Локальные видео загружаются напрямую
    }
  }, [url, userCountry, notifiedUrls, setNotifiedUrls]);

  const handleMediaLoad = () => {
    setMediaLoading(false);
    setMediaError(null);
  };

  const handleMediaError = () => {
    setMediaError('Не удалось загрузить медиа');
    setMediaLoading(false);
    if (isYouTubeUrl(url) && userCountry === 'RU' && !notifiedUrls.has(url)) {
      setNotifiedUrls(prev => new Set(prev).add(url));
      toast.error('YouTube не работает в регионе Россия', { autoClose: 5000 });
    }
  };

  if (!url) return null;

  return (
    <div className="media-container">
      {mediaLoading && <Spin size="large" style={{ display: 'block', margin: '20px auto' }} />}
      {mediaError && !mediaLoading && (
        <div className="media-error" style={{ color: 'red', textAlign: 'center' }}>{mediaError}</div>
      )}
      {!mediaError && (
        <>
          {isExternalVideoUrl(url) ? (
            <iframe
              src={getEmbedUrl(url)}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ display: mediaLoading ? 'none' : 'block', width: '100%', height: '315px' }}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
            />
          ) : isVideoUrl(url) ? (
            <video
              preload="metadata" // Ленивая загрузка только метаданных
              muted
              playsInline
              controls={false}
              onLoadedMetadata={handleMediaLoad}
              onError={handleMediaError}
              style={{ display: mediaLoading ? 'none' : 'block' }}
              src={url}
            >
              <source src={url} type={`video/${url.split('.').pop()}`} />
            </video>
          ) : (
            <img
              src={url}
              alt="Publication content"
              loading="lazy" // Ленивая загрузка изображений
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              style={{ display: mediaLoading ? 'none' : 'block' }}
            />
          )}
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => prevProps.url === nextProps.url && prevProps.userCountry === nextProps.userCountry);

const PublicationsPage = () => {
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage] = useState(5);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPublication, setEditingPublication] = useState(null);
  const [userCountry, setUserCountry] = useState(null);
  const [notifiedUrls, setNotifiedUrls] = useState(new Set());

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchUserCountry = async () => {
      try {
        const response = await fetch('https://geolocation-db.com/json/');
        const data = await response.json();
        setUserCountry(data.country_code || 'unknown');
      } catch (err) {
        console.error('Ошибка определения страны:', err);
        setUserCountry('unknown');
      }
    };

    const fetchPublications = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('${API_BASE_URL}/api/publications');
        setArticles(response.data);
      } catch (error) {
        setError('Не удалось загрузить публикации.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCountry();
    fetchPublications();
  }, []);

  const handleAddPublication = (newPublication) => {
    setArticles(prev => [newPublication, ...prev]);
    setShowModal(false);
  };

  const handleEditPublication = (publication) => {
    setEditingPublication(publication);
    setShowModal(true);
  };

  const handleUpdatePublication = async (updatedPublication) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/publications/${updatedPublication.id}`, updatedPublication, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticles(prev =>
        prev.map(article => (article.id === updatedPublication.id ? updatedPublication : article))
      );
      setShowModal(false);
      setEditingPublication(null);
    } catch (error) {
      setError('Ошибка при обновлении публикации.');
    }
  };

  const handleDeletePublication = async (publicationId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту публикацию?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/publications/${publicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticles(prev => prev.filter(article => article.id !== publicationId));
    } catch (error) {
      setError('Ошибка при удалении публикации.');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingPublication(null);
  };

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div>Загрузка публикаций...</div>;
  if (error) return <div className="publication-error">{error}</div>;

  return (
    <div className="publications-container">
      <div className="publications-header">
        <h1>Публикации</h1>
        {user && user.category !== 'user' && (
          <button onClick={() => setShowModal(true)} className="add-publication-button">
            Добавить публикацию
          </button>
        )}
      </div>

      <Modal
        title={<span style={{ color: 'black' }}>{editingPublication ? 'Редактировать публикацию' : 'Добавить публикацию'}</span>}
        open={showModal}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        centered
        styles={{
          body: { backgroundColor: '#191f29', color: 'white', padding: '20px' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        }}
      >
        <PublicationForm
          publication={editingPublication}
          onAddPublication={handleAddPublication}
          onUpdatePublication={handleUpdatePublication}
          onCancelEdit={handleModalClose}
        />
      </Modal>

      <section className="publications-content">
        <div className="publications-main">
          {currentArticles.length > 0 ? (
            currentArticles.map(article => (
              <article key={article.id} className="publication-item">
                <MediaContent
                  url={article.image_url}
                  userCountry={userCountry}
                  notifiedUrls={notifiedUrls}
                  setNotifiedUrls={setNotifiedUrls}
                />
                <div className="publication-date">{article.created_at}</div>
                <h2>{article.title}</h2>
                <p>{article.preview}...</p>
                <p>Автор: {article.author}</p>
                <Link to={`/publication/${article.id}`} className="read-more-link" target="_blank">
                  Подробнее
                </Link>
                {user && user.category !== 'user' && (
                  <div className="publication-actions">
                    <button onClick={() => handleEditPublication(article)} className="edit-button">
                      Редактировать
                    </button>
                    <button onClick={() => handleDeletePublication(article.id)} className="delete-button">
                      Удалить
                    </button>
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className="no-publications">Публикаций пока нет.</div>
          )}
        </div>
      </section>

      <div className="pagination">
        {articles.length > articlesPerPage && (
          <ul>
            {Array.from({ length: Math.ceil(articles.length / articlesPerPage) }, (_, i) => (
              <li key={i} className={currentPage === i + 1 ? 'active' : ''}>
                <button onClick={() => paginate(i + 1)}>{i + 1}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PublicationsPage;
