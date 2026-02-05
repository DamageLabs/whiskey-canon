import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel, applyFilters, defaultFilters, FilterState } from './FilterPanel';
import { Whiskey, WhiskeyType } from '../types';

// Mock whiskey data for testing
const mockWhiskeys: Whiskey[] = [
  {
    id: 1,
    name: 'Buffalo Trace',
    type: WhiskeyType.BOURBON,
    distillery: 'Buffalo Trace Distillery',
    region: 'Kentucky',
    country: 'USA',
    age: 8,
    abv: 45,
    rating: 8.5,
    purchase_price: 30,
    limited_edition: false,
    chill_filtered: true,
    natural_color: true,
    is_opened: false,
    created_by: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 2,
    name: 'Pappy Van Winkle 20 Year',
    type: WhiskeyType.BOURBON,
    distillery: 'Buffalo Trace Distillery',
    region: 'Kentucky',
    country: 'USA',
    age: 20,
    abv: 45.2,
    rating: 9.8,
    purchase_price: 2000,
    limited_edition: true,
    chill_filtered: false,
    natural_color: true,
    is_opened: false,
    created_by: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 3,
    name: 'Lagavulin 16',
    type: WhiskeyType.SCOTCH,
    distillery: 'Lagavulin Distillery',
    region: 'Islay',
    country: 'Scotland',
    age: 16,
    abv: 43,
    rating: 9.0,
    purchase_price: 100,
    limited_edition: false,
    chill_filtered: true,
    natural_color: false,
    is_opened: true,
    created_by: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 4,
    name: 'Yamazaki 18',
    type: WhiskeyType.JAPANESE,
    distillery: 'Yamazaki Distillery',
    region: 'Osaka',
    country: 'Japan',
    age: 18,
    abv: 43,
    rating: 9.5,
    purchase_price: 500,
    limited_edition: true,
    chill_filtered: true,
    natural_color: true,
    is_opened: false,
    created_by: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 5,
    name: 'Redbreast 12',
    type: WhiskeyType.IRISH,
    distillery: 'Midleton Distillery',
    region: 'Cork',
    country: 'Ireland',
    age: 12,
    abv: 40,
    rating: 8.0,
    msrp: 65, // Using msrp instead of purchase_price
    limited_edition: false,
    chill_filtered: false,
    natural_color: true,
    is_opened: true,
    created_by: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

describe('applyFilters', () => {
  describe('default filters', () => {
    it('returns all whiskeys when using default filters', () => {
      const result = applyFilters(mockWhiskeys, defaultFilters);
      expect(result).toHaveLength(5);
    });

    it('returns empty array for empty whiskey list', () => {
      const result = applyFilters([], defaultFilters);
      expect(result).toHaveLength(0);
    });
  });

  describe('type filter', () => {
    it('filters by bourbon type', () => {
      const filters: FilterState = { ...defaultFilters, type: WhiskeyType.BOURBON };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
      expect(result.every(w => w.type === WhiskeyType.BOURBON)).toBe(true);
    });

    it('filters by scotch type', () => {
      const filters: FilterState = { ...defaultFilters, type: WhiskeyType.SCOTCH };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Lagavulin 16');
    });

    it('filters by japanese type', () => {
      const filters: FilterState = { ...defaultFilters, type: WhiskeyType.JAPANESE };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Yamazaki 18');
    });

    it('returns empty when type has no matches', () => {
      const filters: FilterState = { ...defaultFilters, type: WhiskeyType.CANADIAN };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(0);
    });
  });

  describe('distillery filter', () => {
    it('filters by distillery', () => {
      const filters: FilterState = { ...defaultFilters, distillery: 'Buffalo Trace Distillery' };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
      expect(result.every(w => w.distillery === 'Buffalo Trace Distillery')).toBe(true);
    });

    it('returns empty when distillery has no matches', () => {
      const filters: FilterState = { ...defaultFilters, distillery: 'Nonexistent Distillery' };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(0);
    });
  });

  describe('region filter', () => {
    it('filters by region', () => {
      const filters: FilterState = { ...defaultFilters, region: 'Kentucky' };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
    });

    it('filters by Islay region', () => {
      const filters: FilterState = { ...defaultFilters, region: 'Islay' };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Lagavulin 16');
    });
  });

  describe('country filter', () => {
    it('filters by country USA', () => {
      const filters: FilterState = { ...defaultFilters, country: 'USA' };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
    });

    it('filters by country Scotland', () => {
      const filters: FilterState = { ...defaultFilters, country: 'Scotland' };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
    });
  });

  describe('limited edition filter', () => {
    it('filters for limited edition only (true)', () => {
      const filters: FilterState = { ...defaultFilters, limitedEdition: true };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
      expect(result.every(w => w.limited_edition === true)).toBe(true);
    });

    it('filters for non-limited edition only (false)', () => {
      const filters: FilterState = { ...defaultFilters, limitedEdition: false };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
      expect(result.every(w => w.limited_edition === false)).toBe(true);
    });

    it('returns all when limitedEdition is null', () => {
      const filters: FilterState = { ...defaultFilters, limitedEdition: null };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(5);
    });
  });

  describe('chill filtered filter', () => {
    it('filters for chill filtered only (true)', () => {
      const filters: FilterState = { ...defaultFilters, chillFiltered: true };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
      expect(result.every(w => w.chill_filtered === true)).toBe(true);
    });

    it('filters for non-chill filtered only (false)', () => {
      const filters: FilterState = { ...defaultFilters, chillFiltered: false };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
      expect(result.every(w => w.chill_filtered === false)).toBe(true);
    });

    it('excludes whiskeys with null/undefined chill_filtered when filter is active', () => {
      const whiskeyWithNull: Whiskey = {
        ...mockWhiskeys[0],
        id: 99,
        chill_filtered: undefined,
      };
      const whiskeysWithNull = [...mockWhiskeys, whiskeyWithNull];

      const filters: FilterState = { ...defaultFilters, chillFiltered: true };
      const result = applyFilters(whiskeysWithNull, filters);
      expect(result.find(w => w.id === 99)).toBeUndefined();
    });
  });

  describe('natural color filter', () => {
    it('filters for natural color only', () => {
      const filters: FilterState = { ...defaultFilters, naturalColor: true };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(4);
      expect(result.every(w => w.natural_color === true)).toBe(true);
    });

    it('filters for non-natural color only', () => {
      const filters: FilterState = { ...defaultFilters, naturalColor: false };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Lagavulin 16');
    });
  });

  describe('is opened filter', () => {
    it('filters for opened bottles only', () => {
      const filters: FilterState = { ...defaultFilters, isOpened: true };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
      expect(result.every(w => w.is_opened === true)).toBe(true);
    });

    it('filters for unopened bottles only', () => {
      const filters: FilterState = { ...defaultFilters, isOpened: false };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
      expect(result.every(w => w.is_opened === false)).toBe(true);
    });
  });

  describe('age range filter', () => {
    it('filters by minimum age', () => {
      const filters: FilterState = { ...defaultFilters, ageMin: 16 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
      expect(result.every(w => w.age! >= 16)).toBe(true);
    });

    it('filters by maximum age', () => {
      const filters: FilterState = { ...defaultFilters, ageMax: 12 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
      expect(result.every(w => w.age! <= 12)).toBe(true);
    });

    it('filters by age range', () => {
      const filters: FilterState = { ...defaultFilters, ageMin: 10, ageMax: 18 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
      expect(result.every(w => w.age! >= 10 && w.age! <= 18)).toBe(true);
    });

    it('excludes whiskeys without age when age filter is active', () => {
      const whiskeyWithoutAge: Whiskey = {
        ...mockWhiskeys[0],
        id: 99,
        age: undefined,
      };
      const whiskeysWithMissing = [...mockWhiskeys, whiskeyWithoutAge];

      const filters: FilterState = { ...defaultFilters, ageMin: 5 };
      const result = applyFilters(whiskeysWithMissing, filters);
      expect(result.find(w => w.id === 99)).toBeUndefined();
    });
  });

  describe('ABV range filter', () => {
    it('filters by minimum ABV', () => {
      const filters: FilterState = { ...defaultFilters, abvMin: 45 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
      expect(result.every(w => w.abv! >= 45)).toBe(true);
    });

    it('filters by maximum ABV', () => {
      const filters: FilterState = { ...defaultFilters, abvMax: 43 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
      expect(result.every(w => w.abv! <= 43)).toBe(true);
    });

    it('filters by ABV range', () => {
      const filters: FilterState = { ...defaultFilters, abvMin: 43, abvMax: 45 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
    });
  });

  describe('rating range filter', () => {
    it('filters by minimum rating', () => {
      const filters: FilterState = { ...defaultFilters, ratingMin: 9 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
      expect(result.every(w => w.rating! >= 9)).toBe(true);
    });

    it('filters by maximum rating', () => {
      const filters: FilterState = { ...defaultFilters, ratingMax: 8.5 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
      expect(result.every(w => w.rating! <= 8.5)).toBe(true);
    });

    it('filters by exact rating range', () => {
      const filters: FilterState = { ...defaultFilters, ratingMin: 9, ratingMax: 9.5 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
    });
  });

  describe('price range filter', () => {
    it('filters by minimum price using purchase_price', () => {
      const filters: FilterState = { ...defaultFilters, priceMin: 100 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
    });

    it('filters by maximum price', () => {
      const filters: FilterState = { ...defaultFilters, priceMax: 100 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(3);
    });

    it('filters by price range', () => {
      const filters: FilterState = { ...defaultFilters, priceMin: 50, priceMax: 150 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(2);
    });

    it('uses msrp when purchase_price is not available', () => {
      // Redbreast 12 has msrp of 65, not purchase_price
      const filters: FilterState = { ...defaultFilters, priceMin: 60, priceMax: 70 };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Redbreast 12');
    });
  });

  describe('combined filters', () => {
    it('combines type and limited edition filters', () => {
      const filters: FilterState = {
        ...defaultFilters,
        type: WhiskeyType.BOURBON,
        limitedEdition: true,
      };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Pappy Van Winkle 20 Year');
    });

    it('combines multiple filters', () => {
      const filters: FilterState = {
        ...defaultFilters,
        country: 'USA',
        ageMin: 10,
        ratingMin: 9,
      };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Pappy Van Winkle 20 Year');
    });

    it('combines type, chill filtered, and opened status', () => {
      const filters: FilterState = {
        ...defaultFilters,
        type: WhiskeyType.SCOTCH,
        chillFiltered: true,
        isOpened: true,
      };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Lagavulin 16');
    });

    it('returns empty when no whiskeys match all filters', () => {
      const filters: FilterState = {
        ...defaultFilters,
        type: WhiskeyType.BOURBON,
        country: 'Scotland',
      };
      const result = applyFilters(mockWhiskeys, filters);
      expect(result).toHaveLength(0);
    });
  });
});

describe('FilterPanel component', () => {
  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
    whiskeys: mockWhiskeys,
    isOpen: false,
    onToggle: vi.fn(),
  };

  it('renders toggle button', () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows filter count badge when filters are active', () => {
    const activeFilters: FilterState = { ...defaultFilters, type: WhiskeyType.BOURBON };
    render(<FilterPanel {...defaultProps} filters={activeFilters} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not show filter panel when closed', () => {
    render(<FilterPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
  });

  it('shows filter panel when open', () => {
    render(<FilterPanel {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Distillery')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn();
    render(<FilterPanel {...defaultProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Filters'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('populates distillery dropdown with unique values from whiskeys', () => {
    render(<FilterPanel {...defaultProps} isOpen={true} />);
    const distillerySelect = screen.getAllByRole('combobox')[1]; // Second dropdown
    expect(distillerySelect).toBeInTheDocument();

    // Check that options include distilleries from mock data
    const options = distillerySelect.querySelectorAll('option');
    const optionValues = Array.from(options).map(o => o.textContent);
    expect(optionValues).toContain('Buffalo Trace Distillery');
    expect(optionValues).toContain('Lagavulin Distillery');
  });

  it('calls onFiltersChange when type is selected', () => {
    const onFiltersChange = vi.fn();
    render(<FilterPanel {...defaultProps} isOpen={true} onFiltersChange={onFiltersChange} />);

    const typeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(typeSelect, { target: { value: 'bourbon' } });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bourbon' })
    );
  });

  it('shows Clear All Filters button when filters are active', () => {
    const activeFilters: FilterState = { ...defaultFilters, type: WhiskeyType.BOURBON };
    render(<FilterPanel {...defaultProps} filters={activeFilters} isOpen={true} />);
    expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
  });

  it('does not show Clear All Filters button when no filters active', () => {
    render(<FilterPanel {...defaultProps} isOpen={true} />);
    expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument();
  });

  it('calls onFiltersChange with default filters when Clear All is clicked', () => {
    const onFiltersChange = vi.fn();
    const activeFilters: FilterState = { ...defaultFilters, type: WhiskeyType.BOURBON };
    render(<FilterPanel {...defaultProps} filters={activeFilters} isOpen={true} onFiltersChange={onFiltersChange} />);

    fireEvent.click(screen.getByText('Clear All Filters'));
    expect(onFiltersChange).toHaveBeenCalledWith(defaultFilters);
  });

  it('renders attribute toggle buttons', () => {
    render(<FilterPanel {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Limited Edition')).toBeInTheDocument();
    expect(screen.getByText('Non-Chill Filtered')).toBeInTheDocument();
    expect(screen.getByText('Natural Color')).toBeInTheDocument();
    expect(screen.getByText('Opened')).toBeInTheDocument();
  });

  it('renders range input fields', () => {
    render(<FilterPanel {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('ABV')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('updates age filter when min value changes', () => {
    const onFiltersChange = vi.fn();
    render(<FilterPanel {...defaultProps} isOpen={true} onFiltersChange={onFiltersChange} />);

    const ageInputs = screen.getAllByPlaceholderText('Min');
    fireEvent.change(ageInputs[0], { target: { value: '10' } });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ ageMin: 10 })
    );
  });

  it('handles empty whiskeys array gracefully', () => {
    render(<FilterPanel {...defaultProps} whiskeys={[]} isOpen={true} />);
    expect(screen.getByText('Type')).toBeInTheDocument();
    // Distillery dropdown should only have "All Distilleries" option
    const distillerySelect = screen.getAllByRole('combobox')[1];
    const options = distillerySelect.querySelectorAll('option');
    expect(options).toHaveLength(1);
  });
});

describe('defaultFilters', () => {
  it('has all string filters set to empty string', () => {
    expect(defaultFilters.type).toBe('');
    expect(defaultFilters.distillery).toBe('');
    expect(defaultFilters.region).toBe('');
    expect(defaultFilters.country).toBe('');
  });

  it('has all boolean filters set to null', () => {
    expect(defaultFilters.limitedEdition).toBeNull();
    expect(defaultFilters.chillFiltered).toBeNull();
    expect(defaultFilters.naturalColor).toBeNull();
    expect(defaultFilters.isOpened).toBeNull();
  });

  it('has all range filters set to null', () => {
    expect(defaultFilters.ageMin).toBeNull();
    expect(defaultFilters.ageMax).toBeNull();
    expect(defaultFilters.abvMin).toBeNull();
    expect(defaultFilters.abvMax).toBeNull();
    expect(defaultFilters.ratingMin).toBeNull();
    expect(defaultFilters.ratingMax).toBeNull();
    expect(defaultFilters.priceMin).toBeNull();
    expect(defaultFilters.priceMax).toBeNull();
  });
});
