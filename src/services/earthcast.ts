/**
 * Earthcast Technologies API Service
 * 
 * Provides access to environmental and weather data from Earthcast Technologies API.
 * Based on the proven service pattern from earthcast-mcp.
 */

import axios, { AxiosError } from 'axios';
import { Cache } from '../utils/cache.js';
import { CacheConfig } from '../config/cache.js';
import { logger } from '../utils/logger.js';
import {
  ApiError,
  ServiceUnavailableError,
  RateLimitError,
} from '../errors/ApiError.js';
import type {
  GoNoGoArgs,
  ForecastQueryArgs,
  WeatherQueryArgs,
  ProductTimestampArgs,
  VectorQueryArgs,
  OpticalDepthArgs,
  GoNoGoResponse,
  GeodataResponse,
  ProductTimestampResponse,
} from '../types/earthcast.js';

/**
 * Configuration for Earthcast Technologies API
 * 
 * Default to sandbox, can be overridden with ECT_API_URL environment variable
 * Production URL will be: https://ect-api.com
 */
const ECT_BASE_URL = process.env.ECT_API_URL || 'http://ect-sandbox.com';

// Cache TTL for different data types (in milliseconds)
const HOUR = 60 * 60 * 1000;
const ECT_DATA_TTL = 1 * HOUR; // Adjust based on data volatility

/**
 * Earthcast Technologies API Service
 * 
 * Handles all communication with the Earthcast API including:
 * - Request/response handling
 * - Retry logic with exponential backoff
 * - Caching with appropriate TTL
 * - Error handling and conversion to custom error types
 */
export class EarthcastService {
  private cache: Cache;
  private baseUrl: string;

  constructor() {
    this.cache = new Cache(CacheConfig.maxSize);
    this.baseUrl = ECT_BASE_URL;
    
    logger.info('Earthcast Technologies service initialized', {
      baseUrl: this.baseUrl,
      cacheEnabled: CacheConfig.enabled,
    });
  }

  /**
   * Get Go/No-Go launch decision support
   * 
   * @param params - Go/No-Go query parameters
   * @returns Go/No-Go decision response
   */
  async getGoNoGoDecision(params: GoNoGoArgs): Promise<GoNoGoResponse> {
    const cacheKey = Cache.generateKey('gonogo', JSON.stringify(params));

    if (CacheConfig.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for Go/No-Go decision');
        return cached as GoNoGoResponse;
      }
    }

    try {
      const data = await this.retryWithBackoff(async () => {
        const response = await this.request<GoNoGoResponse>(
          '/weather/dss/launch/gonogo',
          params as unknown as Record<string, unknown>
        );
        return response;
      });

      if (CacheConfig.enabled) {
        // Cache for 5 minutes (decision support is time-sensitive)
        this.cache.set(cacheKey, data, 5 * 60 * 1000);
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch Go/No-Go decision');
      throw this.handleApiError(error);
    }
  }

  /**
   * Get latest forecast data for a product
   * 
   * @param params - Forecast query parameters
   * @returns Geospatial forecast data
   */
  async getForecastData(params: ForecastQueryArgs): Promise<GeodataResponse> {
    const cacheKey = Cache.generateKey('forecast', JSON.stringify(params));

    if (CacheConfig.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for forecast data', { product: params.product });
        return cached as GeodataResponse;
      }
    }

    try {
      const data = await this.retryWithBackoff(async () => {
        const response = await this.request<GeodataResponse>(
          '/weather/query/forecast',
          params as unknown as Record<string, unknown>
        );
        return response;
      });

      if (CacheConfig.enabled) {
        // Cache forecasts for 2 hours
        this.cache.set(cacheKey, data, 2 * ECT_DATA_TTL);
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch forecast data');
      throw this.handleApiError(error);
    }
  }

  /**
   * Query weather data for one or more products
   * 
   * @param params - Weather data query parameters
   * @returns Geospatial weather data
   */
  async queryWeatherData(params: WeatherQueryArgs): Promise<GeodataResponse> {
    const cacheKey = Cache.generateKey('weather_query', JSON.stringify(params));

    if (CacheConfig.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for weather data query');
        return cached as GeodataResponse;
      }
    }

