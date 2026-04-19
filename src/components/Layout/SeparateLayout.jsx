import React from 'react';
import SeparateHeader from '../Header/SeparateHeader';
import SeparateFooter from '../Footer/SeparateFooter';
import './HomeLayout.css';

const SeparateLayout = ({ children }) => {

  return (
    <div className="site-container">
      <SeparateHeader />
      <main className="main-content">{children}</main>
      <SeparateFooter />
    </div>
  );
};

export default SeparateLayout;