/**
 * Handler for Earthcast vector query tool
 * Queries weather data along an ordered vector path (e.g., orbital trajectories)
 */

import { EarthcastService } from '../services/earthcast.js';
import type {
  VectorQueryToolArgs,
  VectorQueryArgs,
  QueryVector,
} from '../types/earthcast.js';
import { logger } from '../utils/logger.js';

/**
 * Validate vector array
 */
function validateVectors(vectors: QueryVector[]): void {
  if (!Array.isArray(vectors) || vectors.length < 1) {
    throw new Error('At least one vector must be provided');
  }

  for (const [index, vector] of vectors.entries()) {
    if (typeof vector.lat !== 'number' || vector.lat < -90 || vector.lat > 90) {
      throw new Error(`Vector ${index}: latitude must be between -90 and 90`);
    }
    if (typeof vector.lon !== 'number' || vector.lon < -180 || vector.lon > 180) {
      throw new Error(`Vector ${index}: longitude must be between -180 and 180`);
    }
    if (typeof vector.radius !== 'number' || vector.radius <= 0) {
      throw new Error(`Vector ${index}: radius must be a positive number`);
    }
    if (vector.alt !== undefined && (typeof vector.alt !== 'number' || vector.alt < 0)) {
      throw new Error(`Vector ${index}: altitude must be a non-negative number`);
    }
  }
}

/**
 * Format vector query response for display
 */
function formatVectorResponse(data: any): string {
  let output = '# Earthcast Vector Query Results\n\n';

  // Add request info
  if (data.requested) {
    output += '## Request Parameters\n\n';
    output += `**Products:** ${data.requested.products.join(', ')}\n`;
    
    if (data.requested.date) {
      output += `**Date:** ${data.requested.date}\n`;
    }
    
    output += '\n';
  }

  // Add conditions data
  if (data.conditions) {
    output += '## Weather Data Along Vector Path\n\n';
    
    for (const [productName, productData] of Object.entries(data.conditions)) {
      output += `### ${productName.replace(/_/g, ' ').toUpperCase()}\n\n`;
      
      const condition = productData as any;
      
      if (condition.exception) {
        output += `**⚠️ Error:** ${condition.exception}\n\n`;
        continue;
      }
      
      // Get timestamps
      const timestamps = Object.keys(condition).filter(k => 
        !['resolution_km', 'width', 'height', 'bbox', 'exception'].includes(k)
      );
      
      for (const timestamp of timestamps) {
        const timeData = condition[timestamp];
        output += `**Time:** ${timestamp}\n\n`;
        
        // Display vector data
        if (timeData.vectors && Array.isArray(timeData.vectors)) {
          output += `**Vector Points:** ${timeData.vectors.length}\n\n`;
          
          for (let i = 0; i < Math.min(timeData.vectors.length, 10); i++) {
            const vectorData = timeData.vectors[i];
            output += `- **Vector ${i}:**`;
            
            if (vectorData.average_value !== undefined) {
              output += ` Avg: ${vectorData.average_value.toExponential(2)}`;
            }
            
            if (vectorData.grid) {
              const flatGrid = vectorData.grid.flat();
              const maxVal = Math.max(...flatGrid);
              const minVal = Math.min(...flatGrid);
              output += `, Range: ${minVal.toExponential(2)} - ${maxVal.toExponential(2)}`;
            }
            
            output += '\n';
          }
          
          if (timeData.vectors.length > 10) {
            output += `\n*... and ${timeData.vectors.length - 10} more vectors*\n`;
          }
        } else if (timeData.average_value !== undefined) {
          output += `**Average Value:** ${timeData.average_value.toFixed(2)}\n`;
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
function buildQueryParams(args: VectorQueryToolArgs): VectorQueryArgs {
  const params: VectorQueryArgs = {
    products: Array.isArray(args.products) ? args.products.join(',') : args.products,
    vectors: JSON.stringify(args.vectors),
  };

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
 * Handle Earthcast vector query
 */
export async function handleEarthcastVectorQuery(
  args: unknown,
  earthcastService: EarthcastService
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const typedArgs = args as VectorQueryToolArgs;

  // Validate products
  if (!typedArgs.products || typedArgs.products.length === 0) {
    throw new Error('At least one product must be specified');
  }

  // Validate vectors
  if (!typedArgs.vectors || !Array.isArray(typedArgs.vectors)) {
    throw new Error('Vectors must be provided as an array');
  }

  validateVectors(typedArgs.vectors);

  logger.info('Querying Earthcast data by vector', {
    products: typedArgs.products,
    vectorCount: typedArgs.vectors.length,
  });

  // Build query parameters
  const queryParams = buildQueryParams(typedArgs);

  // Query the data
  const data = await earthcastService.queryByVector(queryParams);

  // Format response
  const formattedOutput = formatVectorResponse(data);

  return {
    content: [
      {
        type: 'text',
        text: formattedOutput,
      },
    ],
  };
}
