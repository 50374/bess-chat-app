import React, { useState, useEffect } from 'react';
import aggregationService from '../services/aggregationService';

const AggregationAnalytics = ({ sessionId }) => {
  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    totalMW: 0,
    totalMWh: 0,
    projectsByDuration: {
      '1h': 0,
      '2h': 0,
      '4h': 0,
      '8h': 0
    },
    currentAggregation: 0,
    lastUpdated: null
  });

  const [historicalTrends, setHistoricalTrends] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data and subscribe to updates
  useEffect(() => {
    let unsubscribe;

    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Load current aggregation data
        const currentData = await aggregationService.getCurrentAggregation();
        setAnalytics(currentData);
        
        // Load historical trends
        const trends = await aggregationService.getHistoricalTrends('30d');
        setHistoricalTrends(trends);
        
        // Subscribe to live updates
        unsubscribe = aggregationService.subscribe((newData) => {
          setAnalytics(prev => ({
            ...prev,
            ...newData,
            lastUpdated: new Date().toISOString()
          }));
        });
        
        setError(null);
      } catch (err) {
        console.error('Error initializing aggregation data:', err);
        setError('Failed to load aggregation data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Refresh historical data periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const trends = await aggregationService.getHistoricalTrends('30d');
        setHistoricalTrends(trends);
      } catch (err) {
        console.error('Error refreshing historical trends:', err);
      }
    }, 300000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Price curve calculation: realistic stepped curve matching the provided graph
  const calculatePrice = (aggregationGWh) => {
    const aggregationMWh = aggregationGWh * 1000; // Convert to MWh for calculation
    
    // Realistic price curve based on the provided graph
    if (aggregationMWh <= 10) return 210;
    if (aggregationMWh <= 100) return 210 - ((aggregationMWh - 10) / 90) * 60; // Drop to 150
    if (aggregationMWh <= 500) return 150 - ((aggregationMWh - 100) / 400) * 35; // Drop to 115
    if (aggregationMWh <= 1500) return 115 - ((aggregationMWh - 500) / 1000) * 20; // Drop to 95
    if (aggregationMWh <= 3000) return 95 - ((aggregationMWh - 1500) / 1500) * 5; // Small drop to 90
    if (aggregationMWh <= 6000) return 90 + ((aggregationMWh - 3000) / 3000) * 10; // Slight increase to 100 (plateau)
    if (aggregationMWh <= 8000) return 100 - ((aggregationMWh - 6000) / 2000) * 5; // Drop to 95
    if (aggregationMWh <= 12000) return 95 - ((aggregationMWh - 8000) / 4000) * 25; // Drop to 70
    if (aggregationMWh <= 16000) return 70 - ((aggregationMWh - 12000) / 4000) * 43; // Final drop to 27
    
    return 27; // Minimum price at full aggregation
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{
            background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '18px',
            fontWeight: '600',
            margin: 0
          }}>
            Market Aggregation
          </h3>
          
          {/* Real-time status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isLoading ? 'rgba(255, 193, 7, 0.8)' : error ? 'rgba(220, 53, 69, 0.8)' : 'rgba(40, 167, 69, 0.8)',
              boxShadow: `0 0 6px ${isLoading ? 'rgba(255, 193, 7, 0.6)' : error ? 'rgba(220, 53, 69, 0.6)' : 'rgba(40, 167, 69, 0.6)'}`
            }} />
            <span style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '10px',
              fontWeight: '500'
            }}>
              {isLoading ? 'Loading...' : error ? 'Offline' : 'Live'}
            </span>
          </div>
        </div>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          margin: 0,
          lineHeight: '1.4'
        }}>
          Real-time project aggregation driving economies of scale
        </p>
        
        {analytics.lastUpdated && (
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '10px',
            margin: '8px 0 0 0',
            lineHeight: '1.2'
          }}>
            Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
          </p>
        )}
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

      {/* Price Curve Chart - Large and at top */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        marginBottom: '20px',
        height: '400px', // Large height similar to chat window
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h4 style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 20px 0'
        }}>
          Economies of Scale
        </h4>
        
        <div style={{
          flex: 1,
          position: 'relative',
          minHeight: '320px'
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
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px', textAlign: 'center' }}>
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
  const width = 320; // Much larger width
  const height = 280; // Much larger height
  const margin = { top: 20, right: 40, bottom: 40, left: 60 }; // More margin for labels
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Generate curve points starting from 0
  const generateCurvePoints = () => {
    const points = [];
    for (let i = 0; i <= 200; i++) { // More points for smoother curve
      const x = (i / 200) * 16; // 0 to 16 GWh
      const aggregationMWh = x * 1000;
      
      // Use the same realistic price calculation but start from 0
      let price;
      if (aggregationMWh <= 0) price = 210; // Start at 210 for 0 MWh
      else if (aggregationMWh <= 10) price = 210;
      else if (aggregationMWh <= 100) price = 210 - ((aggregationMWh - 10) / 90) * 60;
      else if (aggregationMWh <= 500) price = 150 - ((aggregationMWh - 100) / 400) * 35;
      else if (aggregationMWh <= 1500) price = 115 - ((aggregationMWh - 500) / 1000) * 20;
      else if (aggregationMWh <= 3000) price = 95 - ((aggregationMWh - 1500) / 1500) * 5;
      else if (aggregationMWh <= 6000) price = 90 + ((aggregationMWh - 3000) / 3000) * 10;
      else if (aggregationMWh <= 8000) price = 100 - ((aggregationMWh - 6000) / 2000) * 5;
      else if (aggregationMWh <= 12000) price = 95 - ((aggregationMWh - 8000) / 4000) * 25;
      else if (aggregationMWh <= 16000) price = 70 - ((aggregationMWh - 12000) / 4000) * 43;
      else price = 27;
      
      const xPos = (x / 16) * chartWidth;
      const yPos = chartHeight - ((price - 0) / (210 - 0)) * chartHeight; // Start from 0 instead of 27
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
  const currentY = chartHeight - ((currentPrice - 0) / (210 - 0)) * chartHeight; // Use zero-based scale

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
        
        {/* Filled portion of curve (solid line up to current position) */}
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.9)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.9)" />
          </linearGradient>
        </defs>
        
        {/* Solid line up to current position */}
        <path
          d={curvePoints.slice(0, Math.floor(curvePoints.length * fillPercentage / 100) + 1)
            .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
            .join(' ')}
          stroke="url(#curveGradient)"
          strokeWidth="3"
          fill="none"
          transform={`translate(${margin.left}, ${margin.top})`}
        />
        
        {/* Dashed line from current position to end */}
        <path
          d={curvePoints.slice(Math.floor(curvePoints.length * fillPercentage / 100))
            .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
            .join(' ')}
          stroke="rgba(59, 130, 246, 0.4)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6,4"
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
        
        {/* Floating price label at transition point */}
        <g transform={`translate(${margin.left + currentX}, ${margin.top + currentY - 25})`}>
          {/* Label background with subtle animation */}
          <rect
            x="-22"
            y="-14"
            width="44"
            height="24"
            rx="12"
            fill="rgba(255, 255, 255, 0.95)"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="1.5"
            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
          >
            <animate 
              attributeName="stroke-width" 
              values="1.5;2;1.5" 
              dur="2s" 
              repeatCount="indefinite"
            />
          </rect>
          {/* Price text */}
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill="rgba(59, 130, 246, 0.9)"
            fontSize="12"
            fontWeight="700"
          >
            €{Math.round(currentPrice)}
          </text>
        </g>
        
        {/* Vertical line from curve to x-axis showing current position */}
        <line
          x1={margin.left + currentX}
          y1={margin.top + currentY}
          x2={margin.left + currentX}
          y2={margin.top + chartHeight}
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        
        {/* Y-axis labels - zero-based scale */}
        <text x={margin.left - 10} y={margin.top + 5} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="end">€210</text>
        <text x={margin.left - 10} y={margin.top + chartHeight/4} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="end">€160</text>
        <text x={margin.left - 10} y={margin.top + chartHeight/2} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="end">€105</text>
        <text x={margin.left - 10} y={margin.top + 3*chartHeight/4} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="end">€50</text>
        <text x={margin.left - 10} y={margin.top + chartHeight} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="end">€0</text>
        
        {/* X-axis labels - zero-based scale */}
        <text x={margin.left} y={height - 5} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="start">0</text>
        <text x={margin.left + chartWidth/4} y={height - 5} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="middle">4</text>
        <text x={margin.left + chartWidth/2} y={height - 5} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="middle">8</text>
        <text x={margin.left + 3*chartWidth/4} y={height - 5} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="middle">12</text>
        <text x={margin.left + chartWidth} y={height - 5} fill="rgba(255, 255, 255, 0.6)" fontSize="11" textAnchor="end">16 GWh</text>
        
        {/* Axis labels */}
        <text x={margin.left - 35} y={margin.top + chartHeight/2} fill="rgba(255, 255, 255, 0.7)" fontSize="9" textAnchor="middle" transform={`rotate(-90, ${margin.left - 35}, ${margin.top + chartHeight/2})`}>€/kWh</text>
        <text x={margin.left + chartWidth/2} y={height - 8} fill="rgba(255, 255, 255, 0.7)" fontSize="9" textAnchor="middle">Aggregated Supply</text>
      </svg>
    </div>
  );
};

export default AggregationAnalytics;