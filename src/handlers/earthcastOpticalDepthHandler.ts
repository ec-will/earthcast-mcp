/**
 * Handler for Earthcast optical depth assessment tool
 * Assesses atmospheric optical depth along a line-of-sight for telescope observations
 */

import { EarthcastService } from '../services/earthcast.js';
import type {
  OpticalDepthToolArgs,
  OpticalDepthArgs,
  QueryVector,
} from '../types/earthcast.js';
import { logger } from '../utils/logger.js';

/**
 * Validate vector array for optical depth (minimum 2 vectors required)
 */
function validateOpticalDepthVectors(vectors: QueryVector[]): void {
  if (!Array.isArray(vectors) || vectors.length < 2) {
    throw new Error('At least two vectors must be provided for optical depth assessment (telescope location + target)');
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
 * Format optical depth response for display
 */
function formatOpticalDepthResponse(data: any, description?: string): string {
  let output = '# Atmospheric Optical Depth Assessment\n\n';

  if (description) {
    output += `**Observation:** ${description}\n\n`;
  }

  // Add request info
  if (data.requested) {
    output += '## Line-of-Sight Configuration\n\n';
    output += `**Products:** ${data.requested.products.join(', ')}\n`;
    
    if (data.requested.date) {
      output += `**Date:** ${data.requested.date}\n`;
    }
    
    output += '\n';
  }

  // Add optical depth assessment results
  if (data.conditions) {
    output += '## Optical Depth Results\n\n';
    
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
        
        // Display optical depth assessment
        if (timeData.optical_depth) {
          const od = timeData.optical_depth;
          
          if (od.probability !== undefined) {
            const prob = od.probability * 100;
            output += `**Visibility Probability:** ${prob.toFixed(1)}% `;
            
            if (prob >= 80) {
              output += '✅ (Excellent)\n';
            } else if (prob >= 60) {
              output += '👍 (Good)\n';
            } else if (prob >= 40) {
              output += '⚠️ (Fair)\n';
            } else {
              output += '❌ (Poor)\n';
            }
          }
          
          if (od.sum_matrix && Array.isArray(od.sum_matrix)) {
            // Calculate statistics from sum_matrix
            const flatMatrix = od.sum_matrix.flat();
            const validValues = flatMatrix.filter((v: number) => !isNaN(v) && isFinite(v));
            
            if (validValues.length > 0) {
              const maxDepth = Math.max(...validValues);
              const minDepth = Math.min(...validValues);
              const avgDepth = validValues.reduce((a: number, b: number) => a + b, 0) / validValues.length;
              
              output += `**Integrated Optical Depth:**\n`;
              output += `- Average: ${avgDepth.toExponential(2)}\n`;
              output += `- Range: ${minDepth.toExponential(2)} to ${maxDepth.toExponential(2)}\n`;
              output += `- Matrix size: ${od.sum_matrix.length}×${od.sum_matrix[0].length}\n`;
            }
          }
          
          if (od.prob_matrix && Array.isArray(od.prob_matrix)) {
            const flatProb = od.prob_matrix.flat();
            const validProbs = flatProb.filter((v: number) => !isNaN(v) && isFinite(v));
            
            if (validProbs.length > 0) {
              const avgProb = validProbs.reduce((a: number, b: number) => a + b, 0) / validProbs.length;
              output += `**Probability Matrix:** ${od.prob_matrix.length}×${od.prob_matrix[0].length} cells, avg ${(avgProb * 100).toFixed(1)}%\n`;
            }
          }
          
          output += '\n';
        } else if (timeData.vectors && Array.isArray(timeData.vectors)) {
          // Fallback to showing vector data if optical_depth not present
          output += `**Vector Points:** ${timeData.vectors.length}\n\n`;
          
          for (let i = 0; i < Math.min(timeData.vectors.length, 5); i++) {
            const vectorData = timeData.vectors[i];
            output += `- **Point ${i}:**`;
            
            if (vectorData.average_value !== undefined) {
              output += ` ${vectorData.average_value.toExponential(2)}`;
            }
            
            output += '\n';
          }
          
          output += '\n';
        }
      }
    }
  }

  output += '---\n\n';
  output += '*Higher visibility probability indicates clearer atmospheric conditions along the line-of-sight.*\n';

  return output;
}

/**
 * Build query parameters from tool arguments
 */
function buildQueryParams(args: OpticalDepthToolArgs): OpticalDepthArgs {
  const params: OpticalDepthArgs = {
    products: Array.isArray(args.products) ? args.products.join(',') : args.products,
    vectors: JSON.stringify(args.vectors),
  };

  // Time filtering (single date only for optical depth)
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
 * Handle Earthcast optical depth assessment
 */
export async function handleOpticalDepthAssessment(
  args: unknown,
  earthcastService: EarthcastService
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const typedArgs = args as OpticalDepthToolArgs;

  // Validate products
  if (!typedArgs.products || typedArgs.products.length === 0) {
    throw new Error('At least one product must be specified');
  }

  // Validate vectors
  if (!typedArgs.vectors || !Array.isArray(typedArgs.vectors)) {
    throw new Error('Vectors must be provided as an array');
  }

  validateOpticalDepthVectors(typedArgs.vectors);

  logger.info('Assessing optical depth', {
    products: typedArgs.products,
    vectorCount: typedArgs.vectors.length,
    description: typedArgs.description,
  });

  // Build query parameters
  const queryParams = buildQueryParams(typedArgs);

  // Query the data
  const data = await earthcastService.assessOpticalDepth(queryParams);

  // Format response
  const formattedOutput = formatOpticalDepthResponse(data, typedArgs.description);

  return {
    content: [
      {
        type: 'text',
        text: formattedOutput,
      },
    ],
  };
}
