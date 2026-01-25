import { useState, useEffect } from 'react';
import { whiskeyAPI } from '../services/api';
import { Whiskey, WhiskeyType, WhiskeyStatus, CreateWhiskeyData } from '../types';

interface WhiskeyFormProps {
  whiskey?: Whiskey | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function WhiskeyForm({ whiskey, onClose, onSuccess }: WhiskeyFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<CreateWhiskeyData>({
    name: '',
    type: WhiskeyType.BOURBON,
    distillery: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (whiskey) {
      setFormData({
        name: whiskey.name,
        type: whiskey.type,
        distillery: whiskey.distillery,
        region: whiskey.region || '',
        age: whiskey.age,
        abv: whiskey.abv,
        size: whiskey.size || '',
        quantity: whiskey.quantity,
        msrp: whiskey.msrp,
        secondary_price: whiskey.secondary_price,
        description: whiskey.description || '',
        tasting_notes: whiskey.tasting_notes || '',
        rating: whiskey.rating,

        // Purchase & Acquisition
        purchase_date: whiskey.purchase_date || '',
        purchase_price: whiskey.purchase_price,
        purchase_location: whiskey.purchase_location || '',
        bottle_code: whiskey.bottle_code || '',

        // Inventory Management
        is_opened: whiskey.is_opened || false,
        date_opened: whiskey.date_opened || '',
        remaining_volume: whiskey.remaining_volume,
        storage_location: whiskey.storage_location || '',
        status: whiskey.status || WhiskeyStatus.IN_COLLECTION,

        // Cask & Production
        cask_type: whiskey.cask_type || '',
        cask_finish: whiskey.cask_finish || '',
        barrel_number: whiskey.barrel_number || '',
        bottle_number: whiskey.bottle_number || '',
        vintage_year: whiskey.vintage_year || '',
        bottled_date: whiskey.bottled_date || '',

        // Enhanced Tasting
        color: whiskey.color || '',
        nose_notes: whiskey.nose_notes || '',
        palate_notes: whiskey.palate_notes || '',
        finish_notes: whiskey.finish_notes || '',
        times_tasted: whiskey.times_tasted || 0,
        last_tasted_date: whiskey.last_tasted_date || '',
        food_pairings: whiskey.food_pairings || '',

        // Investment & Value
        current_market_value: whiskey.current_market_value,
        value_gain_loss: whiskey.value_gain_loss,
        is_investment_bottle: whiskey.is_investment_bottle || false,

        // Additional Metadata
        country: whiskey.country || '',
        mash_bill: whiskey.mash_bill || '',
        proof: whiskey.proof,
        limited_edition: whiskey.limited_edition || false,
        awards: whiskey.awards || '',
        chill_filtered: whiskey.chill_filtered,
        natural_color: whiskey.natural_color,

        // Visual & Documentation
        image_url: whiskey.image_url || '',
        label_image_url: whiskey.label_image_url || '',
        receipt_image_url: whiskey.receipt_image_url || '',

        // Social & Sharing
        is_for_sale: whiskey.is_for_sale || false,
        asking_price: whiskey.asking_price,
        is_for_trade: whiskey.is_for_trade || false,
        shared_with: whiskey.shared_with || '',
        private_notes: whiskey.private_notes || '',
      });
    }
  }, [whiskey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Remove undefined, null values, and empty strings
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) =>
          value !== undefined && value !== null && value !== ''
        )
      );

