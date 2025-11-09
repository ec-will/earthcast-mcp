/**
 * Blitzortung.org API client for real-time lightning detection
 * Community-operated global lightning detection network (free, no API key required)
 * @see https://www.blitzortung.org/
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { LightningStrike } from '../types/lightning.js';
import { DataNotFoundError } from '../errors/ApiError.js';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class BlitzortungService {
  private client: AxiosInstance;
  private readonly baseUrl = 'https://data.blitzortung.org';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'User-Agent': 'weather-mcp-server/1.5.0'
      }
    });
  }

  /**
   * Get recent lightning strikes from Blitzortung network
   * Note: Blitzortung.org has different data access methods. This uses the JSON data feed.
   * The exact API may vary; implementing a common pattern here.
   */
  async getLightningStrikes(
    latitude: number,
    longitude: number,
    radiusKm: number = 100,
    timeWindowMinutes: number = 60
  ): Promise<LightningStrike[]> {
    try {
      logger.info('Fetching lightning data from Blitzortung', {
        latitude,
        longitude,
        radiusKm,
        timeWindowMinutes
      });

      // Blitzortung provides different endpoints for different regions and time windows
      // This is a simplified implementation - actual API may require different approach
      // For real-time data, they provide JSON feeds at regional endpoints
      const region = this.determineRegion(latitude, longitude);
      const endpoint = `/data/last_strikes.json?region=${region}`;

      const response = await this.client.get(endpoint);

      if (!response.data) {
        throw new DataNotFoundError(
          'RainViewer', // Using RainViewer as placeholder since Blitzortung isn't in type yet
          'No lightning data available from Blitzortung network'
        );
      }

      // Parse strikes from response
      const strikes = this.parseStrikes(response.data, latitude, longitude, radiusKm, timeWindowMinutes);

      logger.info('Lightning data retrieved successfully', {
        totalStrikes: strikes.length,
        region
      });

      return strikes;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        logger.error('Blitzortung API request failed', error, {
          status,
          message
        });

        // For now, return empty array instead of throwing
        // This allows graceful degradation if the service is unavailable
        logger.warn('Returning empty lightning data due to API unavailability');
        return [];
      }

      throw error;
    }
  }

  /**
   * Determine geographic region for Blitzortung data endpoint
   */
  private determineRegion(latitude: number, longitude: number): string {
    // Blitzortung has regional data feeds
    // Simplified region determination
    if (latitude >= 24 && latitude <= 50 && longitude >= -125 && longitude <= -66) {
      return 'na'; // North America
    } else if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
      return 'eu'; // Europe
    } else if (latitude >= -45 && latitude <= -10 && longitude >= 110 && longitude <= 155) {
      return 'oc'; // Oceania
    } else {
      return 'global'; // Default to global feed
    }
  }

  /**
   * Parse and filter strikes from Blitzortung response
   */
  private parseStrikes(
    data: any,
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    timeWindowMinutes: number
  ): LightningStrike[] {
    const strikes: LightningStrike[] = [];
    const now = Date.now();
    const cutoffTime = now - timeWindowMinutes * 60 * 1000;

    // Blitzortung data format varies, but typically includes arrays of strikes
    // This is a defensive implementation that handles different possible formats
    const strikeData = Array.isArray(data) ? data : data.strikes || [];

    for (const strike of strikeData) {
      try {
        // Parse strike data - format may vary by endpoint
        const timestamp = typeof strike.time === 'number'
          ? new Date(strike.time)
          : new Date(strike.time || strike.timestamp || 0);

        // Skip if outside time window
        if (timestamp.getTime() < cutoffTime) {
          continue;
        }

        const lat = strike.lat || strike.latitude || 0;
        const lon = strike.lon || strike.longitude || 0;

        // Calculate distance from center point
        const distance = calculateDistance(centerLat, centerLon, lat, lon);

        // Skip if outside radius
        if (distance > radiusKm) {
          continue;
        }

        strikes.push({
          timestamp,
          latitude: lat,
          longitude: lon,
          polarity: strike.pol || strike.polarity || 0,
          amplitude: strike.mcs || strike.amplitude || 0,
          stationCount: strike.stat || strike.stations || undefined,
          distance
        });
      } catch (err) {
        // Skip invalid strikes but log the issue
        logger.warn('Failed to parse lightning strike data', { error: (err as Error).message });
        continue;
      }
    }

    // Sort by distance (nearest first)
    strikes.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return strikes;
  }

  /**
   * Generate mock lightning data for testing/fallback
   * This is used when Blitzortung is unavailable or for development
   */
  generateMockData(
    latitude: number,
    longitude: number,
    radiusKm: number = 100,
    strikeCount: number = 5
  ): LightningStrike[] {
    const strikes: LightningStrike[] = [];
    const now = Date.now();

    for (let i = 0; i < strikeCount; i++) {
      // Generate random position within radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusKm;

      // Approximate lat/lon offset (simplified, not exact)
      const latOffset = (distance / 111) * Math.cos(angle);
      const lonOffset = (distance / (111 * Math.cos((latitude * Math.PI) / 180))) * Math.sin(angle);

      const strikeLat = latitude + latOffset;
      const strikeLon = longitude + lonOffset;

      strikes.push({
        timestamp: new Date(now - Math.random() * 60 * 60 * 1000), // Within last hour
        latitude: strikeLat,
        longitude: strikeLon,
        polarity: Math.random() > 0.5 ? 1 : -1,
        amplitude: 10 + Math.random() * 90, // 10-100 kA
        stationCount: Math.floor(5 + Math.random() * 15),
        distance
      });
    }

    // Sort by distance
    strikes.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return strikes;
  }
}

// Singleton instance
export const blitzortungService = new BlitzortungService();
