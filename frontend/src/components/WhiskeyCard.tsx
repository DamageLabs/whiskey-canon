import { Whiskey } from '../types';

interface WhiskeyCardProps {
  whiskey: Whiskey;
  onEdit?: (whiskey: Whiskey) => void;
  onDelete?: (id: number) => void;
}

export function WhiskeyCard({ whiskey, onEdit, onDelete }: WhiskeyCardProps) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-header text-white d-flex justify-content-between align-items-start" style={{ backgroundColor: '#5B9BD5' }}>
        <h5 className="card-title mb-0">{whiskey.name}</h5>
        <span className="badge bg-light text-capitalize" style={{ color: '#5B9BD5' }}>{whiskey.type}</span>
      </div>

      <div className="card-body">
        <div className="mb-3">
          <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
            <span className="text-muted">Distillery:</span>
            <strong>{whiskey.distillery}</strong>
          </div>

          {whiskey.region && (
            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
              <span className="text-muted">Region:</span>
              <strong>{whiskey.region}</strong>
            </div>
          )}

          {whiskey.age && (
            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
              <span className="text-muted">Age:</span>
              <strong>{whiskey.age} years</strong>
            </div>
          )}

          {whiskey.abv && (
            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
              <span className="text-muted">ABV:</span>
              <strong>{whiskey.abv}%</strong>
            </div>
          )}

          {whiskey.size && (
            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
              <span className="text-muted">Size:</span>
              <strong>{whiskey.size}</strong>
            </div>
          )}

          {whiskey.quantity !== null && whiskey.quantity !== undefined && (
            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
              <span className="text-muted">Quantity:</span>
              <strong>{whiskey.quantity}</strong>
            </div>
          )}

          {whiskey.msrp !== null && whiskey.msrp !== undefined && (
            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
              <span className="text-muted">MSRP:</span>
              <strong>${whiskey.msrp.toFixed(2)}</strong>
            </div>
          )}

          {whiskey.secondary_price !== null && whiskey.secondary_price !== undefined && (
            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
              <span className="text-muted">Secondary Price:</span>
              <strong>${whiskey.secondary_price.toFixed(2)}</strong>
            </div>
          )}

          {whiskey.rating !== null && whiskey.rating !== undefined && (
            <div className="d-flex justify-content-between pb-2">
              <span className="text-muted">Rating:</span>
              <strong style={{ color: '#5B9BD5' }}>{whiskey.rating.toFixed(2)}/10</strong>
            </div>
          )}
        </div>

        {whiskey.description && (
          <div className="mb-3">
            <p className="card-text text-muted small">{whiskey.description}</p>
          </div>
        )}

        {whiskey.tasting_notes && (
          <div className="alert py-2 px-3 mb-0 small" style={{ backgroundColor: '#E8F4FB', borderColor: '#5B9BD5', color: '#3A7BA8' }}>
            <strong>Tasting Notes:</strong> {whiskey.tasting_notes}
          </div>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="card-footer bg-white border-top">
          <div className="d-grid gap-2 d-md-flex">
            {onEdit && (
              <button onClick={() => onEdit(whiskey)} className="btn btn-sm flex-fill" style={{ borderColor: '#5B9BD5', color: '#5B9BD5' }}>
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(whiskey.id)} className="btn btn-sm btn-outline-danger flex-fill">
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
