/**
 * Handler for Earthcast weather data query tool
 * Queries one or more weather products from Earthcast Technologies API
 */

import { EarthcastService } from '../services/earthcast.js';
import type {
  EarthcastDataToolArgs,
  WeatherQueryArgs,
} from '../types/earthcast.js';
import { validateLatitude, validateLongitude } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

/**
 * Format geospatial data response for display
 */
function formatGeodataResponse(data: any): string {
  let output = '# Earthcast Weather Data\n\n';

  // Add request info
  if (data.requested) {
    output += '## Request Parameters\n\n';
    output += `**Products:** ${data.requested.products.join(', ')}\n`;
    
    if (data.requested.lat_lon) {
      const [lat, lon] = data.requested.lat_lon;
      output += `**Location:** ${lat.toFixed(4)}°N, ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}\n`;
    }
    
    if (data.requested.radius_km) {
      output += `**Radius:** ${data.requested.radius_km} km\n`;
    }
    
    if (data.requested.bbox) {
      output += `**Bounding Box:** ${data.requested.bbox.join(', ')}\n`;
    }
    
    output += '\n';
  }

  // Add conditions data
  if (data.conditions) {
    output += '## Weather Conditions\n\n';
    
    for (const [productName, productData] of Object.entries(data.conditions)) {
      output += `### ${productName.replace(/_/g, ' ').toUpperCase()}\n\n`;
      
      const condition = productData as any;
      
      // Resolution info
      if (condition.resolution_km) {
        output += `**Resolution:** ${condition.resolution_km.east_west.toFixed(1)} km (E-W) × ${condition.resolution_km.north_south.toFixed(1)} km (N-S)\n`;
      }
      
      if (condition.bbox) {
        output += `**Area Bounds:** [${condition.bbox.map((v: number) => v.toFixed(2)).join(', ')}]\n`;
      }
      
      if (condition.exception) {
        output += `**⚠️ Error:** ${condition.exception}\n\n`;
        continue;
      }
      
      // Get timestamps (excluding metadata fields)
      const timestamps = Object.keys(condition).filter(k => 
        !['resolution_km', 'width', 'height', 'bbox', 'exception'].includes(k)
      );
      
      for (const timestamp of timestamps) {
        const timeData = condition[timestamp];
        output += `\n**Data Time:** ${timestamp}\n\n`;
        
        // Handle altitude-dependent products
        if (timeData.altitudes) {
          output += '**Altitudes:**\n\n';
          for (const [alt, altData] of Object.entries(timeData.altitudes)) {
            const data = altData as any;
            output += `- **${alt} km:** Avg: ${data.average_value?.toExponential(2) || 'N/A'}`;
            
            if (data.grid) {
              const flatGrid = data.grid.flat();
              const maxVal = Math.max(...flatGrid);
              const minVal = Math.min(...flatGrid);
              output += `, Range: ${minVal.toExponential(2)} - ${maxVal.toExponential(2)}`;
            }
            output += '\n';
          }
        } else if (timeData.average_value !== undefined) {
          // Simple products with just average/grid
          output += `**Average Value:** ${timeData.average_value?.toFixed(2)}\n`;
          
          if (timeData.grid) {
            const flatGrid = timeData.grid.flat();
            const maxVal = Math.max(...flatGrid);
            const minVal = Math.min(...flatGrid);
            output += `**Range:** ${minVal.toFixed(2)} - ${maxVal.toFixed(2)}\n`;
          }
        }
        
        output += '\n';
      }
    }
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
