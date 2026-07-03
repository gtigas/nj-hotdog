import './CategoryBlock.css';

export default function CategoryBlock({ category }) {
  if (!category) return null;
  return (
    <div className="category-block">
      <div className="category-block-title">{category.title}</div>
      <div className="category-block-desc">{category.description}</div>
    </div>
  );
}
