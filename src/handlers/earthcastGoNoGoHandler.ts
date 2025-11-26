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

  // Add site information
  if (data.site) {
    output += `**Launch Site:** ${data.site}\n`;
  }
  output += `**Evaluation Time:** ${data.timestamp}\n`;
  output += `**Overall Decision:** **${data.decision}** ${data.decision === 'GO' ? '✅' : '❌'}\n`;
  
  if (data.confidence) {
    const confidenceEmoji = data.confidence === 'HIGH' ? '🟢' : data.confidence === 'MEDIUM' ? '🟡' : '🔴';
    output += `**Confidence Level:** ${confidenceEmoji} ${data.confidence}\n`;
  }
  
  output += '\n---\n\n';

  // Add individual product evaluations
  output += '## Product Evaluations\n\n';
  
  for (const product of data.products) {
    const statusEmoji = product.status === 'GO' ? '✅' : '❌';
    output += `### ${statusEmoji} ${product.product.replace(/-/g, ' ').toUpperCase()}\n\n`;
    output += `**Status:** ${product.status}\n`;
    output += `**Message:** ${product.message}\n`;
    
    if (product.threshold !== undefined) {
      output += `**Threshold:** ${product.threshold}\n`;
    }
    
    if (product.max_value !== undefined) {
      output += `**Max Value:** ${product.max_value}\n`;
    }
    
    if (product.min_value !== undefined) {
      output += `**Min Value:** ${product.min_value}\n`;
    }
    
    output += '\n';
  }

  // Add summary
  output += '---\n\n';
  output += '## Summary\n\n';
  
  const goCount = data.products.filter(p => p.status === 'GO').length;
  const noGoCount = data.products.filter(p => p.status === 'NO-GO').length;
  
  output += `**Products Evaluated:** ${data.products.length}\n`;
  output += `**GO Status:** ${goCount} product(s)\n`;
  output += `**NO-GO Status:** ${noGoCount} product(s)\n\n`;
  
  if (data.decision === 'NO-GO') {
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
