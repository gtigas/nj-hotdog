import { useState, useMemo } from 'react';
import Tile from './Tile';
import CategoryBlock from './CategoryBlock';
import LegendBlock from './LegendBlock';
import DetailModal from './DetailModal';
import ShareModal from './ShareModal';
import './PeriodicTable.css';

// Category blocks that appear in the header band (grid row 1) and their positions
const HEADER_CATEGORIES = [
  { id: 'ripper', gridCol: 1 },
  { id: 'haute', gridCol: 14 },
];

// Category blocks in tile-row 1 (grid row 2) — fills cols where there are no tiles in data row 1
const TILE_ROW1_CATEGORIES = [
  { id: 'dirty-water', gridCol: 2 },
  { id: 'jumbo', gridCol: 9 },
  { id: 'wurst', gridCol: 10 },
  { id: 'farm', gridCol: 11 },
  { id: 'deli', gridCol: 12 },
  { id: 'distributed', gridCol: 13 },
];

// Category blocks in tile-row 2 (grid row 3) — fills cols where there are no tiles in data row 2
const TILE_ROW2_CATEGORIES = [
  { id: 'chili-dog', gridCol: 3 },
  { id: 'plainfield-texas-weiner', gridCol: 4 },
  { id: 'passaic-texas-weiner', gridCol: 5 },
  { id: 'hot-onions', gridCol: 6 },
  { id: 'easton', gridCol: 7 },
  { id: 'italian', gridCol: 8 },
];

export default function PeriodicTable({
  hotdogs,
  categories,
  glossary,
  ratings,
  onRate,
  onUpdateNotes,
  onClearRating,
}) {
  const [selectedDog, setSelectedDog] = useState(null);
  const [shareDog, setShareDog] = useState(null);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.categories.map((c) => [c.id, c])),
    [categories]
  );

  // Header stats
  const ratedEntries = Object.values(ratings);
  const ratedCount = ratedEntries.length;
  const avgRating =
    ratedCount > 0
      ? (ratedEntries.reduce((sum, r) => sum + r.rating, 0) / ratedCount).toFixed(1)
      : null;

  const handleTileClick = (dog) => setSelectedDog(dog);
  const handleModalClose = () => setSelectedDog(null);
  const handleShare = (dog) => setShareDog(dog);
  const handleShareClose = () => setShareDog(null);

  return (
    <>
      <div className="pt-outer">
        {/* ── CSS grid: 14 cols × (1 header + 7 tile rows) ── */}
        <div className="periodic-table">

          {/* ────────────── GRID ROW 1: Header band ────────────── */}
          {HEADER_CATEGORIES.map(({ id, gridCol }) => (
            <div
              key={id}
              className="pt-cell"
              style={{ gridColumn: gridCol, gridRow: 1 }}
            >
              <CategoryBlock category={categoryMap[id]} />
            </div>
          ))}

          {/* Title block — spans cols 2-13 */}
          <div
            className="pt-title-cell"
            style={{ gridColumn: '2 / 14', gridRow: 1 }}
          >
            <div className="pt-title-text">The New Jersey Hot Dog Index</div>
            <div className="pt-title-stats">
              {hotdogs.length} dogs&nbsp;·&nbsp;You&apos;ve rated {ratedCount}
              {avgRating && <>&nbsp;·&nbsp;avg {avgRating}</>}
            </div>
          </div>

          {/* ────────────── GRID ROW 2: Tile row 1 category blocks + tiles ── */}
          {TILE_ROW1_CATEGORIES.map(({ id, gridCol }) => (
            <div
              key={id}
              className="pt-cell pt-fit-cell"
              style={{ gridColumn: gridCol, gridRow: 2 }}
            >
              <CategoryBlock category={categoryMap[id]} />
            </div>
          ))}

          {/* Legend block spans cols 3-8 in tile row 1 */}
          <div
            className="pt-cell pt-fit-cell"
            style={{ gridColumn: '3 / 9', gridRow: 2 }}
          >
            <LegendBlock />
          </div>

          {/* ────────────── GRID ROW 3: Tile row 2 category blocks ── */}
          {TILE_ROW2_CATEGORIES.map(({ id, gridCol }) => (
            <div
              key={id}
              className="pt-cell pt-fit-cell"
              style={{ gridColumn: gridCol, gridRow: 3 }}
            >
              <CategoryBlock category={categoryMap[id]} />
            </div>
          ))}

          {/* ────────────── HOT DOG TILES ── */}
          {hotdogs.map((dog) => (
            <div
              key={dog.id}
              className="pt-cell pt-tile-cell"
              style={{ gridColumn: dog.col, gridRow: dog.row + 1 }}
            >
              <Tile
                dog={dog}
                category={categoryMap[dog.category]}
                rating={ratings[dog.id]}
                onClick={() => handleTileClick(dog)}
              />
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <footer className="pt-footer">
          <em>
            This is an artistic interpretation; details may differ over time.
            Original poster by Primitive Pines (
            <a
              href="https://www.primitivepines.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pt-footer-link"
            >
              primitivepines.com
            </a>
            ).
          </em>
        </footer>
      </div>

      {/* ── Modals (portalled outside grid for stacking context) ── */}
      {selectedDog && (
        <DetailModal
          dog={selectedDog}
          category={categoryMap[selectedDog.category]}
          glossary={glossary}
          rating={ratings[selectedDog.id]}
          onRate={onRate}
          onUpdateNotes={onUpdateNotes}
          onClearRating={onClearRating}
          onShare={handleShare}
          onClose={handleModalClose}
        />
      )}

      {shareDog && (
        <ShareModal
          dog={shareDog}
          category={categoryMap[shareDog.category]}
          rating={ratings[shareDog.id]}
          notes={ratings[shareDog.id]?.notes}
          onClose={handleShareClose}
        />
      )}
    </>
  );
}
