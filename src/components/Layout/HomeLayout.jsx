import React from 'react';
import HomeHeader from '../Header/HomeHeader';
import Footer from '../Footer/Footer';
import './HomeLayout.css';

const HomeLayout = ({ children }) => {

  return (
    <div className="site-container">
      <HomeHeader />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

export default HomeLayout;