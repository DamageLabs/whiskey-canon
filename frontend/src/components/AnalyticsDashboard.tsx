import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { statisticsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

interface Statistics {
  financial: any;
  inventory: any;
  composition: any;
  quality: any;
  acquisition: any;
  special: any;
  tasting: any;
  sharing: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function AnalyticsDashboard() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await statisticsAPI.getAll();
      setStatistics(data.statistics);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
      console.error('Statistics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
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

  if (!statistics) {
    return null;
  }

  return (
    <div className="analytics-dashboard">
      <h2 className="mb-4">📊 Collection Analytics</h2>

      {/* Financial Overview Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Total Value</h6>
              <h3 className="card-title text-success">
                {formatCurrency(statistics.financial.total_secondary_value || 0)}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Total Spent</h6>
              <h3 className="card-title text-primary">
                {formatCurrency(statistics.financial.total_spent || 0)}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Gain/Loss</h6>
              <h3 className={`card-title ${(statistics.financial.total_gain_loss || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                {(statistics.financial.total_gain_loss || 0) >= 0 ? '+' : ''}
                {formatCurrency(statistics.financial.total_gain_loss || 0)}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Avg Rating</h6>
              <h3 className="card-title text-warning">
                {(statistics.quality.avg_rating || 0).toFixed(2)} / 10
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Type Distribution - Pie Chart */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Collection by Type</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.composition.typeDistribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {statistics.composition.typeDistribution.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Most Valuable Bottles - Bar Chart */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Top 10 Most Valuable</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.financial.mostValuable.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={10} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="secondary_price" fill="#8884d8" name="Secondary Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution - Bar Chart */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Rating Distribution</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.quality.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating_bucket" label={{ value: 'Rating (out of 10)', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" name="Number of Bottles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Age Distribution - Bar Chart */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Age Distribution</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.composition.ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age_range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" name="Number of Bottles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Best ROI - Bar Chart */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Top 10 Best ROI (Return on Investment)</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.financial.bestROI.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={10} />
                  <YAxis label={{ value: 'ROI %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                  <Bar dataKey="roi_percentage" fill="#00C49F" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Distilleries - Bar Chart */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Top 10 Distilleries by Count</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.composition.topDistilleries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="distillery" angle={-45} textAnchor="end" height={100} fontSize={11} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF8042" name="Number of Bottles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Inventory Status</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Opened
                  <span className="badge bg-warning rounded-pill">{statistics.inventory.opened_count || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Unopened
                  <span className="badge bg-success rounded-pill">{statistics.inventory.unopened_count || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Running Low (&lt;25%)
                  <span className="badge bg-danger rounded-pill">{statistics.inventory.running_low_count || 0}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Special Items</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Limited Edition
                  <span className="badge bg-primary rounded-pill">{statistics.special.limited_edition_count || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Single Barrel
                  <span className="badge bg-info rounded-pill">{statistics.special.single_barrel_count || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Award Winners
                  <span className="badge bg-warning rounded-pill">{statistics.special.award_winning_count || 0}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Tasting Stats</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Total Tastings
                  <span className="badge bg-success rounded-pill">{statistics.tasting.total_tasting_sessions || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  With Notes
                  <span className="badge bg-info rounded-pill">{statistics.tasting.bottles_with_notes || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  With Pairings
                  <span className="badge bg-warning rounded-pill">{statistics.tasting.bottles_with_pairings || 0}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Value by Type */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Total Value by Type</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.composition.typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total_value" fill="#8884d8" name="Total Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