    try {
      const data = await this.retryWithBackoff(async () => {
        const response = await this.request<GeodataResponse>(
          '/weather/query/request',
          params as unknown as Record<string, unknown>
        );
        return response;
      });

      if (CacheConfig.enabled) {
        // Cache for 1 hour (current/recent data)
        this.cache.set(cacheKey, data, ECT_DATA_TTL);
      }

      return data;
    } catch (error) {
      logger.error('Failed to query weather data');
      throw this.handleApiError(error);
    }
  }

  /**
   * Query weather data along an ordered vector path
   * Useful for orbital trajectories and satellite paths
   * 
   * @param params - Vector query parameters
   * @returns Geospatial weather data along the vector path
   */
  async queryByVector(params: VectorQueryArgs): Promise<GeodataResponse> {
    const cacheKey = Cache.generateKey('vector_query', JSON.stringify(params));

    if (CacheConfig.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for vector query');
        return cached as GeodataResponse;
      }
    }

    try {
      const data = await this.retryWithBackoff(async () => {
        const response = await this.request<GeodataResponse>(
          '/weather/query/by_vector',
          params as unknown as Record<string, unknown>
        );
        return response;
      });

      if (CacheConfig.enabled) {
        // Cache for 1 hour (current/recent data)
        this.cache.set(cacheKey, data, ECT_DATA_TTL);
      }

      return data;
    } catch (error) {
      logger.error('Failed to query weather data by vector');
      throw this.handleApiError(error);
    }
  }

  /**
   * Assess optical depth along a line-of-sight
   * Useful for ground-based telescope observations
   * 
   * @param params - Optical depth assessment parameters
   * @returns Optical depth assessment with visibility probabilities
   */
  async assessOpticalDepth(params: OpticalDepthArgs): Promise<GeodataResponse> {
    const cacheKey = Cache.generateKey('optical_depth', JSON.stringify(params));

    if (CacheConfig.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for optical depth assessment');
        return cached as GeodataResponse;
      }
    }

    try {
      const data = await this.retryWithBackoff(async () => {
        const response = await this.request<GeodataResponse>(
          '/weather/query/optical_depth_assessment',
          params as unknown as Record<string, unknown>
        );
        return response;
      });

      if (CacheConfig.enabled) {
        // Cache for 1 hour (optical observations are time-sensitive)
        this.cache.set(cacheKey, data, ECT_DATA_TTL);
      }

      return data;
    } catch (error) {
      logger.error('Failed to assess optical depth');
      throw this.handleApiError(error);
    }
  }

  /**
   * Get latest timestamp for a product
   * 
   * @param params - Product timestamp parameters
   * @returns Product timestamp
   */
  async getProductTimestamp(
    params: ProductTimestampArgs
  ): Promise<ProductTimestampResponse> {
    const cacheKey = Cache.generateKey('timestamp', params.product);

    if (CacheConfig.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for product timestamp', { product: params.product });
        return cached as ProductTimestampResponse;
      }
    }

    try {
      const data = await this.retryWithBackoff(async () => {
        const response = await this.request<ProductTimestampResponse>(
          '/weather/product/timestamp',
          params as unknown as Record<string, unknown>
        );
        return response;
      });

      if (CacheConfig.enabled) {
        // Cache timestamps for 15 minutes
        this.cache.set(cacheKey, data, 15 * 60 * 1000);
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch product timestamp');
      throw this.handleApiError(error);
    }
  }

  /**
   * Make an authenticated API request
   * 
   * @param endpoint - API endpoint path
   * @param params - Query parameters
   * @returns API response data
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const apiTimeout = parseInt(process.env.API_TIMEOUT_MS || '30000', 10);
    
    // Get auth credentials from environment
    const username = process.env.ECT_API_USERNAME;
    const password = process.env.ECT_API_PASSWORD;

    const response = await axios.get(url, {
      params,
      timeout: apiTimeout,
      headers: {
        'User-Agent': 'earthcast-mcp/0.1.0',
      },
      auth: username && password ? { username, password } : undefined,
    });

    return response.data;
  }

  /**
   * Retry logic with exponential backoff and jitter
   * 
   * @param fn - Async function to retry
   * @param maxRetries - Maximum number of retry attempts
   * @returns Result from the function
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw error;
          }
        }

        // If we've exhausted retries, throw
        if (attempt === maxRetries) {
          break;
        }

        // Calculate backoff with jitter
        const baseDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        const jitter = Math.random() * 1000; // 0-1s of jitter
        const delay = baseDelay + jitter;

        logger.warn('API request failed, retrying', {
          attempt: attempt + 1,
          maxRetries,
          delayMs: Math.round(delay),
          error: lastError.message,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Convert Axios errors to custom error types
   * 
   * @param error - Error from API call
   * @returns Custom ApiError subclass
   */
  private handleApiError(error: unknown): ApiError {
    if (!axios.isAxiosError(error)) {
      return new ApiError(
        'An unexpected error occurred',
        500,
        'Earthcast',
        'An unexpected error occurred',
        [],
        false
      );
    }

    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const message = axiosError.message;

    // Rate limiting
    if (status === 429) {
      return new RateLimitError('Earthcast', 'API rate limit exceeded');
    }

    // Server errors (5xx)
    if (status && status >= 500) {
      return new ServiceUnavailableError(
        'Earthcast',
        'API server error'
      );
    }

    // Timeout
    if (axiosError.code === 'ECONNABORTED') {
      return new ServiceUnavailableError(
        'Earthcast',
        'API request timeout'
      );
    }

    // Network errors
    if (!axiosError.response) {
      return new ServiceUnavailableError(
        'Earthcast',
        'Network error - unable to reach API'
      );
    }

    // Generic API error
    return new ApiError(
      message,
      status || 500,
      'Earthcast',
      message,
      [],
      false
    );
  }

  /**
   * Check if the Earthcast API is operational
   */
  async checkServiceStatus(): Promise<{
    operational: boolean;
    message: string;
    statusPage: string;
    timestamp: string;
  }> {
    try {
      // Simple health check using product timestamp endpoint
      const url = `${this.baseUrl}/weather/product/timestamp`;
      const username = process.env.ECT_API_USERNAME;
      const password = process.env.ECT_API_PASSWORD;

      const response = await axios.get(url, {
        params: { product: 'lightning_density' },
        timeout: 10000,
        headers: {
          'User-Agent': 'earthcast-mcp/0.1.0',
        },
        auth: username && password ? { username, password } : undefined,
      });

      if (response.status === 200) {
        return {
          operational: true,
          message: 'Earthcast Technologies API is operational',
          statusPage: 'Contact Earthcast Technologies for service status',
          timestamp: new Date().toISOString()
        };
      }

      return {
        operational: false,
        message: `Earthcast API returned unexpected status: ${response.status}`,
        statusPage: 'Contact Earthcast Technologies for service status',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      let message = 'Earthcast Technologies API is unavailable';

      if (axiosError.code === 'ECONNREFUSED') {
        message = 'Cannot connect to Earthcast API (connection refused)';
      } else if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
        message = 'Earthcast API request timed out';
      } else if (axiosError.response?.status === 401) {
        message = 'Earthcast API authentication failed (check ECT_API_USERNAME and ECT_API_PASSWORD)';
      } else if (axiosError.response?.status === 403) {
        message = 'Earthcast API access forbidden';
      } else if (axiosError.response?.status) {
        message = `Earthcast API error (HTTP ${axiosError.response.status})`;
      }

      logger.warn('Earthcast service check failed', {
        error: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status
      });

      return {
        operational: false,
        message,
        statusPage: 'Contact Earthcast Technologies for service status',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Earthcast Technologies service cache cleared');
  }
}
