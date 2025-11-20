import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/EnhancedStats.css';

interface EnhancedStatsProps {
  onLoad?: () => void;
}

export function EnhancedStats({ onLoad }: EnhancedStatsProps) {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'collection' | 'quality' | 'tasting'>('overview');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStatistics(data.statistics);
      onLoad?.();
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!statistics) return null;

  const COLORS = ['#5B9BD5', '#83B4E0', '#70AD47', '#FFC000', '#C5504B', '#9E7B9B', '#4BACC6', '#F79646'];

  const formatCurrency = (value: number) => {
    return value ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
  };

  const formatNumber = (value: number) => {
    return value?.toLocaleString() || '0';
  };

  return (
    <div className="enhanced-stats">
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'financial' ? 'active' : ''}`} onClick={() => setActiveTab('financial')}>
            Financial
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => setActiveTab('collection')}>
            Collection
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'quality' ? 'active' : ''}`} onClick={() => setActiveTab('quality')}>
            Quality
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'tasting' ? 'active' : ''}`} onClick={() => setActiveTab('tasting')}>
            Tasting
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="stats-content">
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-label">Total Bottles</div>
                <div className="stat-value">{formatNumber(statistics.financial.total_bottles)}</div>
                <div className="stat-sublabel">{formatNumber(statistics.financial.total_units)} units</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card stat-card-success">
                <div className="stat-label">Collection Value</div>
                <div className="stat-value">{formatCurrency(statistics.financial.total_current_value)}</div>
                <div className="stat-sublabel">Current Market</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card stat-card-info">
                <div className="stat-label">Total Spent</div>
                <div className="stat-value">{formatCurrency(statistics.financial.total_spent)}</div>
                <div className="stat-sublabel">Purchase Price</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className={`stat-card ${statistics.financial.total_gain_loss >= 0 ? 'stat-card-success' : 'stat-card-danger'}`}>
                <div className="stat-label">Gain/Loss</div>
                <div className="stat-value">{formatCurrency(statistics.financial.total_gain_loss)}</div>
                <div className="stat-sublabel">
                  {statistics.financial.total_gain_loss >= 0 ? '↑' : '↓'} ROI
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">Inventory Status</h6>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'In Collection', value: statistics.inventory.in_collection_count || 0 },
                          { name: 'Consumed', value: statistics.inventory.consumed_count || 0 },
                          { name: 'Sold', value: statistics.inventory.sold_count || 0 },
                          { name: 'Traded', value: statistics.inventory.traded_count || 0 },
                          { name: 'Gifted', value: statistics.inventory.gifted_count || 0 },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2, 3, 4].map((index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">Bottle Status</h6>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-6 mb-3">
                      <div className="stat-mini">
                        <div className="stat-mini-value">{formatNumber(statistics.inventory.opened_count)}</div>
                        <div className="stat-mini-label">Opened</div>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="stat-mini">
                        <div className="stat-mini-value">{formatNumber(statistics.inventory.unopened_count)}</div>
                        <div className="stat-mini-label">Unopened</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-mini">
                        <div className="stat-mini-value">{statistics.inventory.avg_remaining_volume?.toFixed(0) || 0}%</div>
                        <div className="stat-mini-label">Avg Remaining</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-mini stat-mini-warning">
                        <div className="stat-mini-value">{formatNumber(statistics.inventory.running_low_count)}</div>
                        <div className="stat-mini-label">Running Low</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Type Distribution */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Whiskey Types</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.composition.typeDistribution}>
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#5B9BD5" name="Bottles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="stats-content">
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="stat-card">
                <div className="stat-label">Total MSRP</div>
                <div className="stat-value">{formatCurrency(statistics.financial.total_msrp)}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card stat-card-warning">
                <div className="stat-label">Secondary Market</div>
                <div className="stat-value">{formatCurrency(statistics.financial.total_secondary_value)}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card stat-card-info">
                <div className="stat-label">Avg Bottle Value</div>
                <div className="stat-value">{formatCurrency(statistics.financial.avg_current_value)}</div>
              </div>
            </div>
          </div>

          {/* Most Valuable Bottles */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Most Valuable Bottles</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Distillery</th>
                      <th>Current Value</th>
                      <th>Purchase Price</th>
                      <th>Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.financial.mostValuable.slice(0, 10).map((bottle: any) => (
                      <tr key={bottle.id}>
                        <td>{bottle.name}</td>
                        <td>{bottle.distillery}</td>
                        <td>{formatCurrency(bottle.current_market_value)}</td>
                        <td>{formatCurrency(bottle.purchase_price)}</td>
                        <td className={bottle.value_gain >= 0 ? 'text-success' : 'text-danger'}>
                          {formatCurrency(bottle.value_gain)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Best ROI */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Best Return on Investment</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Distillery</th>
                      <th>Purchase Price</th>
                      <th>Current Value</th>
                      <th>ROI %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.financial.bestROI.slice(0, 10).map((bottle: any) => (
                      <tr key={bottle.id}>
                        <td>{bottle.name}</td>
                        <td>{bottle.distillery}</td>
                        <td>{formatCurrency(bottle.purchase_price)}</td>
                        <td>{formatCurrency(bottle.current_market_value)}</td>
                        <td className="text-success fw-bold">+{bottle.roi_percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Tab */}
      {activeTab === 'collection' && (
        <div className="stats-content">
          {/* Top Distilleries */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Top Distilleries</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statistics.composition.topDistilleries} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="distillery" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#5B9BD5" name="Bottles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Age Distribution</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.composition.ageDistribution}>
                  <XAxis dataKey="age_range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#70AD47" name="Bottles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Country Distribution */}
          {statistics.composition.countryDistribution.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Country Distribution</h6>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statistics.composition.countryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.country}: ${entry.count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statistics.composition.countryDistribution.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Special Items */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Special & Rare Items</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-4 mb-3">
                  <div className="stat-mini">
                    <div className="stat-mini-value">{formatNumber(statistics.special.limited_edition_count)}</div>
                    <div className="stat-mini-label">Limited Edition</div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-mini">
                    <div className="stat-mini-value">{formatNumber(statistics.special.single_barrel_count)}</div>
                    <div className="stat-mini-label">Single Barrel</div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-mini">
                    <div className="stat-mini-value">{formatNumber(statistics.special.award_winning_count)}</div>
                    <div className="stat-mini-label">Award Winners</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="stat-mini">
                    <div className="stat-mini-value">{formatNumber(statistics.special.non_chill_filtered_count)}</div>
                    <div className="stat-mini-label">Non-Chill Filtered</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="stat-mini">
                    <div className="stat-mini-value">{formatNumber(statistics.special.natural_color_count)}</div>
                    <div className="stat-mini-label">Natural Color</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Tab */}
      {activeTab === 'quality' && (
        <div className="stats-content">
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-label">Average Rating</div>
                <div className="stat-value">{statistics.quality.avg_rating?.toFixed(1) || 'N/A'}</div>
                <div className="stat-sublabel">out of 10</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card stat-card-success">
                <div className="stat-label">Highest Rating</div>
                <div className="stat-value">{statistics.quality.highest_rating || 'N/A'}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card stat-card-warning">
                <div className="stat-label">Lowest Rating</div>
                <div className="stat-value">{statistics.quality.lowest_rating || 'N/A'}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card stat-card-info">
                <div className="stat-label">Rated Bottles</div>
                <div className="stat-value">{formatNumber(statistics.quality.rated_count)}</div>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Rating Distribution</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.quality.ratingDistribution}>
                  <XAxis dataKey="rating_bucket" label={{ value: 'Rating', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FFC000" name="Bottles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Highest Rated */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Highest Rated Bottles</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Distillery</th>
                      <th>Type</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.quality.highestRated.map((bottle: any) => (
                      <tr key={bottle.id}>
                        <td>{bottle.name}</td>
                        <td>{bottle.distillery}</td>
                        <td className="text-capitalize">{bottle.type}</td>
                        <td>
                          <span className="badge bg-warning text-dark">{bottle.rating}/10</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasting Tab */}
      {activeTab === 'tasting' && (
        <div className="stats-content">
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="stat-card">
                <div className="stat-label">Total Tastings</div>
                <div className="stat-value">{formatNumber(statistics.tasting.total_tasting_sessions)}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card stat-card-info">
                <div className="stat-label">With Tasting Notes</div>
                <div className="stat-value">{formatNumber(statistics.tasting.bottles_with_notes)}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card stat-card-success">
                <div className="stat-label">With Food Pairings</div>
                <div className="stat-value">{formatNumber(statistics.tasting.bottles_with_pairings)}</div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="stat-mini">
                <div className="stat-mini-value">{formatNumber(statistics.tasting.bottles_with_nose_notes)}</div>
                <div className="stat-mini-label">Nose Notes</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-mini">
                <div className="stat-mini-value">{formatNumber(statistics.tasting.bottles_with_palate_notes)}</div>
                <div className="stat-mini-label">Palate Notes</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-mini">
                <div className="stat-mini-value">{formatNumber(statistics.tasting.bottles_with_finish_notes)}</div>
                <div className="stat-mini-label">Finish Notes</div>
              </div>
            </div>
          </div>

          {/* Most Tasted */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Most Tasted Bottles</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Distillery</th>
                      <th>Times Tasted</th>
                      <th>Last Tasted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.tasting.mostTasted.map((bottle: any) => (
                      <tr key={bottle.id}>
                        <td>{bottle.name}</td>
                        <td>{bottle.distillery}</td>
                        <td>
                          <span className="badge bg-primary">{bottle.times_tasted}</span>
                        </td>
                        <td>{bottle.last_tasted_date ? new Date(bottle.last_tasted_date).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
