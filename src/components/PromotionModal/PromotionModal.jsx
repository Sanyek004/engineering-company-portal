import React from 'react';
import './PromotionModal.css';

const PromotionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Фантазийная акция</h2>
        <p>Описание фантазийной акции. Здесь можно разместить любую информацию о текущей акции.</p>
        <button onClick={onClose} className="modal-close-button">Закрыть</button>
      </div>
    </div>
  );
};

export default PromotionModal;