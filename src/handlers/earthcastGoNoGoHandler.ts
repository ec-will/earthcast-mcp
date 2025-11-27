/**
 * Handler for Earthcast Go/No-Go launch decision support tool
 * Provides threshold-based decision support for launch operations
 */

import { EarthcastService } from '../services/earthcast.js';
import type {
  GoNoGoToolArgs,
  GoNoGoArgs,
  GoNoGoResponse,
} from '../types/earthcast.js';
import { validateLatitude, validateLongitude } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

/**
 * Format Go/No-Go decision response for display
 */
function formatGoNoGoResponse(data: GoNoGoResponse): string {
  let output = '# 🚀 Launch Go/No-Go Decision Support\n\n';

  const overallDecision = data.go_nogo_result.go ? 'GO' : 'NO-GO';
  const decisionEmoji = data.go_nogo_result.go ? '✅' : '❌';

  // Add site information
  if (data.go_nogo_result.site_description) {
    output += `**Launch Site:** ${data.go_nogo_result.site_description}\n`;
  }
  
  // Add location info
  if (data.requested?.lat_lon) {
    output += `**Location:** ${data.requested.lat_lon[0].toFixed(4)}°N, ${Math.abs(data.requested.lat_lon[1]).toFixed(4)}°${data.requested.lat_lon[1] >= 0 ? 'E' : 'W'}\n`;
  }
  
  if (data.requested?.radius_km) {
    output += `**Evaluation Radius:** ${data.requested.radius_km} km\n`;
  }
  
  output += `**Overall Decision:** **${overallDecision}** ${decisionEmoji}\n`;
  output += '\n---\n\n';

  // Add individual product evaluations
  output += '## Product Evaluations\n\n';
  
  const details = data.go_nogo_result.details;
  let goCount = 0;
  let noGoCount = 0;
  
  for (const [productName, timestamps] of Object.entries(details)) {
    // Get the latest timestamp for this product
    const timestampKeys = Object.keys(timestamps).sort().reverse();
    const latestTimestamp = timestampKeys[0];
    const evaluation = timestamps[latestTimestamp];
    
    const isGo = evaluation.go;
    const statusEmoji = isGo ? '✅' : '❌';
    if (isGo) goCount++;
    else noGoCount++;
    
    output += `### ${statusEmoji} ${productName.replace(/-/g, ' ').toUpperCase()}\n\n`;
    output += `**Status:** ${isGo ? 'GO' : 'NO-GO'}\n`;
    output += `**Threshold:** ${evaluation.threshold}\n`;
    output += `**Data Time:** ${latestTimestamp}\n`;
    
    // Add condition data if available
    if (data.conditions && data.conditions[productName]) {
      const condition = data.conditions[productName];
      const conditionData = condition[latestTimestamp] as { average_value?: number; grid?: number[][] };
      
      if (conditionData && typeof conditionData === 'object' && 'average_value' in conditionData) {
        output += `**Average Value:** ${conditionData.average_value?.toFixed(2)}\n`;
        
        if (conditionData.grid) {
          const flatGrid = conditionData.grid.flat();
          const maxVal = Math.max(...flatGrid);
          const minVal = Math.min(...flatGrid);
          output += `**Max Value:** ${maxVal.toFixed(2)}\n`;
          output += `**Min Value:** ${minVal.toFixed(2)}\n`;
        }
      }
      
      if (condition.resolution_km) {
        output += `**Resolution:** ${condition.resolution_km.east_west.toFixed(1)} km\n`;
      }
    }
    
    output += '\n';
  }

  // Add summary
  output += '---\n\n';
  output += '## Summary\n\n';
  
  const totalProducts = goCount + noGoCount;
  output += `**Products Evaluated:** ${totalProducts}\n`;
  output += `**GO Status:** ${goCount} product(s)\n`;
  output += `**NO-GO Status:** ${noGoCount} product(s)\n\n`;
  
  if (!data.go_nogo_result.go) {
    output += '⚠️ **Recommendation:** Launch criteria not met. Review NO-GO products before proceeding.\n';
  } else {
    output += '✅ **Recommendation:** All evaluated weather criteria are within acceptable limits for launch.\n';
  }

  return output;
}

/**
 * Build Go/No-Go query parameters from tool arguments
 */
function buildGoNoGoParams(args: GoNoGoToolArgs): GoNoGoArgs {
  const params: GoNoGoArgs = {
    products: Array.isArray(args.products) ? args.products.join(',') : args.products,
  };

  // Site description
  if (args.site_description) {
    params.site_description = args.site_description;
  }

  // Build threshold_override string from thresholds object
  if (args.thresholds && Object.keys(args.thresholds).length > 0) {
    const thresholdPairs = Object.entries(args.thresholds)
      .map(([product, value]) => `${product}:${value}`)
      .join(',');
    params.threshold_override = thresholdPairs;
  }

  // Forecast vs observed data
  if (args.use_forecast !== undefined) {
    params.get_forecast = args.use_forecast;
  }

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
 * Handle Earthcast Go/No-Go decision request
 */
export async function handleGoNoGoDecision(
  args: unknown,
  earthcastService: EarthcastService
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const typedArgs = args as GoNoGoToolArgs;

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

  logger.info('Requesting Go/No-Go decision', {
    products: typedArgs.products,
    site: typedArgs.site_description,
    hasBbox: !!typedArgs.bbox,
    hasLatLon: typedArgs.latitude !== undefined && typedArgs.longitude !== undefined,
  });

  // Build query parameters
  const queryParams = buildGoNoGoParams(typedArgs);

  // Get decision
  const decision = await earthcastService.getGoNoGoDecision(queryParams);

  // Format response
  const formattedOutput = formatGoNoGoResponse(decision);

  return {
    content: [
      {
        type: 'text',
        text: formattedOutput,
      },
    ],
  };
}
