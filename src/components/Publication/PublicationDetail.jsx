import React, { useState, useEffect, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Spin, Modal } from 'antd';
import { toast } from 'react-toastify';
import './PublicationDetail.css';

// Мемоизация MediaContent для предотвращения лишних рендеров
const MediaContent = memo(({ url, userCountry, notifiedUrls, setNotifiedUrls }) => {
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setMediaLoading(false); // Локальные видео загружаются напрямую через <video>
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

  const handleVideoClick = () => {
    if ((isVideoUrl(url) || isExternalVideoUrl(url)) && !mediaError) {
      setIsModalOpen(true);
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
            <>
              <div className="video-wrapper">
                <iframe
                  src={getEmbedUrl(url)}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="video-iframe"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                  onClick={handleVideoClick}
                />
              </div>
              <Modal
                title="Видео"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width="90%"
                style={{ maxWidth: '800px' }}
                centered
              >
                <div className="video-wrapper">
                  <iframe
                    src={getEmbedUrl(url)}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="video-iframe"
                  />
                </div>
              </Modal>
            </>
          ) : isVideoUrl(url) ? (
            <>
              <div className="video-wrapper">
                <video
                  preload="metadata" // Ленивая загрузка метаданных
                  muted
                  playsInline
                  controls={false}
                  onLoadedMetadata={handleMediaLoad}
                  onError={handleMediaError}
                  onClick={handleVideoClick}
                  className="video-element"
                  src={url}
                >
                  <source src={url} type={`video/${url.split('.').pop()}`} />
                </video>
              </div>
              <Modal
                title="Видео"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width="90%"
                style={{ maxWidth: '800px' }}
                centered
              >
                <div className="video-wrapper">
                  <video
                    controls
                    className="video-element"
                    src={url}
                  >
                    <source src={url} type={`video/${url.split('.').pop()}`} />
                  </video>
                </div>
              </Modal>
            </>
          ) : (
            <img
              src={url}
              alt="Publication content"
              loading="lazy" // Ленивая загрузка изображений
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              style={{ display: mediaLoading ? 'none' : 'block', width: '100%', height: 'auto' }}
            />
          )}
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => prevProps.url === nextProps.url && prevProps.userCountry === nextProps.userCountry);

const PublicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCountry, setUserCountry] = useState(null);
  const [notifiedUrls, setNotifiedUrls] = useState(new Set());

  useEffect(() => {
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

    const fetchPublication = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/publications/${id}`);
        setPublication(response.data);
      } catch (err) {
        setError('Не удалось загрузить публикацию.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCountry();
    fetchPublication();
  }, [id]);

  if (loading) return <div>Загрузка публикации...</div>;
  if (error) return <div className="publication-error">{error}</div>;
  if (!publication) return <div>Публикация не найдена.</div>;

  return (
    <div className="publication-detail-container">
      <article className="publication-detail">
        <h1 className="publication-title">{publication.title}</h1>
        <div className="publication-meta">
          <span>Автор: {publication.author}</span> | <span>{publication.created_at}</span>
        </div>
        <MediaContent
          url={publication.image_url}
          userCountry={userCountry}
          notifiedUrls={notifiedUrls}
          setNotifiedUrls={setNotifiedUrls}
        />
        <p className="publication-content">{publication.content}</p>
        <button className="back-button" onClick={() => navigate('/publications')}>
          Назад к публикациям
        </button>
      </article>
    </div>
  );
};

export default PublicationDetail;