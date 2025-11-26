/**
 * Earthcast Technologies API Service
 * 
 * Provides access to environmental and weather data from Earthcast Technologies API.
 * Based on the proven service pattern from weather-mcp.
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
   * Example method: Fetch environmental data
   * TODO: Replace with actual Earthcast API endpoints
   * 
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Environmental data response
   */
  async getEnvironmentalData(
    latitude: number,
    longitude: number
  ): Promise<any> {
    // Generate cache key
    const cacheKey = Cache.generateKey('ect_env', latitude, longitude);

    // Check cache first
    if (CacheConfig.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for environmental data', { latitude, longitude });
        return cached;
      }
    }

    // Make API call with retry logic
    try {
      const data = await this.retryWithBackoff(async () => {
        const url = `${this.baseUrl}/api/environmental`; // TODO: Update with actual endpoint
        const apiTimeout = parseInt(process.env.API_TIMEOUT_MS || '30000', 10);
        const response = await axios.get(url, {
          params: { latitude, longitude },
          timeout: apiTimeout,
          headers: {
            'User-Agent': 'earthcast-mcp/0.1.0',
          },
        });
        return response.data;
      });

      // Cache the result
      if (CacheConfig.enabled) {
        this.cache.set(cacheKey, data, ECT_DATA_TTL);
        logger.debug('Cached environmental data', { latitude, longitude });
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch environmental data');
      throw this.handleApiError(error);
    }
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
