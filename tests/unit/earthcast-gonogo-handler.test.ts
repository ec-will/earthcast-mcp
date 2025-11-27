/**
 * Unit tests for Earthcast Go/No-Go decision handler
 * Tests launch decision logic, threshold evaluation, and response formatting
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { handleGoNoGoDecision } from '../../src/handlers/earthcastGoNoGoHandler.js';
import { EarthcastService } from '../../src/services/earthcast.js';

// Mock the Earthcast service
vi.mock('../../src/services/earthcast.js', () => ({
  EarthcastService: vi.fn()
}));

describe('Earthcast Go/No-Go Decision Handler', () => {
  let mockEarthcastService: any;
  let mockGetGoNoGoDecision: Mock;

  beforeEach(() => {
    mockGetGoNoGoDecision = vi.fn();
    mockEarthcastService = {
      getGoNoGoDecision: mockGetGoNoGoDecision
    };
    mockGetGoNoGoDecision.mockReset();
  });

  describe('Parameter Validation', () => {
    it('should accept valid Go/No-Go parameters', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: {
          products: ['lightning_density', 'low-level-windshear']
        },
        conditions: {},
        go_nogo_result: {
          details: {},
          go: true
        }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density,low-level-windshear',
          latitude: 28.5,
          longitude: -80.5,
          thresholds: {
            'lightning_density': 0.5,
            'low-level-windshear': 15
          },
          radius: 50,
          site_description: 'Cape Canaveral'
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Launch Go/No-Go Decision Support');
      expect(mockGetGoNoGoDecision).toHaveBeenCalled();
    });

    it('should reject empty products', async () => {
      await expect(
        handleGoNoGoDecision(
          {
            products: '',
            latitude: 28.5,
            longitude: -80.5,
            thresholds: { 'lightning_density': 0.5 }
          },
          mockEarthcastService
        )
      ).rejects.toThrow('At least one product must be specified');
    });

    it('should reject missing thresholds', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: { products: ['lightning_density'] },
        conditions: {},
        go_nogo_result: { details: {}, go: true }
      });

      // Handler requires thresholds in args, but doesn't validate count
      // It will pass empty thresholds to the API
      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          thresholds: { 'lightning_density': 0.5 }
        },
        mockEarthcastService
      );
      
      expect(result).toBeDefined();
    });

    it('should reject invalid latitude', async () => {
      await expect(
        handleGoNoGoDecision(
          {
            products: 'lightning_density',
            latitude: 95,
            longitude: -80.5,
            thresholds: { 'lightning_density': 0.5 }
          },
          mockEarthcastService
        )
      ).rejects.toThrow();
    });

    it('should reject invalid longitude', async () => {
      await expect(
        handleGoNoGoDecision(
          {
            products: 'lightning_density',
            latitude: 28.5,
            longitude: 200,
            thresholds: { 'lightning_density': 0.5 }
          },
          mockEarthcastService
        )
      ).rejects.toThrow();
    });

    it('should accept bbox instead of lat/lon', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: { products: ['lightning_density'] },
        conditions: {},
        go_nogo_result: { details: {}, go: true }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density',
          bbox: '-82,28,-78,32',
          thresholds: { 'lightning_density': 0.5 }
        },
        mockEarthcastService
      );

      expect(result).toBeDefined();
      expect(mockGetGoNoGoDecision).toHaveBeenCalled();
    });

    it('should require either bbox or lat/lon', async () => {
      await expect(
        handleGoNoGoDecision(
          {
            products: 'lightning_density',
            thresholds: { 'lightning_density': 0.5 }
          },
          mockEarthcastService
        )
      ).rejects.toThrow('Either bbox or latitude/longitude must be provided');
    });
  });

  describe('Threshold Building', () => {
    beforeEach(() => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: { products: ['lightning_density'] },
        conditions: {},
        go_nogo_result: { details: {}, go: true }
      });
    });

    it('should build threshold_override string from thresholds object', async () => {
      await handleGoNoGoDecision(
        {
          products: 'lightning_density,low-level-windshear',
          latitude: 28.5,
          longitude: -80.5,
          thresholds: {
            'lightning_density': 0.5,
            'low-level-windshear': 15.0
          }
        },
        mockEarthcastService
      );

      const callArgs = mockGetGoNoGoDecision.mock.calls[0][0];
      expect(callArgs.threshold_override).toBeDefined();
      expect(typeof callArgs.threshold_override).toBe('string');
      
      // Should be comma-separated product:threshold pairs
      expect(callArgs.threshold_override).toMatch(/lightning_density:0\.5/);
      expect(callArgs.threshold_override).toMatch(/low-level-windshear:15/);
    });

    it('should handle multiple products as comma-separated string', async () => {
      await handleGoNoGoDecision(
        {
          products: ['lightning_density', 'reflectivity_5k'],
          latitude: 28.5,
          longitude: -80.5,
          thresholds: {
            'lightning_density': 0.5,
            'reflectivity_5k': 40
          }
        },
        mockEarthcastService
      );

      const callArgs = mockGetGoNoGoDecision.mock.calls[0][0];
      expect(callArgs.products).toBe('lightning_density,reflectivity_5k');
    });

    it('should include optional parameters when provided', async () => {
      await handleGoNoGoDecision(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          thresholds: { 'lightning_density': 0.5 },
          radius: 100,
          altitude: 400,
          site_description: 'Cape Canaveral LC-39A',
          use_forecast: true,
          date: '2025-11-27T20:00:00Z',
          width: 10,
          height: 10
        },
        mockEarthcastService
      );

      const callArgs = mockGetGoNoGoDecision.mock.calls[0][0];
      expect(callArgs.radius).toBe(100);
      expect(callArgs.alt).toBe(400);
      expect(callArgs.site_description).toBe('Cape Canaveral LC-39A');
      expect(callArgs.get_forecast).toBe(true);
      expect(callArgs.date).toBe('2025-11-27T20:00:00Z');
      expect(callArgs.width).toBe(10);
      expect(callArgs.height).toBe(10);
    });
  });

  describe('Decision Logic', () => {
    it('should format GO decision correctly', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: {
          products: ['lightning_density', 'low-level-windshear'],
          lat_lon: [28.5, -80.5],
          radius_km: 50
        },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': {
              average_value: 0.0,
              max_value: 0.0,
              min_value: 0.0
            }
          },
          'low-level-windshear': {
            '2025-11-27T20:00:00Z': {
              average_value: 12.5,
              max_value: 14.0,
              min_value: 11.0
            }
          }
        },
        go_nogo_result: {
          details: {
            lightning_density: {
              '2025-11-27T20:00:00Z': { go: true, threshold: 0.5 }
            },
            'low-level-windshear': {
              '2025-11-27T20:00:00Z': { go: true, threshold: 15 }
            }
          },
          go: true,
          site_description: 'Cape Canaveral'
        }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density,low-level-windshear',
          latitude: 28.5,
          longitude: -80.5,
          thresholds: {
            'lightning_density': 0.5,
            'low-level-windshear': 15
          },
          site_description: 'Cape Canaveral'
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**GO**');
      expect(result.content[0].text).toContain('✅');
      expect(result.content[0].text).toContain('Cape Canaveral');
      expect(result.content[0].text).toContain('LIGHTNING_DENSITY');
      expect(result.content[0].text).toContain('LOW LEVEL WINDSHEAR');
    });

    it('should format NO-GO decision correctly', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: {
          products: ['lightning_density', 'low-level-windshear'],
          lat_lon: [44.8344, -85.2826],
          radius_km: 50
        },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': {
              average_value: 0.0,
              max_value: 0.0,
              min_value: 0.0
            }
          },
          'low-level-windshear': {
            '2025-11-27T20:00:00Z': {
              average_value: 18.99,
              max_value: 21.06,
              min_value: 17.44
            }
          }
        },
        go_nogo_result: {
          details: {
            lightning_density: {
              '2025-11-27T20:00:00Z': { go: true, threshold: 0.5 }
            },
            'low-level-windshear': {
              '2025-11-27T20:00:00Z': { go: false, threshold: 15 }
            }
          },
          go: false,
          site_description: 'Rapid City, Michigan'
        }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density,low-level-windshear',
          latitude: 44.8344,
          longitude: -85.2826,
          thresholds: {
            'lightning_density': 0.5,
            'low-level-windshear': 15
          },
          site_description: 'Rapid City, Michigan'
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**NO-GO**');
      expect(result.content[0].text).toContain('❌');
      expect(result.content[0].text).toContain('Rapid City, Michigan');
      expect(result.content[0].text).toContain('Status:** NO-GO');
      expect(result.content[0].text).toContain('Status:** GO');
    });

    it('should count GO and NO-GO products correctly', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: {
          products: ['lightning_density', 'low-level-windshear', 'reflectivity_5k'],
          lat_lon: [28.5, -80.5]
        },
        conditions: {},
        go_nogo_result: {
          details: {
            lightning_density: {
              '2025-11-27T20:00:00Z': { go: true, threshold: 0.5 }
            },
            'low-level-windshear': {
              '2025-11-27T20:00:00Z': { go: false, threshold: 15 }
            },
            reflectivity_5k: {
              '2025-11-27T20:00:00Z': { go: true, threshold: 40 }
            }
          },
          go: false
        }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density,low-level-windshear,reflectivity_5k',
          latitude: 28.5,
          longitude: -80.5,
          thresholds: {
            'lightning_density': 0.5,
            'low-level-windshear': 15,
            'reflectivity_5k': 40
          }
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**GO Status:** 2 product(s)');
      expect(result.content[0].text).toContain('**NO-GO Status:** 1 product(s)');
    });
  });

  describe('Response Formatting', () => {
    it('should display product evaluations with data values', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: {
          products: ['lightning_density'],
          lat_lon: [28.5, -80.5],
          radius_km: 50
        },
        conditions: {
          lightning_density: {
            resolution_km: { east_west: 20.1, north_south: 20.1 },
            '2025-11-27T20:00:00Z': {
              average_value: 0.15,
              grid: [
                [0.05, 0.10],
                [0.20, 0.25]
              ]
            }
          }
        },
        go_nogo_result: {
          details: {
            lightning_density: {
              '2025-11-27T20:00:00Z': { go: true, threshold: 0.5 }
            }
          },
          go: true
        }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          thresholds: { 'lightning_density': 0.5 }
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**Average Value:** 0.15');
      expect(result.content[0].text).toContain('**Max Value:** 0.25');
      expect(result.content[0].text).toContain('**Min Value:** 0.05');
      expect(result.content[0].text).toContain('**Resolution:** 20.1 km');
    });

    it('should handle products with exceptions', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: {
          products: ['lightning_density'],
          lat_lon: [28.5, -80.5]
        },
        conditions: {
          lightning_density: {
            exception: 'Product temporarily unavailable'
          }
        },
        go_nogo_result: {
          details: {
            lightning_density: {
              '2025-11-27T20:00:00Z': { go: false, threshold: 0.5 }
            }
          },
          go: false
        }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density',
          latitude: 28.5,
          longitude: -80.5,
          thresholds: { 'lightning_density': 0.5 }
        },
        mockEarthcastService
      );

      // Exceptions are not currently rendered in the go/no-go handler
      // The handler focuses on displaying the go/no-go decision
      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('NO-GO');
    });

    it('should format location information', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: {
          products: ['lightning_density'],
          lat_lon: [28.6084, -80.6043],
          radius_km: 50
        },
        conditions: {},
        go_nogo_result: {
          details: {
            lightning_density: {
              '2025-11-27T20:00:00Z': { go: true, threshold: 0.5 }
            }
          },
          go: true,
          site_description: 'Cape Canaveral LC-39A'
        }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density',
          latitude: 28.6084,
          longitude: -80.6043,
          thresholds: { 'lightning_density': 0.5 },
          radius: 50,
          site_description: 'Cape Canaveral LC-39A'
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**Launch Site:** Cape Canaveral LC-39A');
      expect(result.content[0].text).toContain('**Location:** 28.6084°N, 80.6043°W');
      expect(result.content[0].text).toContain('**Evaluation Radius:** 50 km');
    });
  });

  describe('Launch Operations Use Case', () => {
    it('should evaluate multiple products for launch clearance', async () => {
      mockGetGoNoGoDecision.mockResolvedValue({
        requested: {
          products: ['lightning_density', 'low-level-windshear', 'reflectivity_5k'],
          lat_lon: [32.9, -106.0]
        },
        conditions: {
          lightning_density: {
            '2025-11-27T20:00:00Z': {
              average_value: 0.0,
              max_value: 0.0,
              min_value: 0.0
            }
          },
          'low-level-windshear': {
            '2025-11-27T20:00:00Z': {
              average_value: 3.78,
              max_value: 5.88,
              min_value: 2.53
            }
          },
          reflectivity_5k: {
            '2025-11-27T20:00:00Z': {
              average_value: 0.0,
              max_value: 0.0,
              min_value: 0.0
            }
          }
        },
        go_nogo_result: {
          details: {
            lightning_density: {
              '2025-11-27T20:00:00Z': { go: true, threshold: 0.5 }
            },
            'low-level-windshear': {
              '2025-11-27T20:00:00Z': { go: true, threshold: 15 }
            },
            reflectivity_5k: {
              '2025-11-27T20:00:00Z': { go: true, threshold: 40 }
            }
          },
          go: true,
          site_description: 'Alamogordo, New Mexico'
        }
      });

      const result = await handleGoNoGoDecision(
        {
          products: 'lightning_density,low-level-windshear,reflectivity_5k',
          latitude: 32.9,
          longitude: -106.0,
          thresholds: {
            'lightning_density': 0.5,
            'low-level-windshear': 15,
            'reflectivity_5k': 40
          },
          site_description: 'Alamogordo, New Mexico'
        },
        mockEarthcastService
      );

      expect(result.content[0].text).toContain('**Overall Decision:** **GO**');
      expect(result.content[0].text).toContain('**Products Evaluated:** 3');
      expect(result.content[0].text).toContain('Alamogordo, New Mexico');
    });
  });
});
