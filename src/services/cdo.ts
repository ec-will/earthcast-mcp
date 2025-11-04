/**
 * Service for interacting with the NOAA Climate Data Online (CDO) API v2
 * Documentation: https://www.ncdc.noaa.gov/cdo-web/webservices/v2
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  CDOLocationCollectionResponse,
  CDOStationCollectionResponse,
  CDODataCollectionResponse,
  CDOErrorResponse
} from '../types/cdo.js';

export interface CDOServiceConfig {
  token?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export class CDOService {
  private client: AxiosInstance;
  private maxRetries: number;
  private token?: string;

  constructor(config: CDOServiceConfig = {}) {
    const {
      token,
      baseURL = 'https://www.ncei.noaa.gov/cdo-web/api/v2',
      timeout = 30000,
      maxRetries = 3
    } = config;

    this.token = token;
    this.maxRetries = maxRetries;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Accept': 'application/json'
      }
    });

    // Add token to headers if provided
    if (token) {
      this.client.defaults.headers.common['token'] = token;
    }

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }

  /**
   * Handle API errors
   */
  private async handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as CDOErrorResponse;

      // Unauthorized - missing or invalid token
      if (status === 401) {
        throw new Error('CDO API authentication failed. Please check your API token. Get one at: https://www.ncdc.noaa.gov/cdo-web/token');
      }

      // Rate limit error
      if (status === 429) {
        throw new Error('CDO API rate limit exceeded (5 req/sec or 10k req/day). Please retry later.');
      }

      // Bad request
      if (status === 400) {
        throw new Error(`CDO API error: ${data.message || 'Invalid request parameters'}`);
      }

      // Not found
      if (status === 404) {
        throw new Error(`CDO API: Resource not found (${error.config?.url})`);
      }

      // Other client errors
      if (status >= 400 && status < 500) {
        throw new Error(`CDO API error: ${data.message || 'Request failed'}`);
      }

      // Server errors
      if (status >= 500) {
        throw new Error(`CDO API server error: Service temporarily unavailable`);
      }
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request to CDO API timed out. Please try again.');
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to CDO API. Please check your internet connection.');
    }

    // Generic error
    throw new Error(`CDO API request failed: ${error.message}`);
  }

  /**
   * Make request with retry logic
   */
  private async makeRequest<T>(
    url: string,
    params?: Record<string, string | number>,
    retries = 0
  ): Promise<T> {
    try {
      const response = await this.client.get<T>(url, { params });
      return response.data;
    } catch (error) {
      // Retry on rate limit or server errors
      if (retries < this.maxRetries) {
        const shouldRetry =
          (error as Error).message.includes('rate limit') ||
          (error as Error).message.includes('server error') ||
          (error as Error).message.includes('timed out');

        if (shouldRetry) {
          const delay = Math.pow(2, retries) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest<T>(url, params, retries + 1);
        }
      }
      throw error;
    }
  }

  /**
   * Find nearest stations to a location
   * Uses a broader search strategy since extent-based search has data quality issues
   */
  async findStationsByLocation(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    limit: number = 5
  ): Promise<CDOStationCollectionResponse> {
    // Strategy: Search for US stations by getting a large number without location filter,
    // then filter by distance ourselves. This works better than extent-based search
    // which returns incorrect or Antarctic stations.

    const params = {
      limit: '1000', // Get a large batch to filter
      datasetid: 'GHCND', // Global Historical Climatology Network - Daily
      datatypeid: 'TMAX' // Stations with temperature data
    };

    const response = await this.makeRequest<CDOStationCollectionResponse>('/stations', params);

    if (!response.results || response.results.length === 0) {
      return { metadata: response.metadata, results: [] };
    }

    // Filter to only US stations (station IDs starting with 'US')
    let usStations = response.results.filter(s => s.id.startsWith('GHCND:US'));

    // Sort by distance to the target coordinates
    usStations.sort((a, b) => {
      const distA = this.calculateDistance(latitude, longitude, a.latitude, a.longitude);
      const distB = this.calculateDistance(latitude, longitude, b.latitude, b.longitude);
      return distA - distB;
    });

    // Filter out stations that are too far away (more than 100km)
    const maxDistance = 100; // km
    usStations = usStations.filter(s => {
      const dist = this.calculateDistance(latitude, longitude, s.latitude, s.longitude);
      return dist <= maxDistance;
    });

    // Return only the requested number of closest stations
    response.results = usStations.slice(0, limit);

    return response;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula (in km)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get daily summary data from a station
   */
  async getDailySummaries(
    stationId: string,
    startDate: string,
    endDate: string,
    dataTypes?: string[],
    limit: number = 1000
  ): Promise<CDODataCollectionResponse> {
    const params: Record<string, string | number> = {
      datasetid: 'GHCND',
      stationid: stationId,
      startdate: startDate,
      enddate: endDate,
      limit: Math.min(limit, 1000), // API max is 1000
      units: 'standard' // Use Fahrenheit and inches
    };

    if (dataTypes && dataTypes.length > 0) {
      params.datatypeid = dataTypes.join(',');
    }

    return this.makeRequest<CDODataCollectionResponse>('/data', params);
  }

  /**
   * Get historical data for a location (convenience method)
   * Finds nearest station and retrieves daily summaries
   */
  async getHistoricalData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    limit: number = 1000
  ): Promise<CDODataCollectionResponse> {
    // Check if token is available
    if (!this.token) {
      throw new Error('CDO API token is required for historical data. Set the NOAA_CDO_TOKEN environment variable or get a token at: https://www.ncdc.noaa.gov/cdo-web/token');
    }

    // Find stations near the location
    const stations = await this.findStationsByLocation(
      latitude,
      longitude,
      startDate,
      endDate,
      5
    );

    if (!stations.results || stations.results.length === 0) {
      throw new Error('No weather stations found near the specified location with data for the requested date range.');
    }

    // Try stations in order until we get data
    for (const station of stations.results) {
      try {
        const data = await this.getDailySummaries(
          station.id,
          startDate,
          endDate,
          ['TMAX', 'TMIN', 'TAVG', 'PRCP', 'SNOW'], // Common data types
          limit
        );

        if (data.results && data.results.length > 0) {
          return data;
        }
      } catch (error) {
        // Try next station
        continue;
      }
    }

    throw new Error('No historical data available from nearby stations for the requested date range.');
  }
}
