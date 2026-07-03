import PeriodicTable from './components/PeriodicTable';
import { useRatings } from './store';
import hotdogs from './data/hotdogs.json';
import categories from './data/categories.json';
import glossary from './data/glossary.json';
import './App.css';

function App() {
  const { ratings, rate, updateNotes, clearRating } = useRatings();

  return (
    <div className="app">
      <PeriodicTable
        hotdogs={hotdogs}
        categories={categories}
        glossary={glossary}
        ratings={ratings}
        onRate={rate}
        onUpdateNotes={updateNotes}
        onClearRating={clearRating}
      />
    </div>
  );
}

export default App;
