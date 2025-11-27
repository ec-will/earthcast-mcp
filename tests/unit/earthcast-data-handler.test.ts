/**
 * Unit tests for Earthcast data query handler
 * Tests spatial/temporal filtering, altitude queries, and response formatting
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { handleEarthcastDataQuery } from '../../src/handlers/earthcastDataHandler.js';
import { EarthcastService } from '../../src/services/earthcast.js';

// Mock the Earthcast service
vi.mock('../../src/services/earthcast.js', () => ({
  EarthcastService: vi.fn()
}));

describe('Earthcast Data Query Handler', () => {
  let mockEarthcastService: any;
  let mockQueryWeatherData: Mock;

  beforeEach(() => {
    mockQueryWeatherData = vi.fn();
    mockEarthcastService = {
      queryWeatherData: mockQueryWeatherData
    };
    mockQueryWeatherData.mockReset();
  });

  describe('Parameter Validation', () => {
    it('should accept valid query parameters', async () => {
      mockQueryWeatherData.mockResolvedValue({
        requested: {
          products: ['lightning_density']
        },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': {
              average_value: 0.0
            }
          }
        }
      });

      const result = await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          radius: 50
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Earthcast Weather Data');
      expect(mockQueryWeatherData).toHaveBeenCalled();
    });

    it('should reject empty products', async () => {
      await expect(
        handleEarthcastDataQuery(
          {
            products: '',
            latitude: 28.5,
            longitude: -80.5
          },
          mockEarthcastService
        )
      ).rejects.toThrow('At least one product must be specified');
    });

    it('should reject invalid latitude', async () => {
      await expect(
        handleEarthcastDataQuery(
          {
            products: 'lightning_density',
            latitude: 100,
            longitude: -80.5
          },
          mockEarthcastService
        )
      ).rejects.toThrow();
    });

    it('should reject invalid longitude', async () => {
      await expect(
        handleEarthcastDataQuery(
          {
            products: 'lightning_density',
            latitude: 28.5,
            longitude: -200
          },
          mockEarthcastService
        )
      ).rejects.toThrow();
    });

    it('should accept bbox instead of lat/lon', async () => {
      mockQueryWeatherData.mockResolvedValue({
        requested: { products: ['lightning_density'] },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': { average_value: 0.0 }
          }
        }
      });

      const result = await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          bbox: '-82,28,-78,32'
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(mockQueryWeatherData).toHaveBeenCalled();
    });

    it('should require either bbox or lat/lon', async () => {
      await expect(
        handleEarthcastDataQuery(
          {
            products: 'lightning_density'
          },
          mockEarthcastService
        )
      ).rejects.toThrow('Either bbox or latitude/longitude must be provided');
    });
  });

  describe('Query Building', () => {
    beforeEach(() => {
      mockQueryWeatherData.mockResolvedValue({
        requested: { products: ['lightning_density'] },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': { average_value: 0.0 }
          }
        }
      });
    });

    it('should build query with multiple products', async () => {
      await handleEarthcastDataQuery(
        {
          products: 'lightning_density,reflectivity_5k,low-level-windshear',
          latitude: 28.5,
          longitude: -80.5
        },
        mockEarthcastService
      );

      const callArgs = mockQueryWeatherData.mock.calls[0][0];
      expect(callArgs.products).toBe('lightning_density,reflectivity_5k,low-level-windshear');
    });

    it('should handle altitude filtering', async () => {
      await handleEarthcastDataQuery(
        {
          products: 'neutral_density',
          latitude: 28.5,
          longitude: -80.5,
          altitude: 400
        },
        mockEarthcastService
      );

      const callArgs = mockQueryWeatherData.mock.calls[0][0];
      expect(callArgs.alt).toBe(400);
    });

    it('should handle altitude range', async () => {
      await handleEarthcastDataQuery(
        {
          products: 'neutral_density',
          latitude: 28.5,
          longitude: -80.5,
          altitude_min: 200,
          altitude_max: 600
        },
        mockEarthcastService
      );

      const callArgs = mockQueryWeatherData.mock.calls[0][0];
      expect(callArgs.alt_min).toBe(200);
      expect(callArgs.alt_max).toBe(600);
    });

    it('should handle temporal filtering with date', async () => {
      await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          date: '2025-11-27T20:00:00Z'
        },
        mockEarthcastService
      );

      const callArgs = mockQueryWeatherData.mock.calls[0][0];
      expect(callArgs.date).toBe('2025-11-27T20:00:00Z');
    });

    it('should handle temporal range with date_start and date_end', async () => {
      await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          date_start: '2025-11-27T18:00:00Z',
          date_end: '2025-11-27T20:00:00Z'
        },
        mockEarthcastService
      );

      const callArgs = mockQueryWeatherData.mock.calls[0][0];
      expect(callArgs.date_start).toBe('2025-11-27T18:00:00Z');
      expect(callArgs.date_end).toBe('2025-11-27T20:00:00Z');
    });

    it('should include resolution parameters', async () => {
      await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          width: 100,
          height: 100
        },
        mockEarthcastService
      );

      const callArgs = mockQueryWeatherData.mock.calls[0][0];
      expect(callArgs.width).toBe(100);
      expect(callArgs.height).toBe(100);
    });
  });


  describe('Response Formatting', () => {
    it('should format single product with grid data', async () => {
      mockQueryWeatherData.mockResolvedValue({
        requested: {
          products: ['lightning_density'],
          lat_lon: [28.5, -80.5],
          radius_km: 50
        },
        conditions: {
          lightning_density: {
            resolution_km: { east_west: 20.1, north_south: 20.1 },
            '2025-11-27T20:00:00Z': {
              average_value: 0.0,
              grid: [[0.0, 0.0], [0.0, 0.0]]
            }
          }
        }
      });

      const result = await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          radius: 50
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('LIGHTNING DENSITY');
      expect(result.content[0].text).toContain('2025-11-27T20:00:00Z');
      expect(result.content[0].text).toContain('20.1 km');
    });

    it('should display multiple products', async () => {
      mockQueryWeatherData.mockResolvedValue({
        requested: {
          products: ['lightning_density', 'reflectivity_5k']
        },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': { average_value: 0.0 }
          },
          reflectivity_5k: {
            '2025-11-27T20:00:00Z': { average_value: 10.5 }
          }
        }
      });

      const result = await handleEarthcastDataQuery(
        {
          products: 'lightning_density,reflectivity_5k',
          latitude: 28.5,
          longitude: -80.5
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('lightning_density');
      expect(result.content[0].text).toContain('reflectivity_5k');
    });

    it('should compute statistics for grid data', async () => {
      mockQueryWeatherData.mockResolvedValue({
        requested: { products: ['lightning_density'] },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': {
              average_value: 0.5,
              grid: [
                [0.1, 0.2, 0.3],
                [0.4, 0.5, 0.6],
                [0.7, 0.8, 0.9]
              ]
            }
          }
        }
      });

      const result = await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('0.50');
    });

    it('should handle products with exceptions', async () => {
      mockQueryWeatherData.mockResolvedValue({
        requested: { products: ['lightning_density'] },
        conditions: {
          lightning_density: {
            exception: 'Product temporarily unavailable'
          }
        }
      });

      const result = await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('Product temporarily unavailable');
    });
  });


  describe('Spatial Query Types', () => {
    beforeEach(() => {
      mockQueryWeatherData.mockResolvedValue({
        requested: { products: ['lightning_density'] },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': { average_value: 0.0 }
          }
        }
      });
    });

    it('should query by lat/lon with radius', async () => {
      await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          radius: 100
        },
        mockEarthcastService
      );

      const callArgs = mockQueryWeatherData.mock.calls[0][0];
      expect(callArgs.lat).toBe(28.5);
      expect(callArgs.lon).toBe(-80.5);
      expect(callArgs.radius).toBe(100);
    });

    it('should query by bounding box', async () => {
      await handleEarthcastDataQuery(
        {
          products: 'lightning_density',
          bbox: '-82.5,27.5,-78.5,29.5'
        },
        mockEarthcastService
      );

      const callArgs = mockQueryWeatherData.mock.calls[0][0];
      expect(callArgs.bbox).toBe('-82.5,27.5,-78.5,29.5');
    });
  });
});
