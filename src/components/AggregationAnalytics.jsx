import React, { useState, useEffect } from 'react';

const AggregationAnalytics = ({ sessionId }) => {
  const [analytics, setAnalytics] = useState({
    totalProjects: 247,
    totalMW: 3420,
    totalMWh: 9850,
    projectsByDuration: {
      '1h': 89,
      '2h': 76,
      '4h': 58,
      '8h': 24
    },
    currentAggregation: 9.85 // in GWh
  });

  // Price curve calculation: exponential decay from €251 to €27
  const calculatePrice = (aggregationGWh) => {
    const minPrice = 27;
    const maxPrice = 251;
    const maxAggregation = 16; // GWh
    const minAggregation = 0.01; // GWh
    
    if (aggregationGWh <= minAggregation) return maxPrice;
    if (aggregationGWh >= maxAggregation) return minPrice;
    
    // Exponential decay formula
    const normalizedPosition = (aggregationGWh - minAggregation) / (maxAggregation - minAggregation);
    const decayFactor = Math.pow(normalizedPosition, 0.3); // Adjust curve shape
    return maxPrice - ((maxPrice - minPrice) * decayFactor);
  };

  const currentPrice = calculatePrice(analytics.currentAggregation);
  const fillPercentage = (analytics.currentAggregation / 16) * 100;

  return (
    <div style={{
      padding: '20px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{
          background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 10px 0',
          textAlign: 'center'
        }}>
          Market Aggregation
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          textAlign: 'center',
          margin: 0,
          lineHeight: '1.4'
        }}>
          Real-time project aggregation driving economies of scale
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        <StatCard 
          title="Projects" 
          value={analytics.totalProjects.toLocaleString()} 
          icon="📊"
        />
        <StatCard 
          title="Total MW" 
          value={analytics.totalMW.toLocaleString()} 
          icon="⚡"
        />
        <StatCard 
          title="Total MWh" 
          value={analytics.totalMWh.toLocaleString()} 
          icon="🔋"
        />
        <StatCard 
          title="Current Price" 
          value={`€${Math.round(currentPrice)}/kWh`} 
          icon="💰"
        />
      </div>

      {/* Duration Distribution */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)'
      }}>
        <h4 style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '14px',
          fontWeight: '600',
          margin: '0 0 12px 0'
        }}>
          Duration Distribution
        </h4>
        {Object.entries(analytics.projectsByDuration).map(([duration, count]) => (
          <div key={duration} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
              {duration} duration
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '60px',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(count / Math.max(...Object.values(analytics.projectsByDuration))) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
                  borderRadius: '2px'
                }} />
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px', fontWeight: '600' }}>
                {count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Price Curve Chart */}
      <div style={{
        flex: 1,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h4 style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '14px',
          fontWeight: '600',
          margin: '0 0 16px 0'
        }}>
          Economies of Scale
        </h4>
        
        <div style={{
          flex: 1,
          position: 'relative',
          minHeight: '200px'
        }}>
          <PriceCurveChart 
            currentAggregation={analytics.currentAggregation}
            currentPrice={currentPrice}
            fillPercentage={fillPercentage}
          />
        </div>
        
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '11px', textAlign: 'center' }}>
            Current: {analytics.currentAggregation.toFixed(1)} GWh → €{Math.round(currentPrice)}/kWh
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '16px', marginBottom: '4px' }}>{icon}</div>
    <div style={{
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '10px',
      fontWeight: '500',
      marginBottom: '2px'
    }}>
      {title}
    </div>
    <div style={{
      color: 'rgba(255, 255, 255, 0.95)',
      fontSize: '13px',
      fontWeight: '600'
    }}>
      {value}
    </div>
  </div>
);

const PriceCurveChart = ({ currentAggregation, currentPrice, fillPercentage }) => {
  const width = 280;
  const height = 180;
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Generate curve points
  const generateCurvePoints = () => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 16; // 0 to 16 GWh
      const price = 27 + (251 - 27) * Math.pow((16 - x) / 16, 3); // Exponential decay
      const xPos = (x / 16) * chartWidth;
      const yPos = chartHeight - ((price - 27) / (251 - 27)) * chartHeight;
      points.push({ x: xPos, y: yPos, price, aggregation: x });
    }
    return points;
  };

  const curvePoints = generateCurvePoints();
  const pathData = curvePoints.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Current position
  const currentX = (currentAggregation / 16) * chartWidth;
  const currentY = chartHeight - ((currentPrice - 27) / (251 - 27)) * chartHeight;

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Chart background */}
        <rect 
          x={margin.left} 
          y={margin.top} 
          width={chartWidth} 
          height={chartHeight}
          fill="rgba(255, 255, 255, 0.02)"
          rx="4"
        />
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => {
          const y = margin.top + (percent / 100) * chartHeight;
          return (
            <line
              key={`grid-${percent}`}
              x1={margin.left}
              y1={y}
              x2={margin.left + chartWidth}
              y2={y}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="0.5"
            />
          );
        })}
        
        {/* Filled portion of curve */}
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.8)" />
          </linearGradient>
        </defs>
        
        <path
          d={pathData}
          stroke="url(#curveGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4,2"
          strokeDashoffset={0}
          transform={`translate(${margin.left}, ${margin.top})`}
          style={{
            strokeDasharray: `${fillPercentage * 4}, 400`,
            transition: 'stroke-dasharray 1s ease-in-out'
          }}
        />
        
        {/* Unfilled portion (dashed) */}
        <path
          d={pathData}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="2,3"
          transform={`translate(${margin.left}, ${margin.top})`}
        />
        
        {/* Current position marker */}
        <circle
          cx={margin.left + currentX}
          cy={margin.top + currentY}
          r="4"
          fill="rgba(59, 130, 246, 0.9)"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="2"
        />
        
        {/* Y-axis labels */}
        <text x={margin.left - 10} y={margin.top + 5} fill="rgba(255, 255, 255, 0.6)" fontSize="10" textAnchor="end">€251</text>
        <text x={margin.left - 10} y={margin.top + chartHeight} fill="rgba(255, 255, 255, 0.6)" fontSize="10" textAnchor="end">€27</text>
        
        {/* X-axis labels */}
        <text x={margin.left} y={height - 5} fill="rgba(255, 255, 255, 0.6)" fontSize="10" textAnchor="start">0</text>
        <text x={margin.left + chartWidth} y={height - 5} fill="rgba(255, 255, 255, 0.6)" fontSize="10" textAnchor="end">16 GWh</text>
        
        {/* Axis labels */}
        <text x={margin.left - 35} y={margin.top + chartHeight/2} fill="rgba(255, 255, 255, 0.7)" fontSize="9" textAnchor="middle" transform={`rotate(-90, ${margin.left - 35}, ${margin.top + chartHeight/2})`}>€/kWh</text>
        <text x={margin.left + chartWidth/2} y={height - 8} fill="rgba(255, 255, 255, 0.7)" fontSize="9" textAnchor="middle">Aggregated Supply</text>
      </svg>
    </div>
  );
};

export default AggregationAnalytics;