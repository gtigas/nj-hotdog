import { useState, useCallback } from 'react';

const STORAGE_KEY = 'njhdi:v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ratings: {} };
  } catch {
    return { ratings: {} };
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or blocked – silent fail
  }
}

export function useRatings() {
  const [ratings, setRatings] = useState(() => load().ratings);

  const rate = useCallback((id, rating, existingNotes) => {
    const data = load();
    const prev = data.ratings[id] || {};
    data.ratings[id] = {
      rating,
      notes: existingNotes !== undefined ? existingNotes : (prev.notes || ''),
      ratedAt: new Date().toISOString(),
    };
    save(data);
    setRatings({ ...data.ratings });
  }, []);

  const updateNotes = useCallback((id, notes) => {
    const data = load();
    if (!data.ratings[id]) return;
    data.ratings[id] = { ...data.ratings[id], notes };
    save(data);
    setRatings({ ...data.ratings });
  }, []);

  const clearRating = useCallback((id) => {
    const data = load();
    delete data.ratings[id];
    save(data);
    setRatings({ ...data.ratings });
  }, []);

  return { ratings, rate, updateNotes, clearRating };
}
