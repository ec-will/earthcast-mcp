/**
 * Handler for get_forecast tool
 */

import { NOAAService } from '../services/noaa.js';
import {
  validateCoordinates,
  validateForecastDays,
  validateGranularity,
  validateOptionalBoolean,
} from '../utils/validation.js';

interface ForecastArgs {
  latitude?: number;
  longitude?: number;
  days?: number;
  granularity?: 'daily' | 'hourly';
  include_precipitation_probability?: boolean;
}

export async function handleGetForecast(
  args: unknown,
  noaaService: NOAAService
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate input parameters with runtime checks
  const { latitude, longitude } = validateCoordinates(args);
  const days = validateForecastDays(args);
  const granularity = validateGranularity((args as ForecastArgs)?.granularity);
  const include_precipitation_probability = validateOptionalBoolean(
    (args as ForecastArgs)?.include_precipitation_probability,
    'include_precipitation_probability',
    true
  );

  // Get forecast data based on granularity
  const forecast = granularity === 'hourly'
    ? await noaaService.getHourlyForecastByCoordinates(latitude, longitude)
    : await noaaService.getForecastByCoordinates(latitude, longitude);

  // Determine how many periods to show
  let periods;
  if (granularity === 'hourly') {
    // For hourly, show up to days * 24 hours
    periods = forecast.properties.periods.slice(0, days * 24);
  } else {
    // For daily, show up to days * 2 (day/night periods)
    periods = forecast.properties.periods.slice(0, days * 2);
  }

  // Format the forecast for display
  let output = `# Weather Forecast (${granularity === 'hourly' ? 'Hourly' : 'Daily'})\n\n`;
  output += `**Location:** ${forecast.properties.elevation.value}m elevation\n`;
  if (forecast.properties.updated) {
    output += `**Updated:** ${new Date(forecast.properties.updated).toLocaleString()}\n`;
  }
  output += `**Showing:** ${periods.length} ${granularity === 'hourly' ? 'hours' : 'periods'}\n\n`;

  for (const period of periods) {
    // For hourly forecasts, use the start time as the header since period names are empty
    const periodHeader = granularity === 'hourly' && !period.name
      ? new Date(period.startTime).toLocaleString()
      : period.name;
    output += `## ${periodHeader}\n`;
    output += `**Temperature:** ${period.temperature}°${period.temperatureUnit}`;

    // Add temperature trend if available
    if (period.temperatureTrend && period.temperatureTrend.trim()) {
      output += ` (${period.temperatureTrend})`;
    }
    output += `\n`;

    // Add precipitation probability if requested and available
    if (include_precipitation_probability && period.probabilityOfPrecipitation?.value !== null && period.probabilityOfPrecipitation?.value !== undefined) {
      output += `**Precipitation Chance:** ${period.probabilityOfPrecipitation.value}%\n`;
    }

    output += `**Wind:** ${period.windSpeed} ${period.windDirection}\n`;

    // Add humidity if available (more common in hourly forecasts)
    if (period.relativeHumidity?.value !== null && period.relativeHumidity?.value !== undefined) {
      output += `**Humidity:** ${period.relativeHumidity.value}%\n`;
    }

    output += `**Forecast:** ${period.shortForecast}\n\n`;

    // For daily forecasts, include detailed forecast
    if (granularity === 'daily' && period.detailedForecast) {
      output += `${period.detailedForecast}\n\n`;
    }
  }

  output += `---\n`;
  output += `*Data source: NOAA National Weather Service*\n`;

  return {
    content: [
      {
        type: 'text',
        text: output
      }
    ]
  };
}
