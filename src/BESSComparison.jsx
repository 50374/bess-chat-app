import React, { useState, useEffect } from 'react';

const BESSComparison = ({ extractedInfo, isVisible, onClose }) => {
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [comparisonMatrix, setComparisonMatrix] = useState(null);

    useEffect(() => {
        if (isVisible && extractedInfo) {
            fetchRecommendations();
        }
    }, [isVisible, extractedInfo]);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('Fetching recommendations with data:', extractedInfo);
            
            const response = await fetch('http://localhost:5001/api/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...extractedInfo,
                    session_id: Date.now().toString()
                })
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Recommendations received:', data);
            setRecommendations(data);

            // Fetch comparison matrix
            const matrixResponse = await fetch('http://localhost:5001/api/comparison-matrix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ requirements: extractedInfo })
            });

            if (matrixResponse.ok) {
                const matrixData = await matrixResponse.json();
                setComparisonMatrix(matrixData);
            }

        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatAnalysis = (analysis) => {
        if (!analysis) return '';
        
        // Convert markdown-style text to JSX
        return analysis.split('\n').map((line, index) => {
            if (line.startsWith('### ')) {
                return <h3 key={index} style={{ color: '#2d3428', marginTop: '24px', marginBottom: '12px' }}>{line.replace('### ', '')}</h3>;
            } else if (line.startsWith('## ')) {
                return <h2 key={index} style={{ color: '#2d3428', marginTop: '32px', marginBottom: '16px' }}>{line.replace('## ', '')}</h2>;
            } else if (line.startsWith('**') && line.endsWith('**')) {
                return <strong key={index} style={{ display: 'block', marginBottom: '8px', color: '#374151' }}>{line.replace(/\*\*/g, '')}</strong>;
            } else if (line.startsWith('- ')) {
                return <div key={index} style={{ marginLeft: '16px', marginBottom: '4px', color: '#6b7280' }}>{line}</div>;
            } else if (line.startsWith('✅') || line.startsWith('⚠️') || line.startsWith('📊')) {
                return <div key={index} style={{ marginBottom: '8px', color: '#374151', fontWeight: '500' }}>{line}</div>;
            } else if (line.trim()) {
                return <p key={index} style={{ marginBottom: '8px', color: '#6b7280', lineHeight: '1.5' }}>{line}</p>;
            } else {
                return <br key={index} />;
            }
        });
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(249, 249, 249, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                padding: '32px',
                width: '90%',
                maxWidth: '1200px',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid rgba(229, 231, 235, 0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '28px',
                        color: '#2d3428',
                        fontWeight: '700'
                    }}>
                        BESS Recommendations & Analysis
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '28px',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '0',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </div>

                {loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px',
                        color: '#4ade80',
                        fontSize: '18px',
                        fontWeight: '600'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                        <div style={{ marginBottom: '8px' }}>Analyzing BESS Database...</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            Comparing systems and generating recommendations
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '24px',
                        backgroundColor: 'rgba(248, 113, 113, 0.1)',
                        border: '1px solid rgba(248, 113, 113, 0.2)',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600', marginBottom: '8px' }}>
                            Error Loading Recommendations
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {error}
                        </div>
                        <button
                            onClick={fetchRecommendations}
                            style={{
                                marginTop: '16px',
                                padding: '8px 16px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {recommendations && !loading && (
                    <div>
                        {/* Recommendations Summary */}
                        <div style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '24px'
                        }}>
                            <h3 style={{
                                margin: '0 0 12px 0',
                                color: '#059669',
                                fontSize: '18px',
                                fontWeight: '600'
                            }}>
                                📊 Analysis Summary
                            </h3>
                            <div style={{ fontSize: '14px', color: '#374151' }}>
                                <strong>{recommendations.total_systems_evaluated || 0}</strong> BESS systems analyzed
                                {recommendations.recommendations?.length > 0 && (
                                    <span> • <strong>{recommendations.recommendations.length}</strong> compatible systems found</span>
                                )}
                            </div>
                        </div>

                        {/* Top Recommendations Cards */}
                        {recommendations.recommendations?.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '20px',
                                    color: '#2d3428',
                                    fontWeight: '600'
                                }}>
                                    🏆 Top Recommendations
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                    gap: '16px',
                                    marginBottom: '24px'
                                }}>
                                    {recommendations.recommendations.slice(0, 3).map((system, index) => (
                                        <div key={index} style={{
                                            backgroundColor: index === 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(249, 249, 249, 0.8)',
                                            border: index === 0 ? '2px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            position: 'relative'
                                        }}>
                                            {index === 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    left: '20px',
                                                    backgroundColor: '#059669',
                                                    color: 'white',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    BEST MATCH
                                                </div>
                                            )}
                                            
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: '12px'
                                            }}>
                                                <div>
                                                    <h4 style={{
                                                        margin: '0 0 4px 0',
                                                        fontSize: '16px',
                                                        color: '#2d3428',
                                                        fontWeight: '600'
                                                    }}>
                                                        {system.manufacturer} {system.model}
                                                    </h4>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#6b7280'
                                                    }}>
                                                        {system.chemistry || 'Unknown Chemistry'}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    backgroundColor: system.compatibility_score > 80 ? '#10b981' : system.compatibility_score > 60 ? '#f59e0b' : '#ef4444',
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {system.compatibility_score?.toFixed(0)}%
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '8px',
                                                fontSize: '14px',
                                                color: '#374151'
                                            }}>
                                                <div><strong>Power:</strong> {system.nominal_power_mw || 'N/A'} MW</div>
                                                <div><strong>Energy:</strong> {system.nominal_energy_mwh || 'N/A'} MWh</div>
                                                <div><strong>Duration:</strong> {system.discharge_duration_h?.toFixed(1) || 'N/A'} h</div>
                                                <div><strong>Efficiency:</strong> {system.round_trip_efficiency_pct || 'N/A'}%</div>
                                            </div>

                                            {system.cycle_life_cycles && (
                                                <div style={{
                                                    marginTop: '8px',
                                                    fontSize: '12px',
                                                    color: '#6b7280'
                                                }}>
                                                    Cycle Life: {system.cycle_life_cycles.toLocaleString()} cycles
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Detailed Analysis */}
                        <div style={{
                            backgroundColor: 'rgba(249, 249, 249, 0.8)',
                            border: '1px solid rgba(229, 231, 235, 0.5)',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '24px'
                        }}>
                            <h3 style={{
                                margin: '0 0 16px 0',
                                fontSize: '20px',
                                color: '#2d3428',
                                fontWeight: '600'
                            }}>
                                📋 Detailed Analysis
                            </h3>
                            <div style={{
                                lineHeight: '1.6',
                                fontSize: '14px'
                            }}>
                                {formatAnalysis(recommendations.analysis)}
                            </div>
                        </div>

                        {/* Comparison Matrix */}
                        {comparisonMatrix && (
                            <div style={{
                                backgroundColor: 'rgba(249, 249, 249, 0.8)',
                                border: '1px solid rgba(229, 231, 235, 0.5)',
                                borderRadius: '12px',
                                padding: '24px'
                            }}>
                                <h3 style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '20px',
                                    color: '#2d3428',
                                    fontWeight: '600'
                                }}>
                                    📊 Comparison Matrix
                                </h3>
                                <div style={{ overflow: 'auto' }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '12px'
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'rgba(229, 231, 235, 0.5)' }}>
                                                {comparisonMatrix.headers.map((header, index) => (
                                                    <th key={index} style={{
                                                        padding: '8px',
                                                        textAlign: 'left',
                                                        fontWeight: '600',
                                                        color: '#374151',
                                                        borderBottom: '2px solid rgba(229, 231, 235, 0.8)'
                                                    }}>
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comparisonMatrix.rows.map((row, rowIndex) => (
                                                <tr key={rowIndex} style={{
                                                    backgroundColor: rowIndex % 2 === 0 ? 'rgba(249, 249, 249, 0.5)' : 'transparent'
                                                }}>
                                                    {row.map((cell, cellIndex) => (
                                                        <td key={cellIndex} style={{
                                                            padding: '8px',
                                                            borderBottom: '1px solid rgba(229, 231, 235, 0.3)',
                                                            color: '#374151'
                                                        }}>
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {recommendations.recommendations?.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px',
                                backgroundColor: 'rgba(249, 249, 249, 0.8)',
                                borderRadius: '12px',
                                border: '1px solid rgba(229, 231, 235, 0.5)'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    color: '#6b7280',
                                    fontWeight: '600'
                                }}>
                                    No Compatible Systems Found
                                </h3>
                                <p style={{
                                    color: '#6b7280',
                                    fontSize: '14px',
                                    margin: 0
                                }}>
                                    Consider uploading more BESS datasheets or adjusting your requirements.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BESSComparison;