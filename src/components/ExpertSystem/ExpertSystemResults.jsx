import React, { useState, useEffect } from "react";
import styles from "./ExpertSystemResults.module.css";
import { XyzTransitionGroup, XyzTransition } from "@animxyz/react";
import '@animxyz/core';

const ExpertSystemResults = ({ recommendation, onRestart }) => {
  const [displayedRecommendations, setDisplayedRecommendations] = useState([]);
  const [showForm, setShowForm] = useState(false); // Состояние для задержки появления формы

  useEffect(() => {
    // Задержка появления формы
    const formTimeout = setTimeout(() => {
      setShowForm(true);
    }, 500); // Задержка 500 мс (0.5 секунды)

    // Добавление рекомендаций с интервалом
    let i = 0;
    const interval = setInterval(() => {
      if (i < recommendation.length) {
        setDisplayedRecommendations((prev) => [...prev, recommendation[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 200);

    // Очистка тайм-аутов и интервалов
    return () => {
      clearTimeout(formTimeout);
      clearInterval(interval);
    };
  }, [recommendation]);


  return (
    <div className={styles.container}>
      <XyzTransition xyz="fade" appear={true}>
        {showForm && (
          <form className={styles.msform}>
            <fieldset className={styles.fieldset}>
              <h2 className={styles.fsTitle}>Ваши рекомендации</h2>
              <div className={styles.recommendationsContainer}>
                <XyzTransitionGroup
                  xyz="fade-in-up duration-5"
                  appear={true}
                >
                  {displayedRecommendations.map((rec, index) => (
                    <XyzTransition key={index} xyz="fade-in-up duration-5">
                      <p className={styles.recommendationText}>
                        {rec}
                      </p>
                    </XyzTransition>
                  ))}
                </XyzTransitionGroup>
              </div>
              <input
                type="button"
                name="restart"
                className={styles.actionButton}
                value="Заново"
                onClick={onRestart}
              />
            </fieldset>
          </form>
        )}
      </XyzTransition>
    </div>
  );
};

export default ExpertSystemResults;