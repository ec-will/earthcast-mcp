/**
 * Handler for Earthcast weather data query tool
 * Queries one or more weather products from Earthcast Technologies API
 */

import { EarthcastService } from '../services/earthcast.js';
import type {
  EarthcastDataToolArgs,
  WeatherQueryArgs,
  GeodataResponse,
} from '../types/earthcast.js';
import { validateLatitude, validateLongitude } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

/**
 * Format geospatial data response for display
 */
function formatGeodataResponse(data: GeodataResponse): string {
  let output = '# Earthcast Weather Data\n\n';

  // Add timestamp
  output += `**Data Timestamp:** ${data.timestamp}\n\n`;

  // Add products queried
  output += `**Products:** ${data.products.join(', ')}\n\n`;

  // Add metadata
  if (data.data.metadata) {
    output += '## Metadata\n\n';
    
    if (data.data.metadata.bounds) {
      const [west, south, east, north] = data.data.metadata.bounds;
      output += `**Bounds:** West: ${west}°, South: ${south}°, East: ${east}°, North: ${north}°\n`;
    }
    
    if (data.data.metadata.resolution) {
      const [resX, resY] = data.data.metadata.resolution;
      output += `**Resolution:** ${resX}° x ${resY}°\n`;
    }
    
    if (data.data.metadata.crs) {
      output += `**Coordinate System:** ${data.data.metadata.crs}\n`;
    }
    
    output += '\n';
  }

  // Add note about raster data
  if (data.data.raster) {
    output += '## Raster Data\n\n';
    output += 'GeoTIFF raster data is available (base64 encoded).\n';
    output += `Data size: ${data.data.raster.length} characters\n\n`;
    output += '*Note: The raster data contains the actual weather values and can be decoded and processed by GIS tools.*\n\n';
  }

  return output;
}

/**
 * Build query parameters from tool arguments
 */
function buildQueryParams(args: EarthcastDataToolArgs): WeatherQueryArgs {
  const params: WeatherQueryArgs = {
    products: Array.isArray(args.products) ? args.products.join(',') : args.products,
  };

  // Spatial filtering
  if (args.bbox) {
    params.bbox = args.bbox;
  } else if (args.latitude !== undefined && args.longitude !== undefined) {
    params.lat = args.latitude;
    params.lon = args.longitude;
    if (args.radius !== undefined) {
      params.radius = args.radius;
    }
  }

  // Altitude filtering
  if (args.altitude !== undefined) {
    params.alt = args.altitude;
  } else if (args.altitude_min !== undefined && args.altitude_max !== undefined) {
    params.alt_min = args.altitude_min;
    params.alt_max = args.altitude_max;
  }

  // Time filtering
  if (args.date) {
    params.date = args.date;
  } else if (args.date_start && args.date_end) {
    params.date_start = args.date_start;
    params.date_end = args.date_end;
  }

  // Resolution
  if (args.width !== undefined) {
    params.width = args.width;
  }
  if (args.height !== undefined) {
    params.height = args.height;
  }

  return params;
}

/**
 * Handle Earthcast weather data query
 */
export async function handleEarthcastDataQuery(
  args: unknown,
  earthcastService: EarthcastService
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const typedArgs = args as EarthcastDataToolArgs;

  // Validate products
  if (!typedArgs.products || typedArgs.products.length === 0) {
    throw new Error('At least one product must be specified');
  }

  // Validate coordinates if provided
  if (typedArgs.latitude !== undefined) {
    validateLatitude(typedArgs.latitude);
  }
  if (typedArgs.longitude !== undefined) {
    validateLongitude(typedArgs.longitude);
  }

  // Validate that either bbox or lat/lon is provided
  if (!typedArgs.bbox && (typedArgs.latitude === undefined || typedArgs.longitude === undefined)) {
    throw new Error('Either bbox or latitude/longitude must be provided for spatial filtering');
  }

  logger.info('Querying Earthcast weather data', {
    products: typedArgs.products,
    hasBbox: !!typedArgs.bbox,
    hasLatLon: typedArgs.latitude !== undefined && typedArgs.longitude !== undefined,
  });

  // Build query parameters
  const queryParams = buildQueryParams(typedArgs);

  // Query the data
  const data = await earthcastService.queryWeatherData(queryParams);

  // Format response
  const formattedOutput = formatGeodataResponse(data);

  return {
    content: [
      {
        type: 'text',
        text: formattedOutput,
      },
    ],
  };
}
