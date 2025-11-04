# Weather MCP Server

An MCP (Model Context Protocol) server that provides weather data from NOAA's API to AI systems like Claude Code.

## Features

- **Get Forecast**: Retrieve weather forecasts for any US location (7-day forecast)
- **Current Conditions**: Get real-time weather observations
- **Historical Data**: Access historical weather observations for custom date ranges
  - Recent data (last 7 days): Detailed hourly observations from real-time API
  - Archival data (>7 days old): Daily summaries from NOAA Climate Data Online

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd weather-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. (Optional) Configure CDO API token for archival data:

To access historical weather data older than 7 days, you need a free NOAA Climate Data Online API token:

- Request a token at: https://www.ncdc.noaa.gov/cdo-web/token
- You'll receive the token via email (usually within minutes)

**For local development and testing:**
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your token
# NOAA_CDO_TOKEN=your_actual_token_here
```

**For use with Claude Code:**
- Add the token as an environment variable in your MCP settings (see configuration examples below)

**Note**: Without a CDO token, the server will still work for forecasts, current conditions, and recent historical data (last 7 days).

## Usage with Claude Code

Add the server to your Claude Code MCP settings:

### macOS/Linux
Edit `~/.config/claude-code/mcp_settings.json`:

**Without CDO token** (forecasts, current conditions, and last 7 days of historical data):
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/weather-mcp/dist/index.js"]
    }
  }
}
```

**With CDO token** (includes archival data older than 7 days):
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/weather-mcp/dist/index.js"],
      "env": {
        "NOAA_CDO_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Windows
Edit `%APPDATA%\claude-code\mcp_settings.json`:

**Without CDO token**:
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\weather-mcp\\dist\\index.js"]
    }
  }
}
```

**With CDO token**:
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\weather-mcp\\dist\\index.js"],
      "env": {
        "NOAA_CDO_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Finding Coordinates

All tools require latitude and longitude coordinates. You can find coordinates for any location by:
- Asking Claude Code: "What are the coordinates for [city name]?"
- Using Google Maps: Right-click a location and select the coordinates
- Using a geocoding service like geocode.maps.co or nominatim.org

### Common US City Coordinates

| City | Latitude | Longitude |
|------|----------|-----------|
| San Francisco, CA | 37.7749 | -122.4194 |
| New York, NY | 40.7128 | -74.0060 |
| Chicago, IL | 41.8781 | -87.6298 |
| Los Angeles, CA | 34.0522 | -118.2437 |
| Denver, CO | 39.7392 | -104.9903 |
| Miami, FL | 25.7617 | -80.1918 |
| Seattle, WA | 47.6062 | -122.3321 |
| Austin, TX | 30.2672 | -97.7431 |

## Available Tools

### 1. get_forecast
Get weather forecast for a location.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `days` (optional): Number of days in forecast (1-7, default: 7)

**Example:**
```
Get the weather forecast for San Francisco (latitude: 37.7749, longitude: -122.4194)
```

### 2. get_current_conditions
Get current weather conditions for a location.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)

**Example:**
```
What are the current weather conditions in New York? (latitude: 40.7128, longitude: -74.0060)
```

### 3. get_historical_weather
Get historical weather observations for a location.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `start_date` (required): Start date in ISO format (YYYY-MM-DD)
- `end_date` (required): End date in ISO format (YYYY-MM-DD)
- `limit` (optional): Max observations to return (1-500, default: 168)

**Data Source Selection:**
- **Last 7 days**: Uses NOAA real-time API for detailed hourly observations (temperature, conditions, wind, etc.)
- **Older than 7 days**: Automatically switches to Climate Data Online for daily summaries (high/low temps, precipitation, snowfall)
  - Requires CDO API token (see Installation section)
  - Returns daily summaries instead of hourly data

**Examples:**
```
Get recent weather: "What was the weather like in Chicago 3 days ago?" (latitude: 41.8781, longitude: -87.6298)
```
```
Get archival weather: "What was the weather in New York on September 2, 2020?" (latitude: 40.7128, longitude: -74.0060)
```

## Testing

### Quick Test

Verify NOAA API connectivity:
```bash
npx tsx test_noaa_api.ts
```

This runs 5 tests covering all major functionality with real NOAA API calls.

### Manual Testing with Claude Code

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions including:
- Setup steps
- Test cases for all tools
- Error handling verification
- Performance testing
- Debugging tips

## Development

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run the server in development mode with tsx
- `npm start` - Run the compiled server
- `npx tsx test_noaa_api.ts` - Run API connectivity tests

### Project Structure

```
weather-mcp/
├── src/
│   ├── index.ts           # Main MCP server
│   ├── services/
│   │   ├── noaa.ts        # NOAA real-time API service
│   │   └── cdo.ts         # Climate Data Online API service
│   ├── types/
│   │   ├── noaa.ts        # NOAA TypeScript type definitions
│   │   └── cdo.ts         # CDO TypeScript type definitions
│   └── utils/
│       └── units.ts       # Unit conversion utilities
├── dist/                  # Compiled JavaScript (generated)
├── tests/                 # Test files
└── package.json
```

## API Information

This server uses two NOAA APIs:

### NOAA Weather API (Real-time)
- **Base URL**: https://api.weather.gov
- **Authentication**: None required (User-Agent header only)
- **Rate Limits**: Enforced with 5-second retry window
- **Coverage**: United States locations
- **Use cases**: Forecasts, current conditions, recent observations (last 7 days)

### Climate Data Online (CDO) API v2 (Archival)
- **Base URL**: https://www.ncei.noaa.gov/cdo-web/api/v2
- **Authentication**: Free API token required (get at https://www.ncdc.noaa.gov/cdo-web/token)
- **Rate Limits**: 5 requests/second, 10,000 requests/day
- **Coverage**: United States locations
- **Use cases**: Historical daily summaries (older than 7 days)
- **Data**: High/low temperatures, precipitation, snowfall

For more details, see [NOAA_API_RESEARCH.md](./NOAA_API_RESEARCH.md).

## Limitations

- NOAA APIs only cover United States locations
- Recent historical data (last 7 days): Hourly observations may have gaps depending on station
- Archival historical data (>7 days):
  - Requires free CDO API token
  - Daily summaries only (no hourly detail)
  - Data availability varies by location and date
- Real-time observations may be delayed up to 20 minutes
- Rate limits apply:
  - Weather API: Automatic retry with exponential backoff
  - CDO API: 5 requests/second, 10,000 requests/day

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
