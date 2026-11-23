import { Category } from '../types';
import FoodImage from './FoodImage';

interface Props {
  category: Category;
  active?: boolean;
  onClick?: () => void;
}

export default function CategoryCard({ category, active, onClick }: Props) {
  return (
    <button
      type="button"
      className={`category-card ${active ? 'category-card--active' : ''}`}
      onClick={onClick}
    >
      <span className="category-card__icon">
        <FoodImage src={category.imageUrl} alt="" />
      </span>
      <span>{category.name}</span>
    </button>
  );
}
