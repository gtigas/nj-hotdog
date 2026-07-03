import './Tile.css';

export default function Tile({ dog, category, rating, onClick }) {
  const borderColor = category?.borderColor || '#999';
  const ratingValue = rating?.rating;

  return (
    <button
      className="tile"
      style={{ '--cat-color': borderColor, borderColor }}
      onClick={onClick}
      aria-label={`${dog.name} hot dog — click to view details`}
    >
      {/* Rating badge top-right */}
      {ratingValue != null && (
        <div
          className="tile-badge"
          style={{ backgroundColor: borderColor }}
          aria-label={`Rated ${ratingValue} out of 10`}
        >
          {ratingValue}
        </div>
      )}

      {/* Symbol + Name */}
      <div className="tile-top">
        <div className="tile-symbol">{dog.symbol}</div>
        <div className="tile-name">{dog.name}</div>
      </div>

      {/* Photo */}
      <div className="tile-photo-wrap">
        {dog.photo && (
          <img
            src={dog.photo}
            alt={`${dog.name} hot dog`}
            className="tile-photo"
            loading="lazy"
          />
        )}
      </div>

      {/* Bottom info lines — right-aligned, tiny */}
      <div className="tile-info">
        {dog.year != null && <div>c.&nbsp;{dog.year}</div>}
        {(dog.franksRatio || (dog.ingredients && dog.ingredients.length > 0)) && (
          <div>
            {[dog.franksRatio, dog.ingredients?.join(',')].filter(Boolean).join(' ')}
          </div>
        )}
        {dog.toppingCodes && dog.toppingCodes.length > 0 && (
          <div><em>{dog.toppingCodes.join(', ')}</em></div>
        )}
        {dog.brand && <div>{dog.brand}</div>}
      </div>

      {/* Progress strip — only when rated */}
      {ratingValue != null && (
        <div className="tile-progress-strip" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="tile-progress-seg"
              style={i < ratingValue ? { backgroundColor: borderColor } : {}}
            />
          ))}
        </div>
      )}
    </button>
  );
}
