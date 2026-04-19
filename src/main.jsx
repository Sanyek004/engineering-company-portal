import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { reducer as testReducer } from "./store/testSlice";
import { reducer as testNumberDecrement } from "./store/testNumberDEcrement";
import PublicationPage from "./components/Publication/PublicationPage";
import PublicationDetail from "./components/Publication/PublicationDetail";
import Contacts from "./components/Contacts/Contacts";
import Slider from "./components/Slider/Slider";
import HeaderSlider from "./components/HeaderSlider/HeaderSlider";
import Gallery from "./components/Gallery/Gallery";
import HeaderLogotext from "./components/HeaderLogotext/HeaderLogotext";
import Partners from "./components/Partners/Partners";
import About from "./components/About/About";
import WaterFiltrationSystem from "./components/WaterFiltrationSystem/WaterFiltrationSystem";
import ProductSlider from "./components/ProductSlider/ProductSlider";
import ExpertSystem from "./components/ExpertSystem/ExpertSystem";
import 'antd/dist/reset.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeLayout from "./components/Layout/HomeLayout"; 
import SeparateLayout from "./components/Layout/SeparateLayout"; 
import AuthPage from "./components/AuthPage/AuthPage";
import Politics from "./components/Politics/Politics";
import CookieConsent from "./components/CookieConsent/CookieConsent"; 
import SlideDetail from "./components/HeaderSlider/SlideDetail";
import { ToastContainer } from 'react-toastify'; // Импорт ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Импорт стилей Toastify

const store = configureStore({
  reducer: {
    test: testReducer,
    number: testNumberDecrement,
  },
});

const HomePage = () => (
  <>
    <HeaderSlider />
    <div id="slider">
      <Slider />
    </div>
    <Gallery />
    <HeaderLogotext />
    <Partners />
    <div id="about-container">
      <About />
    </div>
    <div id="product-slider">
      <ProductSlider
        products={[
          {
            imageUrl: 'https://spaceaqua.ru/upload/resize_webp/iblock/d39/253_253_140cd750bba9870f18aada2478b24840a/ige1u96u2tvmcgi6qqf6cfry2rl9hg38.webp',
            altText: 'Oxidizer SCA19 SpaceAqua',
            title: 'Oxidizer SCA19 SpaceAqua',
            price: '99 999',
            available: true,
          },
          {
            imageUrl: 'https://spaceaqua.ru/upload/resize_webp/iblock/ea6/253_253_140cd750bba9870f18aada2478b24840a/5fakyfbffgae0z60ltdf4e1l7e691rdw.webp',
            altText: 'SpaceAqua VKX 1500LP SCA19',
            title: 'SpaceAqua VKX 1500LP SCA19',
            price: '296 280',
            available: true,
          },
          {
            imageUrl: 'https://spaceaqua.ru/upload/resize_webp/iblock/268/253_253_140cd750bba9870f18aada2478b24840a/y190ii0p3hgzzi16ag0tmp37bhbdj2k2.webp',
            altText: 'SpaceAqua NKX 1000 SCA19 F',
            title: 'SpaceAqua NKX 1000 SCA19 F',
            price: '175 202',
            available: true,
          },
          {
            imageUrl: 'https://spaceaqua.ru/upload/resize_webp/iblock/e7b/253_253_140cd750bba9870f18aada2478b24840a/pgw2h1ui1ydx51gzqploa35hqqo0csdv.webp',
            altText: 'SpaceAqua NK 2000OD SCA19',
            title: 'SpaceAqua NK 2000OD SCA19',
            price: '252 917',
            available: true,
          },
          {
            imageUrl: 'https://spaceaqua.ru/upload/resize_webp/iblock/908/253_253_140cd750bba9870f18aada2478b24840a/1pfhf5m1dxh4h4y5trluoumtetiwqbjn.webp',
            altText: 'SpaceAqua NK 2000OD SCA19',
            title: 'SpaceAqua NK 2000OD SCA19',
            price: '250 959',
            available: true,
          },
          {
            imageUrl: 'https://spaceaqua.ru/upload/resize_webp/iblock/6fe/253_253_140cd750bba9870f18aada2478b24840a/97m0pjvzdaivzcrwoodt5na48acc0rd2.webp',
            altText: 'SpaceAqua NK 2000OD SCA19',
            title: 'SpaceAqua NK 2000OD SCA19',
            price: '234 647',
            available: true,
          },
        ]}
      />
    </div>
    <WaterFiltrationSystem />
    <ExpertSystem />
  </>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeLayout><HomePage /></HomeLayout>} />
          <Route path="/slide-detail/:id" element={<SeparateLayout><SlideDetail /></SeparateLayout>} />
          <Route path="/publications" element={<SeparateLayout><PublicationPage /></SeparateLayout>} />
          <Route path="/publication/:id" element={<SeparateLayout><PublicationDetail /></SeparateLayout>} />
          <Route path="/contacts" element={<SeparateLayout><Contacts /></SeparateLayout>} />
          <Route 
            path="/secret-login" 
            element={<SeparateLayout><AuthPage onLogin={(user) => {}} /></SeparateLayout>} 
          />
          <Route path="/politics" element={<SeparateLayout><Politics /></SeparateLayout>} />                 
          <Route path="*" element={<HomeLayout><div>404 Not Found</div></HomeLayout>} />
        </Routes>
        <CookieConsent /> 
        <ToastContainer // Добавляем ToastContainer на глобальный уровень
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);