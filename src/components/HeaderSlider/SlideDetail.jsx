import React from 'react';
import { useLocation } from 'react-router-dom';
import './SlideDetail.css';

const SlideDetail = () => {
  const location = useLocation();
  const { title, content } = location.state || {};

  return (
    <div className="slide-detail">
      <h1>{title || 'UNDERFINED'}</h1>
      <p>{content || 'UNDERFINED'}</p>
    </div>
  );
};

export default SlideDetail;