import React, { useEffect, useState } from "react";
import styles from "./ProgressBar.module.css"; // Подключаем CSS Module

const ProgressBar = ({ currentStep, totalSteps, isFinal, stepSize = "20px", stepColor = "white", activeStepColor = "#27AE60" }) => {
  const [fillWidth, setFillWidth] = useState(0);

  useEffect(() => {
    if (currentStep >= totalSteps - 1) {
      setFillWidth(((totalSteps - 1) / totalSteps) * 100);
    } else {
      setFillWidth((currentStep / totalSteps) * 100);
    }
  }, [currentStep, totalSteps]);

  return (
    <div className={styles.progressBarContainer}>
      <div
        className={`${styles.progressBarFill} ${isFinal ? styles.final : ""}`}
        style={{ width: `${fillWidth}%`, backgroundColor: activeStepColor }} // Используем prop
      />
      <ul className={`${styles.progressbar} ${isFinal ? styles.gather : ""}`}>
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <li
            key={idx}
            className={`${styles.progressbarItem} ${idx <= currentStep ? styles.active : ""}`}
            style={{
              "--step-size": stepSize, // CSS Variable
              "--step-color": stepColor,  // CSS Variable
              "--active-step-color": activeStepColor, // CSS Variable
            }}
          >
            {"Шаг " + (idx + 1)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProgressBar;