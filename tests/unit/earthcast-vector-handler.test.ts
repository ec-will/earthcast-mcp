/**
 * Unit tests for Earthcast vector query handler
 * Tests vector validation, query building, and response formatting
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { handleEarthcastVectorQuery } from '../../src/handlers/earthcastVectorHandler.js';
import { EarthcastService } from '../../src/services/earthcast.js';

// Mock the Earthcast service
vi.mock('../../src/services/earthcast.js', () => ({
  EarthcastService: vi.fn()
}));

describe('Earthcast Vector Query Handler', () => {
  let mockEarthcastService: any;
  let mockQueryByVector: Mock;

  beforeEach(() => {
    mockQueryByVector = vi.fn();
    mockEarthcastService = {
      queryByVector: mockQueryByVector
    };
    mockQueryByVector.mockReset();
  });

  describe('Parameter Validation', () => {
    it('should accept valid vector query parameters', async () => {
      mockQueryByVector.mockResolvedValue({
        requested: {
          products: ['neutral_density']
        },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              vectors: [
                { average_value: 2.88e-12, grid: [[2.87e-12, 2.88e-12]] }
              ]
            }
          }
        }
      });

      const result = await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: -180, radius: 50, alt: 400 },
            { lat: 0, lon: -144, radius: 50, alt: 400 }
          ],
          width: 10,
          height: 10
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Earthcast Vector Query Results');
      expect(mockQueryByVector).toHaveBeenCalled();
    });

    it('should reject empty products', async () => {
      await expect(
        handleEarthcastVectorQuery(
          {
            products: '',
            vectors: [{ lat: 0, lon: 0, radius: 50 }]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('At least one product must be specified');
    });

    it('should reject missing vectors', async () => {
      await expect(
        handleEarthcastVectorQuery(
          {
            products: 'neutral_density',
            vectors: []
          },
          mockEarthcastService
        )
      ).rejects.toThrow('At least one vector must be provided');
    });

    it('should reject invalid latitude in vector', async () => {
      await expect(
        handleEarthcastVectorQuery(
          {
            products: 'neutral_density',
            vectors: [{ lat: 95, lon: 0, radius: 50 }]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('latitude must be between -90 and 90');
    });

    it('should reject invalid longitude in vector', async () => {
      await expect(
        handleEarthcastVectorQuery(
          {
            products: 'neutral_density',
            vectors: [{ lat: 0, lon: 200, radius: 50 }]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('longitude must be between -180 and 180');
    });

    it('should reject negative radius', async () => {
      await expect(
        handleEarthcastVectorQuery(
          {
            products: 'neutral_density',
            vectors: [{ lat: 0, lon: 0, radius: -10 }]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('radius must be a positive number');
    });

    it('should reject negative altitude', async () => {
      await expect(
        handleEarthcastVectorQuery(
          {
            products: 'neutral_density',
            vectors: [{ lat: 0, lon: 0, radius: 50, alt: -100 }]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('altitude must be a non-negative number');
    });

    it('should accept vector without altitude', async () => {
      mockQueryByVector.mockResolvedValue({
        requested: { products: ['neutral_density'] },
        conditions: {}
      });

      const result = await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: [{ lat: 0, lon: 0, radius: 50 }]
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(mockQueryByVector).toHaveBeenCalled();
    });
  });

  describe('Query Building', () => {
    beforeEach(() => {
      mockQueryByVector.mockResolvedValue({
        requested: { products: ['neutral_density'] },
        conditions: {}
      });
    });

    it('should properly encode vectors as JSON string', async () => {
      const vectors = [
        { lat: 0, lon: -180, radius: 50, alt: 400 },
        { lat: 0, lon: -144, radius: 50, alt: 400 }
      ];

      await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors
        },
        mockEarthcastService
      );

      const callArgs = mockQueryByVector.mock.calls[0][0];
      expect(callArgs.vectors).toBeDefined();
      expect(typeof callArgs.vectors).toBe('string');
      
      const parsedVectors = JSON.parse(callArgs.vectors);
      expect(parsedVectors).toHaveLength(2);
      expect(parsedVectors[0].lat).toBe(0);
      expect(parsedVectors[0].alt).toBe(400);
    });

    it('should handle multiple products as comma-separated string', async () => {
      await handleEarthcastVectorQuery(
        {
          products: ['neutral_density', 'ionospheric_density'],
          vectors: [{ lat: 0, lon: 0, radius: 50 }]
        },
        mockEarthcastService
      );

      const callArgs = mockQueryByVector.mock.calls[0][0];
      expect(callArgs.products).toBe('neutral_density,ionospheric_density');
    });

    it('should include date parameter when provided', async () => {
      await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: [{ lat: 0, lon: 0, radius: 50 }],
          date: '2025-11-27T20:00:00Z'
        },
        mockEarthcastService
      );

      const callArgs = mockQueryByVector.mock.calls[0][0];
      expect(callArgs.date).toBe('2025-11-27T20:00:00Z');
    });

    it('should include date range when provided', async () => {
      await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: [{ lat: 0, lon: 0, radius: 50 }],
          date_start: '2025-11-27T00:00:00Z',
          date_end: '2025-11-27T23:59:59Z'
        },
        mockEarthcastService
      );

      const callArgs = mockQueryByVector.mock.calls[0][0];
      expect(callArgs.date_start).toBe('2025-11-27T00:00:00Z');
      expect(callArgs.date_end).toBe('2025-11-27T23:59:59Z');
    });

    it('should include resolution parameters when provided', async () => {
      await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: [{ lat: 0, lon: 0, radius: 50 }],
          width: 20,
          height: 15
        },
        mockEarthcastService
      );

      const callArgs = mockQueryByVector.mock.calls[0][0];
      expect(callArgs.width).toBe(20);
      expect(callArgs.height).toBe(15);
    });
  });

  describe('Response Formatting', () => {
    it('should format successful response with vector data', async () => {
      mockQueryByVector.mockResolvedValue({
        requested: {
          products: ['neutral_density']
        },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              vectors: [
                { 
                  average_value: 2.88e-12, 
                  grid: [[2.87e-12, 2.88e-12], [2.88e-12, 2.89e-12]]
                },
                { 
                  average_value: 3.73e-12, 
                  grid: [[3.71e-12, 3.75e-12]]
                }
              ]
            }
          }
        }
      });

      const result = await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: -180, radius: 50, alt: 400 },
            { lat: 0, lon: -144, radius: 50, alt: 400 }
          ]
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('Earthcast Vector Query Results');
      expect(result.content[0].text).toContain('NEUTRAL DENSITY');
      expect(result.content[0].text).toContain('**Vector Points:** 2');
      expect(result.content[0].text).toContain('2.88e-12');
      expect(result.content[0].text).toContain('3.73e-12');
      expect(result.content[0].text).toContain('Range:');
    });

    it('should handle response with exception', async () => {
      mockQueryByVector.mockResolvedValue({
        requested: {
          products: ['neutral_density']
        },
        conditions: {
          neutral_density: {
            exception: 'Product unavailable'
          }
        }
      });

      const result = await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: [{ lat: 0, lon: 0, radius: 50 }]
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('⚠️ Error');
      expect(result.content[0].text).toContain('Product unavailable');
    });

    it('should limit display to 10 vectors for large responses', async () => {
      const vectors = Array.from({ length: 15 }, (_, i) => ({
        average_value: (2.88e-12) * (i + 1),
        grid: [[2.87e-12]]
      }));

      mockQueryByVector.mockResolvedValue({
        requested: { products: ['neutral_density'] },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              vectors
            }
          }
        }
      });

      const result = await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: Array.from({ length: 15 }, (_, i) => ({
            lat: i, lon: 0, radius: 50
          }))
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**Vector Points:** 15');
      expect(result.content[0].text).toContain('and 5 more vectors');
    });
  });

  describe('Orbital Trajectory Use Case', () => {
    it('should handle equatorial orbit trajectory', async () => {
      mockQueryByVector.mockResolvedValue({
        requested: {
          products: ['neutral_density']
        },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              vectors: [
                { average_value: 2.88e-12, grid: [[2.87e-12, 2.88e-12]] },
                { average_value: 3.73e-12, grid: [[3.71e-12, 3.75e-12]] },
                { average_value: 5.03e-12, grid: [[5.01e-12, 5.06e-12]] }
              ]
            }
          }
        }
      });

      const result = await handleEarthcastVectorQuery(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: -180, radius: 50, alt: 400 },
            { lat: 0, lon: -144, radius: 50, alt: 400 },
            { lat: 0, lon: -108, radius: 50, alt: 400 }
          ]
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**Vector Points:** 3');
      expect(mockQueryByVector).toHaveBeenCalledWith(
        expect.objectContaining({
          products: 'neutral_density'
        })
      );
    });
  });
});
