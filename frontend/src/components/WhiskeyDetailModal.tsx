import { Whiskey } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface WhiskeyDetailModalProps {
  whiskey: Whiskey;
  onClose: () => void;
  onEdit?: (whiskey: Whiskey) => void;
  onDelete?: (id: number) => void;
}

export function WhiskeyDetailModal({ whiskey, onClose, onEdit, onDelete }: WhiskeyDetailModalProps) {
  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header text-white" style={{ backgroundColor: 'var(--amber-500)' }}>
            <h5 className="modal-title">{whiskey.name}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <span className="badge fs-6 text-capitalize text-white" style={{ backgroundColor: 'var(--amber-500)' }}>{whiskey.type}</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                  <small className="text-muted text-uppercase d-block mb-1">Distillery</small>
                  <strong>{whiskey.distillery}</strong>
                </div>
              </div>

              {whiskey.region && (
                <div className="col-md-6">
                  <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                    <small className="text-muted text-uppercase d-block mb-1">Region</small>
                    <strong>{whiskey.region}</strong>
                  </div>
                </div>
              )}

              {whiskey.age && (
                <div className="col-md-4">
                  <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                    <small className="text-muted text-uppercase d-block mb-1">Age</small>
                    <strong>{whiskey.age} years</strong>
                  </div>
                </div>
              )}

              {whiskey.abv && (
                <div className="col-md-4">
                  <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                    <small className="text-muted text-uppercase d-block mb-1">ABV</small>
                    <strong>{whiskey.abv}%</strong>
                  </div>
                </div>
              )}

              {whiskey.size && (
                <div className="col-md-4">
                  <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                    <small className="text-muted text-uppercase d-block mb-1">Size</small>
                    <strong>{whiskey.size}</strong>
                  </div>
                </div>
              )}

              {whiskey.quantity !== null && whiskey.quantity !== undefined && (
                <div className="col-md-4">
                  <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                    <small className="text-muted text-uppercase d-block mb-1">Quantity</small>
                    <strong>{whiskey.quantity}</strong>
                  </div>
                </div>
              )}

              {whiskey.msrp !== null && whiskey.msrp !== undefined && (
                <div className="col-md-4">
                  <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                    <small className="text-muted text-uppercase d-block mb-1">MSRP</small>
                    <strong>{formatCurrency(whiskey.msrp)}</strong>
                  </div>
                </div>
              )}

              {whiskey.secondary_price !== null && whiskey.secondary_price !== undefined && (
                <div className="col-md-4">
                  <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                    <small className="text-muted text-uppercase d-block mb-1">Secondary Price</small>
                    <strong>{formatCurrency(whiskey.secondary_price)}</strong>
                  </div>
                </div>
              )}

              {whiskey.rating !== null && whiskey.rating !== undefined && (
                <div className="col-md-12">
                  <div className="border-start border-4 ps-3" style={{ borderColor: 'var(--amber-500)' }}>
                    <small className="text-muted text-uppercase d-block mb-1">Rating</small>
                    <strong className="fs-5">{whiskey.rating.toFixed(2)}/10</strong>
                  </div>
                </div>
              )}
            </div>

            {whiskey.description && (
              <div className="mb-3">
                <h6 style={{ color: 'var(--amber-500)' }}>Description</h6>
                <p className="text-muted">{whiskey.description}</p>
              </div>
            )}

            {whiskey.tasting_notes && (
              <div className="alert mb-0" role="alert" style={{ backgroundColor: '#E8F4FB', borderColor: 'var(--amber-500)', color: '#3A7BA8' }}>
                <h6 className="alert-heading" style={{ color: 'var(--amber-500)' }}>Tasting Notes</h6>
                <p className="mb-0">{whiskey.tasting_notes}</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {onEdit && (
              <button onClick={() => onEdit(whiskey)} className="btn text-white" style={{ backgroundColor: 'var(--amber-500)' }}>
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(whiskey.id)} className="btn btn-danger">
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
