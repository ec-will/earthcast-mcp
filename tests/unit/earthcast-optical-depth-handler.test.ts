/**
 * Unit tests for Earthcast optical depth assessment handler
 * Tests vector validation, line-of-sight configuration, and visibility probability calculation
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { handleOpticalDepthAssessment } from '../../src/handlers/earthcastOpticalDepthHandler.js';
import { EarthcastService } from '../../src/services/earthcast.js';

// Mock the Earthcast service
vi.mock('../../src/services/earthcast.js', () => ({
  EarthcastService: vi.fn()
}));

describe('Earthcast Optical Depth Assessment Handler', () => {
  let mockEarthcastService: any;
  let mockAssessOpticalDepth: Mock;

  beforeEach(() => {
    mockAssessOpticalDepth = vi.fn();
    mockEarthcastService = {
      assessOpticalDepth: mockAssessOpticalDepth
    };
    mockAssessOpticalDepth.mockReset();
  });

  describe('Parameter Validation', () => {
    it('should accept valid optical depth parameters', async () => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: {
          products: ['neutral_density']
        },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              optical_depth: {
                probability: 1.0,
                sum_matrix: [[1.17e-6]],
                prob_matrix: [[1.0]]
              }
            }
          }
        }
      });

      const result = await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 38.5, lon: -80.5, radius: 10 },
            { lat: 38.55, lon: -80.45, radius: 10, alt: 100 }
          ],
          width: 10,
          height: 10,
          description: 'Test telescope observation'
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Atmospheric Optical Depth Assessment');
      expect(mockAssessOpticalDepth).toHaveBeenCalled();
    });

    it('should reject empty products', async () => {
      await expect(
        handleOpticalDepthAssessment(
          {
            products: '',
            vectors: [
              { lat: 0, lon: 0, radius: 10 },
              { lat: 0, lon: 1, radius: 10 }
            ]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('At least one product must be specified');
    });

    it('should reject single vector (minimum 2 required)', async () => {
      await expect(
        handleOpticalDepthAssessment(
          {
            products: 'neutral_density',
            vectors: [{ lat: 0, lon: 0, radius: 10 }]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('At least two vectors must be provided');
    });

    it('should reject empty vectors array', async () => {
      await expect(
        handleOpticalDepthAssessment(
          {
            products: 'neutral_density',
            vectors: []
          },
          mockEarthcastService
        )
      ).rejects.toThrow('At least two vectors must be provided');
    });

    it('should reject invalid latitude in vector', async () => {
      await expect(
        handleOpticalDepthAssessment(
          {
            products: 'neutral_density',
            vectors: [
              { lat: 100, lon: 0, radius: 10 },
              { lat: 0, lon: 0, radius: 10 }
            ]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('latitude must be between -90 and 90');
    });

    it('should reject invalid longitude in vector', async () => {
      await expect(
        handleOpticalDepthAssessment(
          {
            products: 'neutral_density',
            vectors: [
              { lat: 0, lon: -200, radius: 10 },
              { lat: 0, lon: 0, radius: 10 }
            ]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('longitude must be between -180 and 180');
    });

    it('should reject zero radius', async () => {
      await expect(
        handleOpticalDepthAssessment(
          {
            products: 'neutral_density',
            vectors: [
              { lat: 0, lon: 0, radius: 0 },
              { lat: 0, lon: 1, radius: 10 }
            ]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('radius must be a positive number');
    });

    it('should reject negative altitude', async () => {
      await expect(
        handleOpticalDepthAssessment(
          {
            products: 'neutral_density',
            vectors: [
              { lat: 0, lon: 0, radius: 10 },
              { lat: 0, lon: 1, radius: 10, alt: -50 }
            ]
          },
          mockEarthcastService
        )
      ).rejects.toThrow('altitude must be a non-negative number');
    });

    it('should accept vectors with and without altitude', async () => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: { products: ['neutral_density'] },
        conditions: {}
      });

      const result = await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10, alt: 100 },
            { lat: 0, lon: 2, radius: 10, alt: 200 }
          ]
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(mockAssessOpticalDepth).toHaveBeenCalled();
    });
  });

  describe('Query Building', () => {
    beforeEach(() => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: { products: ['neutral_density'] },
        conditions: {}
      });
    });

    it('should properly encode vectors as JSON string', async () => {
      const vectors = [
        { lat: 38.5, lon: -80.5, radius: 10 },
        { lat: 38.55, lon: -80.45, radius: 10, alt: 100 }
      ];

      await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors
        },
        mockEarthcastService
      );

      const callArgs = mockAssessOpticalDepth.mock.calls[0][0];
      expect(callArgs.vectors).toBeDefined();
      expect(typeof callArgs.vectors).toBe('string');
      
      const parsedVectors = JSON.parse(callArgs.vectors);
      expect(parsedVectors).toHaveLength(2);
      expect(parsedVectors[0].lat).toBe(38.5);
      expect(parsedVectors[1].alt).toBe(100);
    });

    it('should handle multiple products as comma-separated string', async () => {
      await handleOpticalDepthAssessment(
        {
          products: ['neutral_density', 'ionospheric_density'],
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10 }
          ]
        },
        mockEarthcastService
      );

      const callArgs = mockAssessOpticalDepth.mock.calls[0][0];
      expect(callArgs.products).toBe('neutral_density,ionospheric_density');
    });

    it('should include date parameter when provided', async () => {
      await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10 }
          ],
          date: '2025-11-27T20:00:00Z'
        },
        mockEarthcastService
      );

      const callArgs = mockAssessOpticalDepth.mock.calls[0][0];
      expect(callArgs.date).toBe('2025-11-27T20:00:00Z');
    });

    it('should include resolution parameters when provided', async () => {
      await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10 }
          ],
          width: 20,
          height: 15
        },
        mockEarthcastService
      );

      const callArgs = mockAssessOpticalDepth.mock.calls[0][0];
      expect(callArgs.width).toBe(20);
      expect(callArgs.height).toBe(15);
    });

    it('should not include date_start or date_end (single date only)', async () => {
      await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10 }
          ],
          date: '2025-11-27T20:00:00Z'
        },
        mockEarthcastService
      );

      const callArgs = mockAssessOpticalDepth.mock.calls[0][0];
      expect(callArgs.date_start).toBeUndefined();
      expect(callArgs.date_end).toBeUndefined();
    });
  });

  describe('Response Formatting', () => {
    it('should format successful response with visibility probability', async () => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: {
          products: ['neutral_density']
        },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              optical_depth: {
                probability: 1.0,
                sum_matrix: [[1.17e-6, 1.18e-6], [1.17e-6, 1.19e-6]],
                prob_matrix: [[1.0, 1.0], [1.0, 1.0]]
              }
            }
          }
        }
      });

      const result = await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 38.5, lon: -80.5, radius: 10 },
            { lat: 38.55, lon: -80.45, radius: 10, alt: 100 }
          ],
          description: 'West Virginia telescope'
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('Atmospheric Optical Depth Assessment');
      expect(result.content[0].text).toContain('West Virginia telescope');
      expect(result.content[0].text).toContain('**Visibility Probability:** 100.0%');
      expect(result.content[0].text).toContain('✅ (Excellent)');
      expect(result.content[0].text).toContain('Integrated Optical Depth');
      expect(result.content[0].text).toContain('1.17e-6');
      expect(result.content[0].text).toContain('Matrix size: 2×2');
    });

    it('should properly classify visibility levels', async () => {
      const testCases = [
        { prob: 0.95, expected: '✅ (Excellent)' },
        { prob: 0.75, expected: '👍 (Good)' },
        { prob: 0.50, expected: '⚠️ (Fair)' },
        { prob: 0.30, expected: '❌ (Poor)' }
      ];

      for (const { prob, expected } of testCases) {
        mockAssessOpticalDepth.mockResolvedValue({
          requested: { products: ['neutral_density'] },
          conditions: {
            neutral_density: {
              '2025-11-27T20:00:00Z': {
                optical_depth: {
                  probability: prob,
                  sum_matrix: [[1.0]],
                  prob_matrix: [[prob]]
                }
              }
            }
          }
        });

        const result = await handleOpticalDepthAssessment(
          {
            products: 'neutral_density',
            vectors: [
              { lat: 0, lon: 0, radius: 10 },
              { lat: 0, lon: 1, radius: 10 }
            ]
          },
          mockEarthcastService
        );

        expect(result.content[0].text).toContain(`${(prob * 100).toFixed(1)}%`);
        expect(result.content[0].text).toContain(expected);
      }
    });

    it('should handle response with exception', async () => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: {
          products: ['neutral_density']
        },
        conditions: {
          neutral_density: {
            exception: 'Product unavailable for this time period'
          }
        }
      });

      const result = await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10 }
          ]
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('⚠️ Error');
      expect(result.content[0].text).toContain('Product unavailable for this time period');
    });

    it('should include description when provided', async () => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: { products: ['neutral_density'] },
        conditions: {}
      });

      const result = await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10 }
          ],
          description: 'Mount Palomar Observatory targeting NGC 4565'
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('Mount Palomar Observatory targeting NGC 4565');
    });

    it('should fallback to showing vector data when optical_depth not present', async () => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: { products: ['neutral_density'] },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              vectors: [
                { average_value: 1.17e-6 },
                { average_value: 1.19e-6 }
              ]
            }
          }
        }
      });

      const result = await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10 }
          ]
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**Vector Points:** 2');
      expect(result.content[0].text).toContain('1.17e-6');
    });
  });

  describe('Telescope Observation Use Case', () => {
    it('should handle line-of-sight from ground to space', async () => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: {
          products: ['neutral_density']
        },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              optical_depth: {
                probability: 1.0,
                sum_matrix: [[1.17e-6]],
                prob_matrix: [[1.0]]
              }
            }
          }
        }
      });

      const result = await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          description: 'West Virginia telescope observation',
          vectors: [
            { lat: 38.5, lon: -80.5, radius: 10 }, // Ground
            { lat: 38.55, lon: -80.45, radius: 10, alt: 100 },
            { lat: 38.6, lon: -80.4, radius: 10, alt: 200 },
            { lat: 38.65, lon: -80.35, radius: 10, alt: 300 },
            { lat: 38.7, lon: -80.3, radius: 10, alt: 400 }
          ],
          width: 10,
          height: 10
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('West Virginia telescope observation');
      expect(result.content[0].text).toContain('Visibility Probability');
      expect(mockAssessOpticalDepth).toHaveBeenCalledWith(
        expect.objectContaining({
          products: 'neutral_density'
        })
      );
    });

    it('should calculate statistics for optical depth matrix', async () => {
      mockAssessOpticalDepth.mockResolvedValue({
        requested: { products: ['neutral_density'] },
        conditions: {
          neutral_density: {
            '2025-11-27T20:00:00Z': {
              optical_depth: {
                probability: 0.95,
                sum_matrix: [
                  [1.0e-6, 1.5e-6, 2.0e-6],
                  [1.2e-6, 1.8e-6, 2.2e-6],
                  [1.1e-6, 1.6e-6, 1.9e-6]
                ],
                prob_matrix: [
                  [1.0, 0.95, 0.90],
                  [0.98, 0.92, 0.88],
                  [0.99, 0.94, 0.91]
                ]
              }
            }
          }
        }
      });

      const result = await handleOpticalDepthAssessment(
        {
          products: 'neutral_density',
          vectors: [
            { lat: 0, lon: 0, radius: 10 },
            { lat: 0, lon: 1, radius: 10 }
          ]
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('Average:');
      expect(result.content[0].text).toContain('Range:');
      expect(result.content[0].text).toContain('1.00e-6 to 2.20e-6');
      expect(result.content[0].text).toContain('Matrix size: 3×3');
      expect(result.content[0].text).toContain('**Probability Matrix:** 3×3 cells');
    });
  });
});
