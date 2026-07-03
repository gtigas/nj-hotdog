import { useState, useEffect, useRef, useCallback } from 'react';
import './DetailModal.css';

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusDot({ status }) {
  if (status === 'open') {
    return <><span className="status-dot status-open" aria-hidden="true" /> Open</>;
  }
  if (status === 'closed') {
    return <><span className="status-dot status-closed" aria-hidden="true" /> Closed</>;
  }
  return null;
}

export default function DetailModal({
  dog,
  category,
  glossary,
  rating,
  onRate,
  onUpdateNotes,
  onClearRating,
  onShare,
  onClose,
}) {
  const borderColor = category?.borderColor || '#999';

  // Local notes state — synced from rating on dog change
  const [notesValue, setNotesValue] = useState(rating?.notes || '');
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [hoverRating, setHoverRating] = useState(null);
  const debounceRef = useRef(null);
  const dialogRef = useRef(null);

  // Sync notes when switching dogs
  useEffect(() => {
    setNotesValue(rating?.notes || '');
  }, [dog.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus the dialog on open
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleRate = (n) => {
    onRate(dog.id, n, notesValue);
  };

  const handleNotesChange = useCallback((e) => {
    const val = e.target.value;
    setNotesValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdateNotes(dog.id, val);
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 1500);
    }, 400);
  }, [dog.id, onUpdateNotes]);

  const handleClear = () => {
    onClearRating(dog.id);
    setNotesValue('');
  };

  // Build facts list
  const facts = [];
  if (dog.year != null) {
    facts.push({ key: 'Established', value: `c. ${dog.year}` });
  }
  if (dog.franksRatio || (dog.ingredients && dog.ingredients.length > 0)) {
    const ingDecoded = dog.ingredients
      ? dog.ingredients.map((i) => glossary.ingredients[i] || i).join(', ')
      : '';
    const frankText = [
      dog.franksRatio ? `${dog.franksRatio} franks/lb` : null,
      ingDecoded || null,
    ].filter(Boolean).join(' — ');
    facts.push({ key: 'Frank', value: frankText });
  }
  if (dog.toppingCodes && dog.toppingCodes.length > 0) {
    const toppingsText = dog.toppingCodes
      .map((c) => `${glossary.toppings[c] || c} (${c})`)
      .join(', ');
    facts.push({ key: 'Toppings', value: toppingsText });
  }
  if (dog.brand) {
    facts.push({ key: 'Brand', value: dog.brand });
  }
  if (dog.town) {
    facts.push({ key: 'Town', value: dog.town });
  }
  if (dog.address) {
    facts.push({ key: 'Address', value: dog.address });
  }
  if (dog.status && dog.status !== 'unknown') {
    facts.push({ key: 'Status', value: <StatusDot status={dog.status} />, isJsx: true });
  }
  if (dog.website) {
    facts.push({
      key: 'Website',
      value: (
        <a href={dog.website} target="_blank" rel="noopener noreferrer" className="modal-website-link">
          {dog.website}
        </a>
      ),
      isJsx: true,
    });
  }

  const currentRating = rating?.rating;
  const displayRating = hoverRating ?? currentRating;

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${dog.name} details`}
    >
      <div
        className="modal-card"
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* Close button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>

        {/* Header: chip + name + category label */}
        <div className="modal-header">
          <div
            className="modal-chip"
            style={{ borderColor, '--cat-color': borderColor }}
          >
            <div className="modal-chip-symbol">{dog.symbol}</div>
          </div>
          <div className="modal-header-text">
            <h2 className="modal-dog-name">{dog.name}</h2>
            <span
              className="modal-category-badge"
              style={{ backgroundColor: borderColor }}
            >
              {category?.title}
            </span>
          </div>
        </div>

        {/* Photo */}
        {dog.photo && (
          <div className="modal-photo-wrap">
            <img
              src={dog.photo}
              alt={`${dog.name} hot dog`}
              className="modal-photo"
            />
          </div>
        )}

        {/* Facts grid */}
        {facts.length > 0 && (
          <dl className="modal-facts">
            {facts.map(({ key, value, isJsx }) => (
              <div key={key} className="modal-fact-row">
                <dt className="modal-fact-key">{key}</dt>
                <dd className="modal-fact-val">
                  {isJsx ? value : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Blurb */}
        {dog.blurb && (
          <p className="modal-blurb">{dog.blurb}</p>
        )}

        {/* Category description */}
        {category?.description && (
          <p className="modal-category-desc">{category.description}</p>
        )}

        {/* Rating section */}
        <div className="modal-rate-section" style={{ '--cat-color': borderColor }}>
          <div className="modal-rate-label">Rate this dog</div>
          <div
            className="modal-rate-buttons"
            onMouseLeave={() => setHoverRating(null)}
          >
            {Array.from({ length: 10 }, (_, i) => {
              const n = i + 1;
              const isSelected = currentRating === n;
              const isHighlighted = displayRating != null && n <= displayRating;
              return (
                <button
                  key={n}
                  className={`modal-rate-btn${isSelected ? ' selected' : ''}${isHighlighted && !isSelected ? ' preview' : ''}`}
                  style={
                    isSelected
                      ? { backgroundColor: borderColor, borderColor, color: '#fff' }
                      : isHighlighted
                      ? { backgroundColor: borderColor + '33', borderColor }
                      : {}
                  }
                  onClick={() => handleRate(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  aria-label={`Rate ${n} out of 10`}
                  aria-pressed={isSelected}
                >
                  {n}
                </button>
              );
            })}
          </div>

          {/* Rated display + Share */}
          {currentRating != null && (
            <div className="modal-rated-row">
              <span className="modal-rated-text">
                Your rating: <strong>{currentRating}/10</strong>
                {rating?.ratedAt && ` · rated ${formatDate(rating.ratedAt)}`}
              </span>
              <button
                className="modal-share-btn"
                style={{ backgroundColor: borderColor }}
                onClick={() => onShare(dog)}
              >
                Share
              </button>
            </div>
          )}

          {/* Notes */}
          {currentRating != null && (
            <div className="modal-notes-wrap">
              <textarea
                className="modal-notes"
                placeholder="Tasting notes — toppings you got, wait time, would you go back?..."
                value={notesValue}
                onChange={handleNotesChange}
                rows={3}
              />
              {savedIndicator && (
                <span className="modal-saved-indicator">Saved</span>
              )}
            </div>
          )}

          {/* Clear rating */}
          {currentRating != null && (
            <button className="modal-clear-btn" onClick={handleClear}>
              Clear rating
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
