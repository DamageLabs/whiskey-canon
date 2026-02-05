import { useState, useMemo } from 'react';
import { Whiskey } from '../types';
import { formatCurrencyOrDash } from '../utils/formatCurrency';

interface WhiskeyTableProps {
  whiskeys: Whiskey[];
  onRowClick: (whiskey: Whiskey) => void;
  onEdit?: (whiskey: Whiskey) => void;
  onDelete?: (id: number) => void;
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
  selectionEnabled?: boolean;
}

type SortColumn = 'name' | 'type' | 'distillery' | 'region' | 'age' | 'abv' | 'proof' | 'size' | 'quantity' | 'msrp' | 'secondary_price' | 'rating';
type SortDirection = 'asc' | 'desc';

export function WhiskeyTable({
  whiskeys,
  onRowClick,
  onEdit,
  onDelete,
  selectedIds = new Set(),
  onSelectionChange,
  selectionEnabled = false
}: WhiskeyTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const allSelected = whiskeys.length > 0 && whiskeys.every(w => selectedIds.has(w.id));
  const someSelected = whiskeys.some(w => selectedIds.has(w.id)) && !allSelected;

  function handleSelectAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(whiskeys.map(w => w.id)));
    }
  }

  function handleSelectOne(id: number) {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  }

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const sortedWhiskeys = useMemo(() => {
    const sorted = [...whiskeys].sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];

      // Handle null/undefined values - put them at the end
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Number comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [whiskeys, sortColumn, sortDirection]);

  function renderSortIcon(column: SortColumn) {
    if (sortColumn !== column) {
      return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;
    }
    return sortDirection === 'asc' ? (
      <i className="bi bi-arrow-up ms-1"></i>
    ) : (
      <i className="bi bi-arrow-down ms-1"></i>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle">
        <thead style={{ backgroundColor: 'var(--amber-500)', color: 'white' }}>
          <tr>
            {selectionEnabled && (
              <th style={{ width: '40px' }} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )}
            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Name {renderSortIcon('name')}
            </th>
            <th onClick={() => handleSort('type')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Type {renderSortIcon('type')}
            </th>
            <th onClick={() => handleSort('distillery')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Distillery {renderSortIcon('distillery')}
            </th>
            <th onClick={() => handleSort('region')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Region {renderSortIcon('region')}
            </th>
            <th onClick={() => handleSort('age')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Age {renderSortIcon('age')}
            </th>
            <th onClick={() => handleSort('abv')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              ABV {renderSortIcon('abv')}
            </th>
            <th onClick={() => handleSort('proof')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Proof {renderSortIcon('proof')}
            </th>
            <th onClick={() => handleSort('size')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Size {renderSortIcon('size')}
            </th>
            <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Qty {renderSortIcon('quantity')}
            </th>
            <th onClick={() => handleSort('msrp')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              MSRP {renderSortIcon('msrp')}
            </th>
            <th onClick={() => handleSort('secondary_price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Secondary {renderSortIcon('secondary_price')}
            </th>
            <th onClick={() => handleSort('rating')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Rating {renderSortIcon('rating')}
            </th>
            {(onEdit || onDelete) && <th className="text-center">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedWhiskeys.map((whiskey) => (
            <tr
              key={whiskey.id}
              onClick={() => onRowClick(whiskey)}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedIds.has(whiskey.id) ? 'rgba(91, 155, 213, 0.1)' : undefined
              }}
            >
              {selectionEnabled && (
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.has(whiskey.id)}
                    onChange={() => handleSelectOne(whiskey.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              )}
              <td className="fw-bold" style={{ color: 'var(--amber-500)' }}>{whiskey.name}</td>
              <td>
                <span className="badge text-capitalize text-white" style={{ backgroundColor: 'var(--amber-500)' }}>{whiskey.type}</span>
              </td>
              <td>{whiskey.distillery}</td>
              <td>{whiskey.region || '-'}</td>
              <td>{whiskey.age ? `${whiskey.age} years` : '-'}</td>
              <td>{whiskey.abv ? `${whiskey.abv}%` : '-'}</td>
              <td>{whiskey.proof || '-'}</td>
              <td>{whiskey.size || '-'}</td>
              <td>{whiskey.quantity || '-'}</td>
              <td>{formatCurrencyOrDash(whiskey.msrp)}</td>
              <td>{formatCurrencyOrDash(whiskey.secondary_price)}</td>
              <td>{whiskey.rating ? `${whiskey.rating.toFixed(2)}/10` : '-'}</td>
              {(onEdit || onDelete) && (
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="btn-group btn-group-sm" role="group">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(whiskey)}
                        className="btn"
                        style={{ borderColor: 'var(--amber-500)', color: 'var(--amber-500)' }}
                        title="Edit"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(whiskey.id)}
                        className="btn btn-outline-danger"
                        title="Delete"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
