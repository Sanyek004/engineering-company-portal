import React from "react";
import "./ExpertSystemFormMulti.css";

const ExpertSystemFormMulti = ({ questions, answers, onChangeAnswer, onSubmit, error }) => {
  return (
    <form className="expert-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {questions.map((q) => (
        <div key={q.id} className="form-group">
          <label className="question-label">{q.question}</label>
          <div className="options">
            {q.options.map((option) => (
              <label key={option.value} className="option-label">
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  value={option.value}
                  checked={answers[q.id] === option.value}
                  onChange={() => onChangeAnswer(q.id, option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      ))}
      {error && <div className="error">{error}</div>}
      <button type="submit" className="submit-button">Получить рекомендацию</button>
    </form>
  );
};

export default ExpertSystemFormMulti;
