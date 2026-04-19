import React, { useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Spin } from "antd"; // Добавляем Spin из antd
import ProgressBar from "./ProgressBar";
import "./MultiStepExpertForm.css";

// Локальный компонент Loader
const Loader = ({ subject }) => {
  return (
    <div className="loader-container">
      <Spin tip={subject} size="large" />
    </div>
  );
};

const MultiStepExpertForm = ({
  questions,
  answers,
  onChangeAnswer,
  onSubmit,
  error,
  isLoading,
  isFinal,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState("next");

  // Если isLoading === true, показываем Loader вместо формы
  if (isLoading) {
    return <Loader subject="Загрузка формы..." />;
  }

  return (
    <form id="msform" onSubmit={onSubmit}>
      <ProgressBar
        currentStep={currentStep}
        totalSteps={questions.length}
        isFinal={isFinal}
        stepSize="35px"
        stepColor="white"
        activeStepColor="#27ae60"
      />
      <TransitionGroup>
        <CSSTransition
          key={currentStep} // Ключ обязателен для корректной анимации
          classNames={direction === "next" ? "next" : "prev"}
          timeout={800}
        >
          <fieldset>
            <h2 className="fs-title">{questions[currentStep].question}</h2>
            <h3 className="fs-subtitle">{`Шаг ${currentStep + 1} из ${questions.length}`}</h3>
            <div className="options-container">
              {questions[currentStep].options.map((option) => (
                <label key={option.value} className="option-label">
                  <input
                    type="radio"
                    name={`question-${questions[currentStep].id}`}
                    value={option.value}
                    checked={answers[questions[currentStep].id] === option.value}
                    onChange={() => onChangeAnswer(questions[currentStep].id, option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <div className="button-group">
              {currentStep > 0 && (
                <input
                  type="button"
                  name="previous"
                  className="previous action-button"
                  value="Назад"
                  onClick={(e) => {
                    e.preventDefault();
                    setDirection("prev");
                    setCurrentStep(currentStep - 1);
                  }}
                />
              )}
              {currentStep < questions.length - 1 && (
                <input
                  type="button"
                  name="next"
                  className="next action-button"
                  value="Далее"
                  onClick={(e) => {
                    e.preventDefault();
                    setDirection("next");
                    setCurrentStep(currentStep + 1);
                  }}
                />
              )}
              {currentStep === questions.length - 1 && (
                <input
                  type="submit"
                  name="submit"
                  className="submit action-button"
                  value="Завершить"
                />
              )}
            </div>
            {error && <div className="error">{error}</div>}
          </fieldset>
        </CSSTransition>
      </TransitionGroup>
    </form>
  );
};

export default MultiStepExpertForm;