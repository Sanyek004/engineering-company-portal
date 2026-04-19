import React from "react";
import "./CategorySelection.css";

const CategorySelection = ({ onSelectCategory }) => {
  return (
    <div className="category-selection-container">
      <div className="category-selection">
        <h2>Выберите категорию запроса</h2>
        <div className="buttons-container">
          <button className="action-button" onClick={() => onSelectCategory("windows")}>
            Выбор окон
          </button>
          <button className="action-button" onClick={() => onSelectCategory("engineering")}>
            Проектирование инженерных систем
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategorySelection;