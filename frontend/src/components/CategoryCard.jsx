import React from 'react';
import { Link } from 'react-router-dom';
import './CategoryCard.css';

const CategoryCard = ({ category }) => {
  return (
    <Link 
      to={`/products?category=${category.category_id}`} 
      className="category-card"
    >
      <div className="category-icon">{category.icon || '🎨'}</div>
      <h3 className="category-name">{category.name}</h3>
    </Link>
  );
};

export default CategoryCard;