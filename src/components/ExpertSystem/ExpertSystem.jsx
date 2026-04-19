import React, { useState } from "react";
import { CSSTransition } from "react-transition-group";
import CategorySelection from "./CategorySelection";
import MultiStepExpertForm from "./MultiStepExpertForm";
import ExpertSystemResults from "./ExpertSystemResults";
import { Spin } from "antd"; 
import knowledgeBase from "./knowledgeBase.json";
import "./ExpertSystem.css";

// Локальный компонент Loader
const Loader = ({ subject }) => {
    return (
      <div className="loader-container">
        <Spin tip={`${subject} is loading`} size="large" />
      </div>
    );
  };

const ExpertSystem = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [answers, setAnswers] = useState({});
    const [recommendation, setRecommendation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const categories = {
        windows: {
            name: "Выбор окон",
            questions: [
                { id: 1, question: "Какой тип окон вы предпочитаете?", options: [{ label: "Пластиковые", value: "plastik" }, { label: "Деревянные", value: "derevo" }, { label: "Алюминиевые", value: "aluminum" },], },
                { id: 2, question: "Какой бюджет вы планируете?", options: [{ label: "До 10000 руб.", value: 10000 }, { label: "10000 - 20000 руб.", value: 20000 }, { label: "Более 20000 руб.", value: 25000 },], },
                { id: 3, question: "Нужны ли энергосберегающие окна?", options: [{ label: "Да", value: "yes" }, { label: "Нет", value: "no" },], },
            ],
        },
        engineering: {
            name: "Проектирование инженерных систем",
            questions: [
                { id: 1, question: "Какой тип инженерной системы вас интересует?", options: [{ label: "Отопление", value: "heating" }, { label: "Вентиляция", value: "ventilation" }, { label: "Кондиционирование", value: "cooling" },], },
                { id: 2, question: "Какой бюджет выделен на проект?", options: [{ label: "До 50000 руб.", value: 50000 }, { label: "50000 - 100000 руб.", value: 100000 }, { label: "Более 100000 руб.", value: 150000 },], },
                { id: 3, question: "Какая площадь помещения (м²)?", options: [{ label: "До 50 м²", value: 50 }, { label: "50-150 м²", value: 150 }, { label: "Более 150 м²", value: 200 },], },
            ],
        },
    };

    const handleSelectCategory = (categoryKey) => {
      setShowForm(false);      // Скрываем форму (если была видна)
      setRecommendation(null); // Сбрасываем рекомендации
      setShowResults(false);   // Скрываем результаты

      setTimeout(() => {
          setSelectedCategory(categoryKey);
          setAnswers({});
          setError("");
          setShowForm(true);   // Показываем форму (с анимацией)
      }, 100); // Задержка для анимации исчезновения кнопок
  };

    const handleChangeAnswer = (questionId, answerValue) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answerValue }));
        setError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedCategory) {
            setError("Пожалуйста, выберите категорию.");
            return;
        }

        const questions = categories[selectedCategory]?.questions;
        if (!questions) {
            setError("Не удалось найти вопросы для выбранной категории.");
            return;
        }

        for (let q of questions) {
            if (answers[q.id] === undefined) {
                setError("Пожалуйста, ответьте на все вопросы.");
                return;
            }
        }

        setIsLoading(true);
        setError("");
        setShowForm(false); // Скрываем форму (запускаем анимацию исчезновения)

        // Задержка для анимации *исчезновения* формы
        setTimeout(() => {
            // Имитация задержки запроса
            setTimeout(() => {
                const relevantEntries = knowledgeBase.filter(
                    (entry) => entry.category === selectedCategory
                );

                const results = relevantEntries
                .filter((entry) => {
                    return Object.entries(entry.conditions).every(([qId, condition]) => {
                        const userAnswer = answers[qId];

                        if (Array.isArray(condition)) {
                            return condition.includes(userAnswer);
                        }

                        if (typeof condition === "object" && condition !== null) {
                            const numericAnswer = Number(userAnswer);
                            if (condition.min !== undefined && numericAnswer < condition.min) {
                                return false;
                            }
                            if (condition.max !== undefined && numericAnswer > condition.max) {
                                return false;
                            }
                            return true;
                        }
                        return userAnswer === condition;
                    });
                })
                .map((entry) => entry.recommendations)
                .flat();
            setRecommendation(results.length > 0 ? results : ["Рекомендации не найдены."]);

            setIsLoading(false); // Прячем спиннер
            setShowResults(true);  // Показываем результаты (с анимацией)
            }, 500);  
        }, 300); // Задержка для анимации исчезновения формы (равна timeout в CSSTransition)
    };

    const handleRestart = () => {
      setSelectedCategory(null);
      setAnswers({});
      setRecommendation(null);
      setError("");
      setShowForm(false); // Сбрасываем
      setShowResults(false); //Сбрасываем
  };

  return (
    <div className="expert-system-container">
        <h1>Экспертная система</h1>

        <CSSTransition
            in={!selectedCategory}
            timeout={300}
            classNames="fade"
            unmountOnExit
        >
            <CategorySelection onSelectCategory={handleSelectCategory} />
        </CSSTransition>

        <CSSTransition
            in={showForm}
            timeout={300}
            classNames="fade"
            unmountOnExit
        >
            <div>
                {selectedCategory && (
                    isLoading ? (
                        <Loader subject={categories[selectedCategory].name} />
                    ) : (
                        <MultiStepExpertForm
                            questions={categories[selectedCategory].questions}
                            answers={answers}
                            onChangeAnswer={handleChangeAnswer}
                            onSubmit={handleSubmit}
                            error={error}
                            isFinal={false}
                        />
                    )
                )}
            </div>
        </CSSTransition>

        <CSSTransition
            in={showResults}
            timeout={300}
            classNames="fade"
            unmountOnExit
        >
            <ExpertSystemResults
                recommendation={recommendation}
                onRestart={handleRestart}
            />
        </CSSTransition>
    </div>
);
};

export default ExpertSystem;