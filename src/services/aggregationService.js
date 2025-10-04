// Database service for aggregation analytics with live updates
class AggregationService {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bess-chat-api-production.up.railway.app'
      : 'http://localhost:3001';
    
    // For any Netlify deployment (development branch or deploy previews), use Railway
    if (typeof window !== 'undefined' && 
        (window.location.hostname.includes('netlify.app') || 
         window.location.hostname.includes('extraordinary-monstera-e00408'))) {
      this.baseUrl = 'https://bess-chat-api-production.up.railway.app';
      console.log('🌐 Netlify deployment detected, using Railway API:', this.baseUrl);
    }
    
    // WebSocket connection for live updates
    this.ws = null;
    this.subscribers = new Set();
    
    // Cache for historical data
    this.historicalCache = null;
    this.lastFetch = null;
    
    // Disable WebSocket for now - use polling instead
    this.startPolling();
  }

  // Initialize WebSocket connection for real-time updates
  initWebSocket() {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws/aggregation';
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('📊 Aggregation WebSocket connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifySubscribers(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('📊 Aggregation WebSocket disconnected, reconnecting...');
        setTimeout(() => this.initWebSocket(), 5000);
      };
      
      this.ws.onerror = (error) => {
        console.error('📊 Aggregation WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      // Fallback to polling if WebSocket fails
      this.startPolling();
    }
  }

  // Subscribe to live aggregation updates
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers of updates
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in aggregation subscriber:', error);
      }
    });
  }

  // Get current aggregation statistics
  async getCurrentAggregation() {
    try {
      const response = await fetch(`${this.baseUrl}/api/aggregation/current`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        totalProjects: data.total_projects || 0,
        totalMW: data.total_mw || 0,
        totalMWh: data.total_mwh || 0,
        projectsByDuration: {
          '1h': data.projects_1h || 0,
          '2h': data.projects_2h || 0,
          '4h': data.projects_4h || 0,
          '8h': data.projects_8h || 0
        },
        currentAggregation: (data.total_mwh || 0) / 1000, // Convert to GWh
        lastUpdated: data.last_updated || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching current aggregation:', error);
      // Return fallback data
      return this.getFallbackData();
    }
  }

  // Get historical aggregation trends
  async getHistoricalTrends(timeframe = '30d') {
    try {
      // Check cache first
      if (this.historicalCache && this.lastFetch && 
          Date.now() - this.lastFetch < 300000) { // 5 minutes cache
        return this.historicalCache;
      }

      const response = await fetch(`${this.baseUrl}/api/aggregation/historical?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const trends = {
        timeline: data.map(point => ({
          date: point.date,
          totalMWh: point.total_mwh,
          totalProjects: point.total_projects,
          averagePrice: this.calculatePrice((point.total_mwh || 0) / 1000)
        })),
        growth: this.calculateGrowthMetrics(data),
        projections: this.calculateProjections(data)
      };

      // Cache the results
      this.historicalCache = trends;
      this.lastFetch = Date.now();
      
      return trends;
    } catch (error) {
      console.error('Error fetching historical trends:', error);
      return this.getFallbackHistoricalData();
    }
  }

  // Calculate price based on aggregation (same logic as component)
  calculatePrice(aggregationGWh) {
    const aggregationMWh = aggregationGWh * 1000;
    
    if (aggregationMWh <= 0) return 210;
    if (aggregationMWh <= 10) return 210;
    if (aggregationMWh <= 100) return 210 - ((aggregationMWh - 10) / 90) * 60;
    if (aggregationMWh <= 500) return 150 - ((aggregationMWh - 100) / 400) * 35;
    if (aggregationMWh <= 1500) return 115 - ((aggregationMWh - 500) / 1000) * 20;
    if (aggregationMWh <= 3000) return 95 - ((aggregationMWh - 1500) / 1500) * 5;
    if (aggregationMWh <= 6000) return 90 + ((aggregationMWh - 3000) / 3000) * 10;
    if (aggregationMWh <= 8000) return 100 - ((aggregationMWh - 6000) / 2000) * 5;
    if (aggregationMWh <= 12000) return 95 - ((aggregationMWh - 8000) / 4000) * 25;
    if (aggregationMWh <= 16000) return 70 - ((aggregationMWh - 12000) / 4000) * 43;
    
    return 27;
  }

  // Calculate growth metrics
  calculateGrowthMetrics(data) {
    if (!data || data.length < 2) return null;
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    return {
      projectGrowth: ((latest.total_projects - previous.total_projects) / previous.total_projects) * 100,
      capacityGrowth: ((latest.total_mwh - previous.total_mwh) / previous.total_mwh) * 100,
      priceChange: this.calculatePrice(latest.total_mwh / 1000) - this.calculatePrice(previous.total_mwh / 1000)
    };
  }

  // Calculate future projections
  calculateProjections(data) {
    if (!data || data.length < 7) return null;
    
    // Simple linear regression for projection
    const recentData = data.slice(-14); // Last 2 weeks
    const avgGrowth = recentData.reduce((sum, point, index) => {
      if (index === 0) return 0;
      const growth = (point.total_mwh - recentData[index - 1].total_mwh) / recentData[index - 1].total_mwh;
      return sum + growth;
    }, 0) / (recentData.length - 1);
    
    const currentMWh = data[data.length - 1].total_mwh;
    const projectedMWh = currentMWh * Math.pow(1 + avgGrowth, 30); // 30 days ahead
    
    return {
      projectedMWh: Math.min(projectedMWh, 16000), // Cap at 16 GWh
      projectedPrice: this.calculatePrice(Math.min(projectedMWh, 16000) / 1000),
      estimatedDays: avgGrowth > 0 ? Math.log(16000 / currentMWh) / Math.log(1 + avgGrowth) : null
    };
  }

  // Fallback data when API is unavailable
  getFallbackData() {
    return {
      totalProjects: 123,
      totalMW: 2180,
      totalMWh: 5600,
      projectsByDuration: {
        '1h': 41,
        '2h': 38,
        '4h': 29,
        '8h': 15
      },
      currentAggregation: 5.6,
      lastUpdated: new Date().toISOString()
    };
  }

  // Fallback historical data
  getFallbackHistoricalData() {
    const dates = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return {
      timeline: dates.map((date, index) => ({
        date,
        totalMWh: 2000 + (index * 120) + Math.random() * 200,
        totalProjects: 50 + index * 2 + Math.floor(Math.random() * 3),
        averagePrice: 180 - (index * 2) + Math.random() * 10
      })),
      growth: {
        projectGrowth: 12.5,
        capacityGrowth: 15.8,
        priceChange: -2.3
      },
      projections: {
        projectedMWh: 8500,
        projectedPrice: 75,
        estimatedDays: 45
      }
    };
  }

  // Start polling as fallback
  startPolling() {
    setInterval(async () => {
      try {
        const data = await this.getCurrentAggregation();
        this.notifySubscribers(data);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // Poll every 30 seconds
  }

  // Cleanup
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.subscribers.clear();
  }
}

// Export singleton instance
export const aggregationService = new AggregationService();
export default aggregationService;