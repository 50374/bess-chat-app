class BESSRecommendationEngine {
    constructor(database) {
        this.database = database;
    }

    async generateRecommendations(requirements) {
        console.log('BESSRecommendationEngine: Starting recommendations for:', requirements);
        
        try {
            // Get all available BESS systems
            const availableSystems = await this.database.getAllBESSSystems();
            console.log('Available systems count:', availableSystems.length);
            
            if (availableSystems.length === 0) {
                console.log('No BESS systems found in database');
                return {
                    recommendations: [],
                    analysis: "No BESS systems found in database. Please upload datasheets first.",
                    total_systems_evaluated: 0
                };
            }

            // Score each system based on requirements
            const scoredSystems = availableSystems.map(system => {
                const score = this.calculateCompatibilityScore(system, requirements);
                return { ...system, compatibility_score: score };
            });

            // Sort by compatibility score and take top 5
            const topRecommendations = scoredSystems
                .sort((a, b) => b.compatibility_score - a.compatibility_score)
                .slice(0, 5);

            // Generate detailed analysis
            const analysis = this.generateAnalysis(topRecommendations, requirements);

            return {
                recommendations: topRecommendations,
                analysis: analysis,
                total_systems_evaluated: availableSystems.length
            };
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }

    calculateCompatibilityScore(system, requirements) {
        let score = 0;
        let maxScore = 0;

        // Power matching (30% weight)
        if (requirements.nominal_power_mw && system.nominal_power_mw) {
            maxScore += 30;
            const powerDiff = Math.abs(system.nominal_power_mw - requirements.nominal_power_mw);
            const powerTolerance = requirements.nominal_power_mw * 0.2; // 20% tolerance
            
            if (powerDiff <= powerTolerance) {
                score += 30 - (powerDiff / powerTolerance) * 15; // Full points if exact, deduct based on difference
            }
        }

        // Energy matching (25% weight)
        if (requirements.nominal_energy_mwh && system.nominal_energy_mwh) {
            maxScore += 25;
            const energyDiff = Math.abs(system.nominal_energy_mwh - requirements.nominal_energy_mwh);
            const energyTolerance = requirements.nominal_energy_mwh * 0.2;
            
            if (energyDiff <= energyTolerance) {
                score += 25 - (energyDiff / energyTolerance) * 12.5;
            }
        }

        // Duration matching (20% weight)
        if (requirements.discharge_duration_h && system.discharge_duration_h) {
            maxScore += 20;
            const durationDiff = Math.abs(system.discharge_duration_h - requirements.discharge_duration_h);
            const durationTolerance = requirements.discharge_duration_h * 0.25; // 25% tolerance
            
            if (durationDiff <= durationTolerance) {
                score += 20 - (durationDiff / durationTolerance) * 10;
            }
        }

        // Application compatibility (15% weight)
        if (requirements.application && system.application_types) {
            maxScore += 15;
            const applications = JSON.parse(system.application_types || '[]');
            if (applications.some(app => app.toLowerCase().includes(requirements.application.toLowerCase()))) {
                score += 15;
            }
        }

        // Chemistry preference (10% weight)
        if (requirements.chemistry_preference && system.chemistry) {
            maxScore += 10;
            if (system.chemistry.toLowerCase().includes(requirements.chemistry_preference.toLowerCase())) {
                score += 10;
            }
        }

        // Normalize score to percentage
        return maxScore > 0 ? (score / maxScore) * 100 : 0;
    }

    generateAnalysis(recommendations, requirements) {
        if (recommendations.length === 0) {
            return "No compatible BESS systems found based on your requirements. Consider adjusting your specifications or uploading additional datasheets.";
        }

        const topSystem = recommendations[0];
        let analysis = `## BESS Dimensioning Analysis\n\n`;
        
        analysis += `### Project Requirements Summary:\n`;
        analysis += `- **Power:** ${requirements.nominal_power_mw || 'Not specified'} MW\n`;
        analysis += `- **Energy:** ${requirements.nominal_energy_mwh || 'Not specified'} MWh\n`;
        analysis += `- **Duration:** ${requirements.discharge_duration_h || 'Not specified'} hours\n`;
        analysis += `- **Application:** ${requirements.application || 'Not specified'}\n`;
        analysis += `- **Daily Cycles:** ${requirements.expected_daily_cycles || 'Not specified'}\n\n`;

        analysis += `### Top Recommendation:\n`;
        analysis += `**${topSystem.manufacturer} ${topSystem.model}** (${topSystem.compatibility_score.toFixed(1)}% match)\n\n`;
        
        analysis += `**System Specifications:**\n`;
        analysis += `- Power: ${topSystem.nominal_power_mw || 'N/A'} MW\n`;
        analysis += `- Energy: ${topSystem.nominal_energy_mwh || 'N/A'} MWh\n`;
        analysis += `- Duration: ${topSystem.discharge_duration_h || 'N/A'} hours\n`;
        analysis += `- Chemistry: ${topSystem.chemistry || 'N/A'}\n`;
        analysis += `- Efficiency: ${topSystem.round_trip_efficiency_pct || 'N/A'}%\n`;
        analysis += `- Cycle Life: ${topSystem.cycle_life_cycles ? topSystem.cycle_life_cycles.toLocaleString() : 'N/A'} cycles\n\n`;

        // Analysis of fit
        analysis += `### Compatibility Analysis:\n`;
        
        if (requirements.nominal_power_mw && topSystem.nominal_power_mw) {
            const powerDiff = ((topSystem.nominal_power_mw - requirements.nominal_power_mw) / requirements.nominal_power_mw * 100);
            if (Math.abs(powerDiff) <= 20) {
                analysis += `✅ **Power Match:** Excellent fit (${powerDiff >= 0 ? '+' : ''}${powerDiff.toFixed(1)}% difference)\n`;
            } else {
                analysis += `⚠️ **Power Difference:** ${powerDiff >= 0 ? '+' : ''}${powerDiff.toFixed(1)}% from requirement\n`;
            }
        }

        if (requirements.nominal_energy_mwh && topSystem.nominal_energy_mwh) {
            const energyDiff = ((topSystem.nominal_energy_mwh - requirements.nominal_energy_mwh) / requirements.nominal_energy_mwh * 100);
            if (Math.abs(energyDiff) <= 20) {
                analysis += `✅ **Energy Match:** Excellent fit (${energyDiff >= 0 ? '+' : ''}${energyDiff.toFixed(1)}% difference)\n`;
            } else {
                analysis += `⚠️ **Energy Difference:** ${energyDiff >= 0 ? '+' : ''}${energyDiff.toFixed(1)}% from requirement\n`;
            }
        }

        // Application suitability
        if (requirements.application && topSystem.application_types) {
            const applications = JSON.parse(topSystem.application_types || '[]');
            if (applications.some(app => app.toLowerCase().includes(requirements.application.toLowerCase()))) {
                analysis += `✅ **Application Fit:** Optimized for ${requirements.application}\n`;
            } else {
                analysis += `⚠️ **Application:** May not be optimized for ${requirements.application}\n`;
            }
        }

        // Cycling analysis
        if (requirements.expected_daily_cycles && topSystem.cycle_life_cycles) {
            const yearsOfOperation = topSystem.cycle_life_cycles / (requirements.expected_daily_cycles * 365);
            analysis += `📊 **Lifetime Analysis:** Approximately ${yearsOfOperation.toFixed(1)} years of operation at ${requirements.expected_daily_cycles} cycles/day\n`;
        }

        analysis += `\n### Alternative Options:\n`;
        for (let i = 1; i < Math.min(recommendations.length, 4); i++) {
            const system = recommendations[i];
            analysis += `${i + 1}. **${system.manufacturer} ${system.model}** (${system.compatibility_score.toFixed(1)}% match)\n`;
            analysis += `   - ${system.nominal_power_mw || 'N/A'} MW / ${system.nominal_energy_mwh || 'N/A'} MWh / ${system.chemistry || 'N/A'}\n`;
        }

        analysis += `\n### Sizing Recommendations:\n`;
        
        // C-rate analysis
        if (requirements.nominal_power_mw && requirements.nominal_energy_mwh) {
            const requiredCRate = requirements.nominal_power_mw / requirements.nominal_energy_mwh;
            analysis += `- **C-Rate:** ${requiredCRate.toFixed(2)}C (${(1/requiredCRate).toFixed(1)} hour discharge)\n`;
        }

        // Multiple system configuration if needed
        if (topSystem.nominal_power_mw && requirements.nominal_power_mw) {
            const systemsNeeded = Math.ceil(requirements.nominal_power_mw / topSystem.nominal_power_mw);
            if (systemsNeeded > 1) {
                analysis += `- **Configuration:** Consider ${systemsNeeded} units in parallel to meet power requirement\n`;
                analysis += `- **Total System:** ${(systemsNeeded * topSystem.nominal_power_mw).toFixed(1)} MW / ${(systemsNeeded * topSystem.nominal_energy_mwh).toFixed(1)} MWh\n`;
            }
        }

        return analysis;
    }

    async generateComparisonMatrix(systems, requirements) {
        const matrix = {
            headers: [
                'Manufacturer/Model',
                'Power (MW)',
                'Energy (MWh)',
                'Duration (h)',
                'Chemistry',
                'Efficiency (%)',
                'Cycle Life',
                'Compatibility (%)'
            ],
            rows: systems.map(system => [
                `${system.manufacturer || 'Unknown'} ${system.model || ''}`,
                system.nominal_power_mw?.toFixed(1) || 'N/A',
                system.nominal_energy_mwh?.toFixed(1) || 'N/A',
                system.discharge_duration_h?.toFixed(1) || 'N/A',
                system.chemistry || 'N/A',
                system.round_trip_efficiency_pct?.toFixed(1) || 'N/A',
                system.cycle_life_cycles?.toLocaleString() || 'N/A',
                system.compatibility_score?.toFixed(1) || '0'
            ])
        };

        return matrix;
    }

    // Generate sizing optimization suggestions
    generateSizingOptimization(requirements) {
        const suggestions = [];

        // Validate power-energy-duration relationship
        if (requirements.nominal_power_mw && requirements.nominal_energy_mwh) {
            const calculatedDuration = requirements.nominal_energy_mwh / requirements.nominal_power_mw;
            
            if (requirements.discharge_duration_h && Math.abs(calculatedDuration - requirements.discharge_duration_h) > 0.1) {
                suggestions.push({
                    type: 'warning',
                    message: `Power-Energy-Duration mismatch detected. With ${requirements.nominal_power_mw}MW and ${requirements.nominal_energy_mwh}MWh, duration should be ${calculatedDuration.toFixed(1)} hours, not ${requirements.discharge_duration_h} hours.`
                });
            }
        }

        // Application-specific recommendations
        if (requirements.application) {
            const app = requirements.application.toLowerCase();
            
            if (app.includes('frequency') || app.includes('regulation')) {
                suggestions.push({
                    type: 'info',
                    message: 'For frequency regulation: Consider systems with <1s response time and high cycle capability (>300 cycles/day).'
                });
            } else if (app.includes('arbitrage')) {
                suggestions.push({
                    type: 'info',
                    message: 'For energy arbitrage: 2-4 hour duration systems typically provide best economics. Consider daily cycling patterns.'
                });
            } else if (app.includes('peak') || app.includes('shaving')) {
                suggestions.push({
                    type: 'info',
                    message: 'For peak shaving: 2-6 hour systems work well. Analyze load profiles to optimize sizing.'
                });
            }
        }

        // Cycling validation
        if (requirements.expected_daily_cycles && requirements.discharge_duration_h) {
            const dailyHours = requirements.expected_daily_cycles * requirements.discharge_duration_h;
            if (dailyHours > 24) {
                suggestions.push({
                    type: 'error',
                    message: `Invalid cycling: ${requirements.expected_daily_cycles} cycles × ${requirements.discharge_duration_h} hours = ${dailyHours} hours/day (exceeds 24 hours).`
                });
            }
        }

        return suggestions;
    }
}

export default BESSRecommendationEngine;