      if (whiskey) {
        await whiskeyAPI.update(whiskey.id, cleanData);
      } else {
        await whiskeyAPI.create(cleanData as CreateWhiskeyData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save whiskey');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (value === '') {
      processedValue = undefined;
    } else if (type === 'number') {
      if (name === 'age' || name === 'quantity' || name === 'times_tasted') {
        processedValue = parseInt(value, 10);
      } else {
        processedValue = parseFloat(value);
      }
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'date') {
      processedValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  }

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h5 className="modal-title">{whiskey ? 'Edit Whiskey' : 'Add New Whiskey'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} id="whiskeyForm">
              {/* Tab Navigation */}
              <ul className="nav nav-tabs mb-3" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('basic')}
                  >
                    Basic Info *
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'purchase' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('purchase')}
                  >
                    Purchase & Inventory
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'production' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('production')}
                  >
                    Production Details
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'tasting' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('tasting')}
                  >
                    Tasting Notes
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'investment' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('investment')}
                  >
                    Investment & Value
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'media' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('media')}
                  >
                    Photos & Docs
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'social' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('social')}
                  >
                    Trading & Notes
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content">
                {/* BASIC INFO TAB */}
                {activeTab === 'basic' && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label">Name *</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="type" className="form-label">Type *</label>
                      <select
                        id="type"
                        name="type"
                        className="form-select"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        {Object.values(WhiskeyType).map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="distillery" className="form-label">Distillery *</label>
                      <input
                        id="distillery"
                        name="distillery"
                        type="text"
                        className="form-control"
                        value={formData.distillery}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="region" className="form-label">Region</label>
                      <input
                        id="region"
                        name="region"
                        type="text"
                        className="form-control"
                        value={formData.region || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="country" className="form-label">Country</label>
                      <input
                        id="country"
                        name="country"
                        type="text"
                        className="form-control"
                        value={formData.country || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="age" className="form-label">Age (years)</label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        min="0"
                        className="form-control"
                        value={formData.age || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="abv" className="form-label">ABV (%)</label>
                      <input
                        id="abv"
                        name="abv"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-control"
                        value={formData.abv || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="proof" className="form-label">Proof</label>
                      <input
                        id="proof"
                        name="proof"
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-control"
                        value={formData.proof || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="size" className="form-label">Size</label>
                      <input
                        id="size"
                        name="size"
                        type="text"
                        placeholder="e.g., 750ml, 1L"
                        className="form-control"
                        value={formData.size || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="rating" className="form-label">Rating (0-10)</label>
                      <input
                        id="rating"
                        name="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="form-control"
                        value={formData.rating || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="mash_bill" className="form-label">Mash Bill</label>
                      <input
                        id="mash_bill"
                        name="mash_bill"
                        type="text"
                        placeholder="e.g., 75% corn, 21% rye, 4% malted barley"
                        className="form-control"
                        value={formData.mash_bill || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="awards" className="form-label">Awards</label>
                      <input
                        id="awards"
                        name="awards"
                        type="text"
                        placeholder="e.g., Double Gold - SFWSC 2024"
                        className="form-control"
                        value={formData.awards || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          id="limited_edition"
                          name="limited_edition"
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.limited_edition || false}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="limited_edition">
                          Limited Edition
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          id="chill_filtered"
                          name="chill_filtered"
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.chill_filtered || false}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="chill_filtered">
                          Chill Filtered
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          id="natural_color"
                          name="natural_color"
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.natural_color || false}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="natural_color">
                          Natural Color
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        value={formData.description || ''}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* PURCHASE & INVENTORY TAB */}
                {activeTab === 'purchase' && (
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="text-muted">Purchase Information</h6>
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="purchase_date" className="form-label">Purchase Date</label>
                      <input
                        id="purchase_date"
                        name="purchase_date"
                        type="date"
                        className="form-control"
                        value={formData.purchase_date || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="purchase_price" className="form-label">Purchase Price ($)</label>
                      <input
                        id="purchase_price"
                        name="purchase_price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.purchase_price || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="purchase_location" className="form-label">Purchase Location</label>
                      <input
                        id="purchase_location"
                        name="purchase_location"
                        type="text"
                        placeholder="Store name, online, auction, etc."
                        className="form-control"
                        value={formData.purchase_location || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="quantity" className="form-label">Quantity</label>
                      <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="0"
                        className="form-control"
                        value={formData.quantity || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="msrp" className="form-label">MSRP ($)</label>
                      <input
                        id="msrp"
                        name="msrp"
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.msrp || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="secondary_price" className="form-label">Secondary Price ($)</label>
                      <input
                        id="secondary_price"
                        name="secondary_price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.secondary_price || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="text-muted">Inventory Management</h6>
                    </div>

                    <div className="col-md-3">
                      <label htmlFor="status" className="form-label">Status</label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        value={formData.status || WhiskeyStatus.IN_COLLECTION}
                        onChange={handleChange}
                      >
                        {Object.values(WhiskeyStatus).map((status) => (
                          <option key={status} value={status}>
                            {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label htmlFor="storage_location" className="form-label">Storage Location</label>
                      <input
                        id="storage_location"
                        name="storage_location"
                        type="text"
                        placeholder="e.g., Cabinet A, Shelf 2"
                        className="form-control"
                        value={formData.storage_location || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label htmlFor="date_opened" className="form-label">Date Opened</label>
                      <input
                        id="date_opened"
                        name="date_opened"
                        type="date"
                        className="form-control"
                        value={formData.date_opened || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label htmlFor="remaining_volume" className="form-label">Remaining Volume (%)</label>
                      <input
                        id="remaining_volume"
                        name="remaining_volume"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        className="form-control"
                        value={formData.remaining_volume || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <div className="form-check mt-4">
                        <input
                          id="is_opened"
                          name="is_opened"
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.is_opened || false}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="is_opened">
                          Bottle is opened
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* PRODUCTION DETAILS TAB */}
                {activeTab === 'production' && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="cask_type" className="form-label">Cask Type</label>
                      <input
                        id="cask_type"
                        name="cask_type"
                        type="text"
                        placeholder="e.g., Ex-bourbon, Sherry, Port"
                        className="form-control"
                        value={formData.cask_type || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="cask_finish" className="form-label">Cask Finish</label>
                      <input
                        id="cask_finish"
                        name="cask_finish"
                        type="text"
                        placeholder="Secondary cask finish"
                        className="form-control"
                        value={formData.cask_finish || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="barrel_number" className="form-label">Barrel Number</label>
                      <input
                        id="barrel_number"
                        name="barrel_number"
                        type="text"
                        placeholder="For single barrel picks"
                        className="form-control"
                        value={formData.barrel_number || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="bottle_number" className="form-label">Bottle Number</label>
                      <input
                        id="bottle_number"
                        name="bottle_number"
                        type="text"
                        placeholder="e.g., 234/5000"
                        className="form-control"
                        value={formData.bottle_number || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="vintage_year" className="form-label">Vintage Year</label>
                      <input
                        id="vintage_year"
                        name="vintage_year"
                        type="text"
                        placeholder="Distillation year"
                        className="form-control"
                        value={formData.vintage_year || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="bottled_date" className="form-label">Bottled Date</label>
                      <input
                        id="bottled_date"
                        name="bottled_date"
                        type="date"
                        className="form-control"
                        value={formData.bottled_date || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-12">
                      <label htmlFor="bottle_code" className="form-label">Bottle Code</label>
                      <input
                        id="bottle_code"
                        name="bottle_code"
                        type="text"
                        placeholder="Laser code or batch number"
                        className="form-control"
                        value={formData.bottle_code || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {/* TASTING NOTES TAB */}
                {activeTab === 'tasting' && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="color" className="form-label">Color</label>
                      <input
                        id="color"
                        name="color"
                        type="text"
                        placeholder="e.g., Deep amber, Pale gold"
                        className="form-control"
                        value={formData.color || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label htmlFor="times_tasted" className="form-label">Times Tasted</label>
                      <input
                        id="times_tasted"
                        name="times_tasted"
                        type="number"
                        min="0"
                        className="form-control"
                        value={formData.times_tasted || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label htmlFor="last_tasted_date" className="form-label">Last Tasted</label>
                      <input
                        id="last_tasted_date"
                        name="last_tasted_date"
                        type="date"
                        className="form-control"
                        value={formData.last_tasted_date || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="nose_notes" className="form-label">Nose / Aroma</label>
                      <textarea
                        id="nose_notes"
                        name="nose_notes"
                        className="form-control"
                        placeholder="Aromas detected on the nose..."
                        value={formData.nose_notes || ''}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="palate_notes" className="form-label">Palate / Taste</label>
                      <textarea
                        id="palate_notes"
                        name="palate_notes"
                        className="form-control"
                        placeholder="Flavors on the palate..."
                        value={formData.palate_notes || ''}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="finish_notes" className="form-label">Finish</label>
                      <textarea
                        id="finish_notes"
                        name="finish_notes"
                        className="form-control"
                        placeholder="The finish and aftertaste..."
                        value={formData.finish_notes || ''}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="tasting_notes" className="form-label">General Tasting Notes</label>
                      <textarea
                        id="tasting_notes"
                        name="tasting_notes"
                        className="form-control"
                        placeholder="Overall tasting experience..."
                        value={formData.tasting_notes || ''}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="food_pairings" className="form-label">Food Pairings</label>
                      <textarea
                        id="food_pairings"
                        name="food_pairings"
                        className="form-control"
                        placeholder="Recommended foods, cigars, etc."
                        value={formData.food_pairings || ''}
                        onChange={handleChange}
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {/* INVESTMENT & VALUE TAB */}
                {activeTab === 'investment' && (
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="current_market_value" className="form-label">Current Market Value ($)</label>
                      <input
                        id="current_market_value"
                        name="current_market_value"
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.current_market_value || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="value_gain_loss" className="form-label">Value Gain/Loss ($)</label>
                      <input
                        id="value_gain_loss"
                        name="value_gain_loss"
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.value_gain_loss || ''}
                        onChange={handleChange}
                        readOnly
                        placeholder="Auto-calculated"
                      />
                    </div>

                    <div className="col-md-4">
                      <div className="form-check mt-4">
                        <input
                          id="is_investment_bottle"
                          name="is_investment_bottle"
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.is_investment_bottle || false}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="is_investment_bottle">
                          Investment Bottle
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="alert alert-info">
                        <strong>Investment Tracking:</strong> Use this section to track the investment value of your bottles.
                        Current market value can be updated manually as market prices change.
                      </div>
                    </div>
                  </div>
                )}

                {/* PHOTOS & DOCS TAB */}
                {activeTab === 'media' && (
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="image_url" className="form-label">Bottle Image URL</label>
                      <input
                        id="image_url"
                        name="image_url"
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/bottle.jpg"
                        value={formData.image_url || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="label_image_url" className="form-label">Label Image URL</label>
                      <input
                        id="label_image_url"
                        name="label_image_url"
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/label.jpg"
                        value={formData.label_image_url || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="receipt_image_url" className="form-label">Receipt Image URL</label>
                      <input
                        id="receipt_image_url"
                        name="receipt_image_url"
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/receipt.jpg"
                        value={formData.receipt_image_url || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12">
                      <div className="alert alert-info">
                        <strong>Photo URLs:</strong> Enter the URL of images hosted online. Future updates may include direct file uploads.
                      </div>
                    </div>
                  </div>
                )}

                {/* TRADING & NOTES TAB */}
                {activeTab === 'social' && (
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="text-muted">Trading & Selling</h6>
                    </div>

                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          id="is_for_sale"
                          name="is_for_sale"
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.is_for_sale || false}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="is_for_sale">
                          For Sale
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          id="is_for_trade"
                          name="is_for_trade"
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.is_for_trade || false}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="is_for_trade">
                          For Trade
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="asking_price" className="form-label">Asking Price ($)</label>
                      <input
                        id="asking_price"
                        name="asking_price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.asking_price || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="text-muted">Sharing & Notes</h6>
                    </div>

                    <div className="col-12">
                      <label htmlFor="shared_with" className="form-label">Shared With</label>
                      <textarea
                        id="shared_with"
                        name="shared_with"
                        className="form-control"
                        placeholder="People or occasions you've shared this with..."
                        value={formData.shared_with || ''}
                        onChange={handleChange}
                        rows={2}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="private_notes" className="form-label">Private Notes</label>
                      <textarea
                        id="private_notes"
                        name="private_notes"
                        className="form-control"
                        placeholder="Personal notes not for public display..."
                        value={formData.private_notes || ''}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              form="whiskeyForm"
              className="btn text-white"
              style={{ backgroundColor: 'var(--amber-500)' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : whiskey ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
