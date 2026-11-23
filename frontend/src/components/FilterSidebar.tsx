import { Star } from 'lucide-react';

export interface Filters {
  cuisine: string;
  minRating: number | null;
  sort: string;
  vegOnly: boolean;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  cuisines: string[];
}

const SORTS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
  { value: 'delivery_time', label: 'Delivery time' },
  { value: 'price', label: 'Price: low to high' },
];

export default function FilterSidebar({ filters, onChange, cuisines }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <aside className="filters">
      <div className="filters__section">
        <h4>Sort by</h4>
        {SORTS.map((s) => (
          <label key={s.value} className={`radio-row ${filters.sort === s.value ? 'active' : ''}`}>
            <input
              type="radio"
              name="sort"
              checked={filters.sort === s.value}
              onChange={() => set({ sort: s.value })}
            />
            {s.label}
          </label>
        ))}
      </div>

      <div className="filters__section">
        <h4>Rating</h4>
        {[4.5, 4.0, 3.5].map((r) => (
          <label key={r} className={`radio-row ${filters.minRating === r ? 'active' : ''}`}>
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === r}
              onChange={() => set({ minRating: r })}
            />
            <Star size={13} fill="currentColor" /> {r}+
          </label>
        ))}
        <label className={`radio-row ${filters.minRating === null ? 'active' : ''}`}>
          <input
            type="radio"
            name="rating"
            checked={filters.minRating === null}
            onChange={() => set({ minRating: null })}
          />
          Any rating
        </label>
      </div>

      <div className="filters__section">
        <h4>Cuisine</h4>
        <select aria-label="Cuisine" value={filters.cuisine} onChange={(e) => set({ cuisine: e.target.value })}>
          <option value="">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__section">
        <h4>Diet</h4>
        <label className={`radio-row ${filters.vegOnly ? 'active' : ''}`}>
          <input
            type="checkbox"
            checked={filters.vegOnly}
            onChange={(e) => set({ vegOnly: e.target.checked })}
          />
          Vegetarian only
        </label>
      </div>

      <button
        type="button"
        className="btn btn--ghost btn--sm filters__reset"
        onClick={() => onChange({ cuisine: '', minRating: null, sort: 'popularity', vegOnly: false })}
      >
        Reset filters
      </button>
    </aside>
  );
}
