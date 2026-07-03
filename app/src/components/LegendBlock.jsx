import glossary from '../data/glossary.json';
import './LegendBlock.css';

export default function LegendBlock() {
  const toppingEntries = Object.entries(glossary.toppings);

  return (
    <div className="legend-block">
      {/* Left section: example tile + arrow labels + ingredients key */}
      <div className="legend-example-col">
        <div className="legend-example-row">
          {/* Mini tile mockup */}
          <div className="legend-mini-tile">
            <div className="legend-mini-symbol">Xx</div>
            <div className="legend-mini-name">Restaurant Name</div>
            <div className="legend-mini-info">
              <div>c. YYYY</div>
              <div>n:n i</div>
              <div><em>toppings</em></div>
              <div>brand</div>
            </div>
          </div>

          {/* Arrow labels */}
          <div className="legend-labels">
            <div className="legend-label-item">
              <span className="legend-arrow">←</span>
              <span>Symbol / Name</span>
            </div>
            <div className="legend-label-item">
              <span className="legend-arrow">←</span>
              <span>Year established</span>
            </div>
            <div className="legend-label-item">
              <span className="legend-arrow">←</span>
              <span>Franks per lb; ingredients</span>
            </div>
            <div className="legend-label-item">
              <span className="legend-arrow">←</span>
              <span>Toppings (italic)</span>
            </div>
            <div className="legend-label-item">
              <span className="legend-arrow">←</span>
              <span>Brand</span>
            </div>
          </div>
        </div>

        {/* Ingredients key */}
        <div className="legend-ingredients-key">
          <strong>i:</strong>&nbsp; b: beef &nbsp;·&nbsp; p: pork &nbsp;·&nbsp; v: veal &nbsp;·&nbsp; bi: bison &nbsp;·&nbsp; d: duck
        </div>
      </div>

      {/* Right section: toppings key */}
      <div className="legend-toppings">
        <div className="legend-toppings-header"><strong>Toppings</strong></div>
        <div className="legend-toppings-grid">
          {toppingEntries.map(([code, label]) => (
            <div key={code} className="legend-topping-entry">
              <span className="legend-topping-code">{code}</span>
              <span className="legend-topping-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
