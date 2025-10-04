import { useState, useEffect } from 'react';

const MarketDemandDiagram = ({ data }) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const defaultData = {
    totalProjects: 0,
    totalCapacityMW: 0,
    averageDuration: 0,
    topApplications: [],
    regionDistribution: {}
  };

  const marketData = data || defaultData;
  const isLoading = !data;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      padding: '20px',
      height: '300px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: isLoading ? '#ff6b6b' : '#4ecdc4',
          marginRight: '10px',
          animation: isLoading ? 'pulse 1s infinite' : 'none'
        }} />
        <h3 style={{
          color: 'white',
          margin: 0,
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Market Demand Overview
        </h3>
        <span style={{
          marginLeft: 'auto',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px'
        }}>
          Real-time
        </span>
      </div>

      {/* Market Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#4ecdc4',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '4px'
          }}>
            {marketData.totalProjects}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px'
          }}>
            Total Projects
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#ffd93d',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '4px'
          }}>
            {marketData.totalCapacityMW.toFixed(1)}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px'
          }}>
            MW Capacity
          </div>
        </div>
      </div>

      {/* Demand Flow Diagram */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 300 120"
          style={{ overflow: 'visible' }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Market demand flow visualization */}
          <g>
            {/* Central hub */}
            <circle
              cx="150"
              cy="60"
              r="25"
              fill="rgba(78, 205, 196, 0.3)"
              stroke="#4ecdc4"
              strokeWidth="2"
            />
            <text
              x="150"
              y="65"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              BESS
            </text>

            {/* Application nodes */}
            {['Grid', 'Solar', 'Wind', 'C&I'].map((app, index) => {
              const angle = (index * 90 - 45) * Math.PI / 180;
              const radius = 80;
              const x = 150 + Math.cos(angle) * radius;
              const y = 60 + Math.sin(angle) * radius;
              
              return (
                <g key={app}>
                  {/* Connection line with animation */}
                  <line
                    x1="150"
                    y1="60"
                    x2={x}
                    y2={y}
                    stroke="#ffd93d"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    strokeDashoffset={animationPhase / 10}
                    opacity="0.7"
                  />
                  
                  {/* Application node */}
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="rgba(255, 217, 61, 0.3)"
                    stroke="#ffd93d"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                  >
                    {app}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Top Applications */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '12px',
        marginTop: '12px'
      }}>
        <div style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '12px',
          marginBottom: '8px'
        }}>
          Top Applications:
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {(marketData.topApplications.length > 0 ? marketData.topApplications : ['Grid Services', 'Peak Shaving', 'Renewable Integration']).slice(0, 3).map((app, index) => (
            <span
              key={app}
              style={{
                background: 'rgba(78, 205, 196, 0.2)',
                color: '#4ecdc4',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                border: '1px solid rgba(78, 205, 196, 0.3)'
              }}
            >
              {app}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default MarketDemandDiagram;