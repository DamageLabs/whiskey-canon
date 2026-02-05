import { useMemo } from 'react';
import { Whiskey, WhiskeyType } from '../types';

export interface FilterState {
  type: WhiskeyType | '';
  distillery: string;
  region: string;
  country: string;
  limitedEdition: boolean | null;
  chillFiltered: boolean | null;
  naturalColor: boolean | null;
  isOpened: boolean | null;
  ageMin: number | null;
  ageMax: number | null;
  abvMin: number | null;
  abvMax: number | null;
  ratingMin: number | null;
  ratingMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
}

export const defaultFilters: FilterState = {
  type: '',
  distillery: '',
  region: '',
  country: '',
  limitedEdition: null,
  chillFiltered: null,
  naturalColor: null,
  isOpened: null,
  ageMin: null,
  ageMax: null,
  abvMin: null,
  abvMax: null,
  ratingMin: null,
  ratingMax: null,
  priceMin: null,
  priceMax: null,
};

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  whiskeys: Whiskey[];
  isOpen: boolean;
  onToggle: () => void;
}

export function FilterPanel({ filters, onFiltersChange, whiskeys, isOpen, onToggle }: FilterPanelProps) {
  // Extract unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const distilleries = new Set<string>();
    const regions = new Set<string>();
    const countries = new Set<string>();

    whiskeys.forEach((w) => {
      if (w.distillery) distilleries.add(w.distillery);
      if (w.region) regions.add(w.region);
      if (w.country) countries.add(w.country);
    });

    return {
      distilleries: Array.from(distilleries).sort(),
      regions: Array.from(regions).sort(),
      countries: Array.from(countries).sort(),
    };
  }, [whiskeys]);

  // Calculate ranges for numeric filters
  const ranges = useMemo(() => {
    let ageMin = Infinity, ageMax = -Infinity;
    let abvMin = Infinity, abvMax = -Infinity;
    let ratingMin = Infinity, ratingMax = -Infinity;
    let priceMin = Infinity, priceMax = -Infinity;

    whiskeys.forEach((w) => {
      if (w.age != null) {
        ageMin = Math.min(ageMin, w.age);
        ageMax = Math.max(ageMax, w.age);
      }
      if (w.abv != null) {
        abvMin = Math.min(abvMin, w.abv);
        abvMax = Math.max(abvMax, w.abv);
      }
      if (w.rating != null) {
        ratingMin = Math.min(ratingMin, w.rating);
        ratingMax = Math.max(ratingMax, w.rating);
      }
      const price = w.purchase_price ?? w.msrp;
      if (price != null) {
        priceMin = Math.min(priceMin, price);
        priceMax = Math.max(priceMax, price);
      }
    });

    return {
      age: { min: ageMin === Infinity ? 0 : ageMin, max: ageMax === -Infinity ? 30 : ageMax },
      abv: { min: abvMin === Infinity ? 40 : Math.floor(abvMin), max: abvMax === -Infinity ? 70 : Math.ceil(abvMax) },
      rating: { min: ratingMin === Infinity ? 0 : ratingMin, max: ratingMax === -Infinity ? 10 : ratingMax },
      price: { min: priceMin === Infinity ? 0 : Math.floor(priceMin), max: priceMax === -Infinity ? 500 : Math.ceil(priceMax) },
    };
  }, [whiskeys]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'limitedEdition' || key === 'chillFiltered' || key === 'naturalColor' || key === 'isOpened') {
      return value !== null;
    }
    if (typeof value === 'string') return value !== '';
    return value !== null;
  });

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'limitedEdition' || key === 'chillFiltered' || key === 'naturalColor' || key === 'isOpened') {
      return value !== null;
    }
    if (typeof value === 'string') return value !== '';
    return value !== null;
  }).length;

  return (
    <div className="mb-3">
      {/* Toggle Button */}
      <button
        className="btn btn-sm d-flex align-items-center gap-2"
        style={{
          backgroundColor: isOpen || hasActiveFilters ? 'var(--amber-600)' : 'var(--zinc-800)',
          color: isOpen || hasActiveFilters ? 'white' : 'var(--amber-500)',
          border: '2px solid var(--amber-500)',
        }}
        onClick={onToggle}
      >
        <i className={`bi bi-funnel${hasActiveFilters ? '-fill' : ''}`}></i>
        Filters
        {activeFilterCount > 0 && (
          <span className="badge bg-light text-dark">{activeFilterCount}</span>
        )}
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-1`}></i>
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div
          className="mt-3 p-4 rounded-3"
          style={{
            backgroundColor: 'var(--zinc-900)',
            border: '1px solid var(--zinc-700)',
          }}
        >
          <div className="row g-3">
            {/* Type Dropdown */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">Type</label>
              <select
                className="form-select form-select-sm"
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value as WhiskeyType | '')}
              >
                <option value="">All Types</option>
                {Object.values(WhiskeyType).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Distillery Dropdown */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">Distillery</label>
              <select
                className="form-select form-select-sm"
                value={filters.distillery}
                onChange={(e) => updateFilter('distillery', e.target.value)}
              >
                <option value="">All Distilleries</option>
                {uniqueValues.distilleries.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Region Dropdown */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">Region</label>
              <select
                className="form-select form-select-sm"
                value={filters.region}
                onChange={(e) => updateFilter('region', e.target.value)}
                disabled={uniqueValues.regions.length === 0}
              >
                <option value="">All Regions</option>
                {uniqueValues.regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Country Dropdown */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">Country</label>
              <select
                className="form-select form-select-sm"
                value={filters.country}
                onChange={(e) => updateFilter('country', e.target.value)}
                disabled={uniqueValues.countries.length === 0}
              >
                <option value="">All Countries</option>
                {uniqueValues.countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Boolean Toggles */}
            <div className="col-12">
              <label className="form-label small text-muted">Attributes</label>
              <div className="d-flex flex-wrap gap-2">
                <TriStateToggle
                  label="Limited Edition"
                  value={filters.limitedEdition}
                  onChange={(v) => updateFilter('limitedEdition', v)}
                />
                <TriStateToggle
                  label="Non-Chill Filtered"
                  value={filters.chillFiltered === null ? null : !filters.chillFiltered}
                  onChange={(v) => updateFilter('chillFiltered', v === null ? null : !v)}
                />
                <TriStateToggle
                  label="Natural Color"
                  value={filters.naturalColor}
                  onChange={(v) => updateFilter('naturalColor', v)}
                />
                <TriStateToggle
                  label="Opened"
                  value={filters.isOpened}
                  onChange={(v) => updateFilter('isOpened', v)}
                />
              </div>
            </div>

            {/* Range Filters */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">
                Age {filters.ageMin !== null || filters.ageMax !== null ? `(${filters.ageMin ?? ranges.age.min}-${filters.ageMax ?? ranges.age.max} yrs)` : ''}
              </label>
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Min"
                  value={filters.ageMin ?? ''}
                  onChange={(e) => updateFilter('ageMin', e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  style={{ width: '80px' }}
                />
                <span className="text-muted">to</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Max"
                  value={filters.ageMax ?? ''}
                  onChange={(e) => updateFilter('ageMax', e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">
                ABV {filters.abvMin !== null || filters.abvMax !== null ? `(${filters.abvMin ?? ranges.abv.min}-${filters.abvMax ?? ranges.abv.max}%)` : ''}
              </label>
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Min"
                  value={filters.abvMin ?? ''}
                  onChange={(e) => updateFilter('abvMin', e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  max={100}
                  step={0.1}
                  style={{ width: '80px' }}
                />
                <span className="text-muted">to</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Max"
                  value={filters.abvMax ?? ''}
                  onChange={(e) => updateFilter('abvMax', e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  max={100}
                  step={0.1}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">
                Rating {filters.ratingMin !== null || filters.ratingMax !== null ? `(${filters.ratingMin ?? 0}-${filters.ratingMax ?? 10})` : ''}
              </label>
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Min"
                  value={filters.ratingMin ?? ''}
                  onChange={(e) => updateFilter('ratingMin', e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  max={10}
                  step={0.1}
                  style={{ width: '80px' }}
                />
                <span className="text-muted">to</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Max"
                  value={filters.ratingMax ?? ''}
                  onChange={(e) => updateFilter('ratingMax', e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  max={10}
                  step={0.1}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">
                Price {filters.priceMin !== null || filters.priceMax !== null ? `($${filters.priceMin ?? 0}-$${filters.priceMax ?? ranges.price.max})` : ''}
              </label>
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Min"
                  value={filters.priceMin ?? ''}
                  onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  style={{ width: '80px' }}
                />
                <span className="text-muted">to</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Max"
                  value={filters.priceMax ?? ''}
                  onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="col-12">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={clearFilters}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Tri-state toggle component for boolean filters (null = any, true = yes, false = no)
interface TriStateToggleProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}

function TriStateToggle({ label, value, onChange }: TriStateToggleProps) {
  const cycle = () => {
    if (value === null) onChange(true);
    else if (value === true) onChange(false);
    else onChange(null);
  };

  const getStyle = () => {
    if (value === true) {
      return {
        backgroundColor: 'var(--amber-600)',
        color: 'white',
        border: '1px solid var(--amber-600)',
      };
    }
    if (value === false) {
      return {
        backgroundColor: 'var(--zinc-700)',
        color: 'var(--zinc-300)',
        border: '1px solid var(--zinc-600)',
      };
    }
    return {
      backgroundColor: 'transparent',
      color: 'var(--zinc-400)',
      border: '1px solid var(--zinc-600)',
    };
  };

  const getIcon = () => {
    if (value === true) return 'bi-check-circle-fill';
    if (value === false) return 'bi-x-circle-fill';
    return 'bi-circle';
  };

  return (
    <button
      type="button"
      className="btn btn-sm d-flex align-items-center gap-1"
      style={getStyle()}
      onClick={cycle}
      title={value === null ? 'Any' : value ? 'Yes only' : 'No only'}
    >
      <i className={`bi ${getIcon()}`}></i>
      {label}
    </button>
  );
}

// Filter function to apply filters to whiskeys array
export function applyFilters(whiskeys: Whiskey[], filters: FilterState): Whiskey[] {
  return whiskeys.filter((w) => {
    // Type filter
    if (filters.type && w.type !== filters.type) return false;

    // Distillery filter
    if (filters.distillery && w.distillery !== filters.distillery) return false;

    // Region filter
    if (filters.region && w.region !== filters.region) return false;

    // Country filter
    if (filters.country && w.country !== filters.country) return false;

    // Limited Edition filter
    if (filters.limitedEdition !== null) {
      const isLimited = Boolean(w.limited_edition);
      if (filters.limitedEdition !== isLimited) return false;
    }

    // Chill Filtered filter (note: we're filtering for NCF when chillFiltered is false)
    if (filters.chillFiltered !== null) {
      // If chill_filtered is null/undefined, we don't know, so exclude if filter is active
      if (w.chill_filtered === null || w.chill_filtered === undefined) return false;
      const isChillFiltered = Boolean(w.chill_filtered);
      if (filters.chillFiltered !== isChillFiltered) return false;
    }

    // Natural Color filter
    if (filters.naturalColor !== null) {
      const isNaturalColor = Boolean(w.natural_color);
      if (filters.naturalColor !== isNaturalColor) return false;
    }

    // Is Opened filter
    if (filters.isOpened !== null) {
      const isOpened = Boolean(w.is_opened);
      if (filters.isOpened !== isOpened) return false;
    }

    // Age range filter
    if (filters.ageMin !== null && (w.age == null || w.age < filters.ageMin)) return false;
    if (filters.ageMax !== null && (w.age == null || w.age > filters.ageMax)) return false;

    // ABV range filter
    if (filters.abvMin !== null && (w.abv == null || w.abv < filters.abvMin)) return false;
    if (filters.abvMax !== null && (w.abv == null || w.abv > filters.abvMax)) return false;

    // Rating range filter
    if (filters.ratingMin !== null && (w.rating == null || w.rating < filters.ratingMin)) return false;
    if (filters.ratingMax !== null && (w.rating == null || w.rating > filters.ratingMax)) return false;

    // Price range filter (use purchase_price or msrp)
    const price = w.purchase_price ?? w.msrp;
    if (filters.priceMin !== null && (price == null || price < filters.priceMin)) return false;
    if (filters.priceMax !== null && (price == null || price > filters.priceMax)) return false;

    return true;
  });
}
