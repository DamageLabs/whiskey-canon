import { Whiskey, WhiskeyType } from '../types';

interface WhiskeyStatsProps {
  whiskeys: Whiskey[];
}

export function WhiskeyStats({ whiskeys }: WhiskeyStatsProps) {
  // Calculate statistics
  const totalCount = whiskeys.length;

  const typeCount = whiskeys.reduce((acc, whiskey) => {
    acc[whiskey.type] = (acc[whiskey.type] || 0) + 1;
    return acc;
  }, {} as Record<WhiskeyType, number>);

  const averageRating = whiskeys.length > 0
    ? whiskeys
        .filter(w => w.rating !== null && w.rating !== undefined)
        .reduce((sum, w) => sum + (w.rating || 0), 0) /
      whiskeys.filter(w => w.rating !== null && w.rating !== undefined).length
    : 0;

  const averageAge = whiskeys.length > 0
    ? whiskeys
        .filter(w => w.age !== null && w.age !== undefined)
        .reduce((sum, w) => sum + (w.age || 0), 0) /
      whiskeys.filter(w => w.age !== null && w.age !== undefined).length
    : 0;

  const averageABV = whiskeys.length > 0
    ? whiskeys
        .filter(w => w.abv !== null && w.abv !== undefined)
        .reduce((sum, w) => sum + (w.abv || 0), 0) /
      whiskeys.filter(w => w.abv !== null && w.abv !== undefined).length
    : 0;

  // Calculate total MSRP value (msrp * quantity)
  const totalMSRPValue = whiskeys.reduce((sum, w) => {
    if (w.msrp && w.quantity) {
      return sum + (w.msrp * w.quantity);
    }
    return sum;
  }, 0);

  // Calculate total Secondary market value (secondary_price * quantity)
  const totalSecondaryValue = whiskeys.reduce((sum, w) => {
    if (w.secondary_price && w.quantity) {
      return sum + (w.secondary_price * w.quantity);
    }
    return sum;
  }, 0);

  return (
    <div className="row g-3 mb-4">
      {/* Total Count Card */}
      <div className="col-12 col-md-6 col-lg-4 col-xl-2">
        <div className="card h-100" style={{ borderColor: '#5B9BD5' }}>
          <div className="card-body text-center">
            <h6 className="card-subtitle mb-2 text-muted">Total Whiskeys</h6>
            <h2 className="card-title display-4 mb-0" style={{ color: '#5B9BD5' }}>{totalCount}</h2>
          </div>
        </div>
      </div>

      {/* Total MSRP Value Card */}
      <div className="col-12 col-md-6 col-lg-4 col-xl-2">
        <div className="card border-success h-100">
          <div className="card-body text-center">
            <h6 className="card-subtitle mb-2 text-muted">MSRP Value</h6>
            <h3 className="card-title text-success mb-0">
              {totalMSRPValue > 0 ? `$${totalMSRPValue.toFixed(2)}` : 'N/A'}
            </h3>
          </div>
        </div>
      </div>

      {/* Total Secondary Value Card */}
      <div className="col-12 col-md-6 col-lg-4 col-xl-2">
        <div className="card border-danger h-100">
          <div className="card-body text-center">
            <h6 className="card-subtitle mb-2 text-muted">Secondary Value</h6>
            <h3 className="card-title text-danger mb-0">
              {totalSecondaryValue > 0 ? `$${totalSecondaryValue.toFixed(2)}` : 'N/A'}
            </h3>
          </div>
        </div>
      </div>

      {/* Average Rating Card */}
      <div className="col-12 col-md-6 col-lg-4 col-xl-2">
        <div className="card border-warning h-100">
          <div className="card-body text-center">
            <h6 className="card-subtitle mb-2 text-muted">Avg Rating</h6>
            <h3 className="card-title text-warning mb-0">
              {averageRating > 0 ? averageRating.toFixed(2) : 'N/A'}
            </h3>
            {averageRating > 0 && <small className="text-muted">/ 10</small>}
          </div>
        </div>
      </div>

      {/* Average Age Card */}
      <div className="col-12 col-md-6 col-lg-4 col-xl-2">
        <div className="card border-primary h-100">
          <div className="card-body text-center">
            <h6 className="card-subtitle mb-2 text-muted">Avg Age</h6>
            <h3 className="card-title text-primary mb-0">
              {averageAge > 0 ? Math.round(averageAge) : 'N/A'}
            </h3>
            {averageAge > 0 && <small className="text-muted">years</small>}
          </div>
        </div>
      </div>

      {/* Average ABV Card */}
      <div className="col-12 col-md-6 col-lg-4 col-xl-2">
        <div className="card border-info h-100">
          <div className="card-body text-center">
            <h6 className="card-subtitle mb-2 text-muted">Avg ABV</h6>
            <h3 className="card-title text-info mb-0">
              {averageABV > 0 ? averageABV.toFixed(1) : 'N/A'}
            </h3>
            {averageABV > 0 && <small className="text-muted">%</small>}
          </div>
        </div>
      </div>

      {/* Type Breakdown Card */}
      <div className="col-12">
        <div className="card">
          <div className="card-header text-white" style={{ backgroundColor: '#5B9BD5' }}>
            <h6 className="mb-0">Whiskey Types Breakdown</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {Object.values(WhiskeyType).map((type) => {
                const count = typeCount[type] || 0;
                const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

                return count > 0 ? (
                  <div key={type} className="col-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="text-center">
                      <div className="mb-2">
                        <span className="badge text-capitalize fs-6 text-white" style={{ backgroundColor: '#5B9BD5' }}>{type}</span>
                      </div>
                      <div className="d-flex flex-column align-items-center">
                        <h4 className="mb-1">{count}</h4>
                        <div className="progress w-100" style={{ height: '8px' }}>
                          <div
                            className="progress-bar"
                            style={{ backgroundColor: '#5B9BD5', width: `${percentage}%` }}
                            role="progressbar"
                            aria-valuenow={percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <small className="text-muted mt-1">{percentage.toFixed(0)}%</small>
                      </div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
