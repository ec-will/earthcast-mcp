#!/usr/bin/env node

/**
 * Weather MCP Server
 * Provides weather data from NOAA API to AI systems via Model Context Protocol
 */

// Load environment variables from .env file (for local development)
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { NOAAService } from './services/noaa.js';
import { CDOService } from './services/cdo.js';

/**
 * Server information
 */
const SERVER_NAME = 'weather-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * Initialize the NOAA service
 */
const noaaService = new NOAAService({
  userAgent: '(weather-mcp, github.com/weather-mcp)'
});

/**
 * Initialize the CDO service for historical data
 * Token can be obtained from: https://www.ncdc.noaa.gov/cdo-web/token
 */
const cdoService = new CDOService({
  token: process.env.NOAA_CDO_TOKEN
});

/**
 * Create MCP server instance
 */
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_forecast',
        description: 'Get weather forecast for a location. Provide either a location name or coordinates (latitude and longitude).',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude of the location (-90 to 90)',
              minimum: -90,
              maximum: 90
            },
            longitude: {
              type: 'number',
              description: 'Longitude of the location (-180 to 180)',
              minimum: -180,
              maximum: 180
            },
            days: {
              type: 'number',
              description: 'Number of days to include in forecast (1-7, default: 7)',
              minimum: 1,
              maximum: 7,
              default: 7
            }
          },
          required: ['latitude', 'longitude']
        }
      },
      {
        name: 'get_current_conditions',
        description: 'Get current weather conditions for a location. Provide coordinates (latitude and longitude).',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude of the location (-90 to 90)',
              minimum: -90,
              maximum: 90
            },
            longitude: {
              type: 'number',
              description: 'Longitude of the location (-180 to 180)',
              minimum: -180,
              maximum: 180
            }
          },
          required: ['latitude', 'longitude']
        }
      },
      {
        name: 'get_historical_weather',
        description: 'Get historical weather observations for a location. Provide coordinates and a date range.',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude of the location (-90 to 90)',
              minimum: -90,
              maximum: 90
            },
            longitude: {
              type: 'number',
              description: 'Longitude of the location (-180 to 180)',
              minimum: -180,
              maximum: 180
            },
            start_date: {
              type: 'string',
              description: 'Start date in ISO format (YYYY-MM-DD or ISO 8601 datetime)',
            },
            end_date: {
              type: 'string',
              description: 'End date in ISO format (YYYY-MM-DD or ISO 8601 datetime)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of observations to return (default: 168 for one week of hourly data)',
              minimum: 1,
              maximum: 500,
              default: 168
            }
          },
          required: ['latitude', 'longitude', 'start_date', 'end_date']
        }
      }
    ]
  };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_forecast': {
        const { latitude, longitude, days = 7 } = args as {
          latitude: number;
          longitude: number;
          days?: number;
        };

        // Get forecast data
        const forecast = await noaaService.getForecastByCoordinates(latitude, longitude);
        const periods = forecast.properties.periods.slice(0, days * 2); // Each day typically has 2 periods (day/night)

        // Format the forecast for display
        let output = `# Weather Forecast\n\n`;
        output += `**Location:** ${forecast.properties.elevation.value}m elevation\n`;
        output += `**Updated:** ${new Date(forecast.properties.updated).toLocaleString()}\n\n`;

        for (const period of periods) {
          output += `## ${period.name}\n`;
          output += `**Temperature:** ${period.temperature}°${period.temperatureUnit}\n`;
          output += `**Wind:** ${period.windSpeed} ${period.windDirection}\n`;
          output += `**Forecast:** ${period.shortForecast}\n\n`;
          if (period.detailedForecast) {
            output += `${period.detailedForecast}\n\n`;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      }

      case 'get_current_conditions': {
        const { latitude, longitude } = args as {
          latitude: number;
          longitude: number;
        };

        // Get current observation
        const observation = await noaaService.getCurrentConditions(latitude, longitude);
        const props = observation.properties;

        // Format current conditions
        let output = `# Current Weather Conditions\n\n`;
        output += `**Station:** ${props.station}\n`;
        output += `**Time:** ${new Date(props.timestamp).toLocaleString()}\n\n`;

        if (props.textDescription) {
          output += `**Conditions:** ${props.textDescription}\n`;
        }

        if (props.temperature.value !== null) {
          const tempF = props.temperature.unitCode.includes('degC')
            ? (props.temperature.value * 9/5) + 32
            : props.temperature.value;
          output += `**Temperature:** ${Math.round(tempF)}°F\n`;
        }

        if (props.dewpoint.value !== null) {
          const dewF = props.dewpoint.unitCode.includes('degC')
            ? (props.dewpoint.value * 9/5) + 32
            : props.dewpoint.value;
          output += `**Dewpoint:** ${Math.round(dewF)}°F\n`;
        }

        if (props.relativeHumidity.value !== null) {
          output += `**Humidity:** ${Math.round(props.relativeHumidity.value)}%\n`;
        }

        if (props.windSpeed.value !== null) {
          const windMph = props.windSpeed.unitCode.includes('km_h')
            ? props.windSpeed.value * 0.621371
            : props.windSpeed.value * 2.23694; // m/s to mph
          const windDir = props.windDirection.value;
          output += `**Wind:** ${Math.round(windMph)} mph`;
          if (windDir !== null) {
            output += ` from ${Math.round(windDir)}°`;
          }
          output += `\n`;
        }

        if (props.barometricPressure.value !== null) {
          const pressureInHg = props.barometricPressure.value * 0.0002953;
          output += `**Pressure:** ${pressureInHg.toFixed(2)} inHg\n`;
        }

        if (props.visibility.value !== null) {
          const visibilityMiles = props.visibility.value * 0.000621371;
          output += `**Visibility:** ${visibilityMiles.toFixed(1)} miles\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      }

      case 'get_historical_weather': {
        const { latitude, longitude, start_date, end_date, limit = 168 } = args as {
          latitude: number;
          longitude: number;
          start_date: string;
          end_date: string;
          limit?: number;
        };

        // Parse dates
        const startTime = new Date(start_date);
        const endTime = new Date(end_date);

        // Validate date parsing
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          throw new Error('Invalid date format. Please use ISO format (YYYY-MM-DD or full ISO 8601 datetime).');
        }

        // Validate date range
        if (startTime > endTime) {
          throw new Error(`Invalid date range: start date (${start_date}) must be before end date (${end_date}).`);
        }

        // Validate dates are not in the future
        const now = new Date();
        if (startTime > now) {
          throw new Error(`Start date (${start_date}) cannot be in the future. Current date is ${now.toISOString().split('T')[0]}.`);
        }
        if (endTime > now) {
          throw new Error(`End date (${end_date}) cannot be in the future. Current date is ${now.toISOString().split('T')[0]}.`);
        }

        // Determine which API to use based on date range
        // If start date is more than 7 days old, use CDO API for archival data
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const useArchivalData = startTime < sevenDaysAgo;

        if (useArchivalData) {
          // Use CDO API for historical/archival data
          try {
            const cdoData = await cdoService.getHistoricalData(
              latitude,
              longitude,
              start_date,
              end_date,
              limit
            );

            if (!cdoData.results || cdoData.results.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `No historical observations found for the specified date range (${start_date} to ${end_date}).\n\nThis may occur because:\n- The dates are outside the station's available data range\n- There are gaps in the observation records for this location\n- The weather station near this location may not have archived data for these dates\n\nNote: Historical weather data availability varies by location and weather station.`
                  }
                ]
              };
            }

            // Group data by date
            const dataByDate = new Map<string, Map<string, number>>();

            for (const item of cdoData.results) {
              const date = item.date.split('T')[0]; // Extract date part

              if (!dataByDate.has(date)) {
                dataByDate.set(date, new Map());
              }

              dataByDate.get(date)!.set(item.datatype, item.value);
            }

            // Format the daily summaries
            let output = `# Historical Weather Data (Daily Summaries)\n\n`;
            output += `**Period:** ${startTime.toLocaleDateString()} to ${endTime.toLocaleDateString()}\n`;
            output += `**Number of days:** ${dataByDate.size}\n`;
            output += `**Data source:** NOAA Climate Data Online (Archival)\n\n`;

            for (const [date, values] of dataByDate) {
              output += `## ${new Date(date).toLocaleDateString()}\n`;

              if (values.has('TMAX')) {
                output += `- **High Temperature:** ${Math.round(values.get('TMAX')!)}°F\n`;
              }

              if (values.has('TMIN')) {
                output += `- **Low Temperature:** ${Math.round(values.get('TMIN')!)}°F\n`;
              }

              if (values.has('TAVG')) {
                output += `- **Average Temperature:** ${Math.round(values.get('TAVG')!)}°F\n`;
              }

              if (values.has('PRCP')) {
                output += `- **Precipitation:** ${values.get('PRCP')!.toFixed(2)} inches\n`;
              }

              if (values.has('SNOW')) {
                const snow = values.get('SNOW')!;
                if (snow > 0) {
                  output += `- **Snowfall:** ${snow.toFixed(1)} inches\n`;
                }
              }

              output += `\n`;
            }

            return {
              content: [
                {
                  type: 'text',
                  text: output
                }
              ]
            };
          } catch (error) {
            // If CDO API fails, provide helpful error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Unable to retrieve historical data: ${errorMessage}`);
          }
        } else {
          // Use real-time NOAA API for recent data (last 7 days)
          const observations = await noaaService.getHistoricalObservations(
            latitude,
            longitude,
            startTime,
            endTime,
            limit
          );

          if (!observations.features || observations.features.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `No historical observations found for the specified date range (${start_date} to ${end_date}).\n\nThis may occur because:\n- The dates are outside the station's available data range\n- There are gaps in the observation records for this location\n- The weather station near this location may not have archived data for these dates\n\nNote: Historical weather data availability varies by location and weather station. Some stations have limited historical records.`
                }
              ]
            };
          }

          // Format the observations
          let output = `# Historical Weather Observations\n\n`;
          output += `**Period:** ${startTime.toLocaleDateString()} to ${endTime.toLocaleDateString()}\n`;
          output += `**Number of observations:** ${observations.features.length}\n`;
          output += `**Data source:** NOAA Real-time API\n\n`;

          for (const obs of observations.features) {
            const props = obs.properties;
            output += `## ${new Date(props.timestamp).toLocaleString()}\n`;

            if (props.temperature.value !== null) {
              const tempF = props.temperature.unitCode.includes('degC')
                ? (props.temperature.value * 9/5) + 32
                : props.temperature.value;
              output += `- **Temperature:** ${Math.round(tempF)}°F\n`;
            }

            if (props.textDescription) {
              output += `- **Conditions:** ${props.textDescription}\n`;
            }

            if (props.windSpeed.value !== null) {
              const windMph = props.windSpeed.unitCode.includes('km_h')
                ? props.windSpeed.value * 0.621371
                : props.windSpeed.value * 2.23694;
              output += `- **Wind:** ${Math.round(windMph)} mph\n`;
            }

            output += `\n`;
          }

          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP communication
  console.error('Weather MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
