# Earthcast MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

An MCP (Model Context Protocol) server that provides **environmental and weather data** to AI systems like Claude, Cursor, Warp, and Grok. Combines comprehensive global weather data (NOAA, Open-Meteo) with specialized environmental products from Earthcast Technologies API.

**Perfect for:** Launch operations, aviation planning, space weather monitoring, and advanced environmental analysis.

**Supported Platforms:** Warp, Claude Desktop, Claude Code, Cline (VS Code), Cursor, Grok (xAI), and any MCP-compatible AI assistant.

## Features

### 🚀 Earthcast Technologies Integration (NEW!)

Access specialized environmental data from Earthcast Technologies API:

- **Launch Decision Support** - Go/No-Go evaluations with customizable thresholds
  - Lightning density monitoring
  - Multi-level windshear analysis (low/high altitude)
  - Turbulence forecasting
  - Radar reflectivity
  - Contrail potential
  - Comprehensive launch safety assessment

- **Advanced Environmental Data**
  - **Neutral Atmospheric Density** (100-1000km altitude) - Critical for satellite operations and orbital mechanics
  - **Ionospheric Density (VTEC)** - Space weather and GPS/radio propagation
  - **Contrail Formation** - Aviation condensation trail prediction
  - **Multi-Level Windshear** - Low-level (850mb/~5,000ft) and high-level (300mb/~30,000ft)
  - **Turbulence Forecasting** - Flight safety and passenger comfort
  - **Radar Reflectivity** - Precipitation detection at 5km resolution

### 🌍 Global Weather Data (from weather-mcp)

All the features from the proven weather-mcp foundation:

- **Global Weather Forecasts** - NOAA (US, detailed) + Open-Meteo (international)
  - Up to 16-day forecasts
  - Hourly or daily granularity
  - Sunrise/sunset times
  
- **Current Conditions** - Real-time weather observations
  - Temperature, humidity, wind, pressure
  - Heat index and wind chill
  - Cloud cover and visibility

- **Location Services**
  - Global location search (cities, airports, landmarks)
  - Save favorite locations with aliases ("home", "work")
  - Automatic geocoding

- **Weather Alerts** - US watches, warnings, and advisories
  - Severity levels and urgency indicators
  - Effective/expiration times

- **Historical Weather** - Access past weather data (1940-present)
- **Air Quality** - AQI, pollutants, UV index, health recommendations
- **Marine Conditions** - Wave heights, swell, ocean currents
- **Lightning Detection** - Real-time strike monitoring
- **River Conditions** - Water levels and flood status
- **Wildfire Tracking** - Active fires and containment status
- **Weather Imagery** - Radar and precipitation maps

## Installation

### Quick Start (npx - Recommended)

No installation needed! Use with any MCP-compatible AI tool:

#### Warp

Add to `~/.config/warp/mcp_settings.json` or configure via Warp UI:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "npx",
      "args": ["-y", "earthcast-mcp"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password",
        "ENABLED_TOOLS": "basic,+earthcast_query_data,+earthcast_gonogo_decision"
      }
    }
  }
}
```

#### Claude Desktop

Edit config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "npx",
      "args": ["-y", "earthcast-mcp"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password"
      }
    }
  }
}
```

#### Claude Code (CLI)

Add to `~/.config/claude-code/mcp_settings.json`:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "npx",
      "args": ["-y", "earthcast-mcp"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password"
      }
    }
  }
}
```

#### Cline (VS Code)

Configure in Cline's MCP settings:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "npx",
      "args": ["-y", "earthcast-mcp"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password"
      }
    }
  }
}
```

#### Cursor

Add via Cursor settings or manual config file.

#### Grok (xAI)

For xAI's Grok integration, add to your MCP configuration:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "npx",
      "args": ["-y", "earthcast-mcp"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password",
        "ENABLED_TOOLS": "basic,+earthcast_query_data,+earthcast_gonogo_decision"
      }
    }
  }
}
```

### Local Development Installation

```bash
git clone https://github.com/your-org/earthcast-mcp.git
cd earthcast-mcp
npm install
npm run build
```

Then reference the local build in your MCP config:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "node",
      "args": ["/absolute/path/to/earthcast-mcp/dist/index.js"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password"
      }
    }
  }
}
```

## Configuration

### Required: Earthcast API Credentials

To use Earthcast features, you need API credentials:

1. Contact Earthcast Technologies for API access
2. Set credentials in your MCP configuration (see Installation above)

### Optional: Tool Selection

Control which tools are available to reduce context overhead:

```bash
# Basic weather tools only (default)
ENABLED_TOOLS=basic

# Basic + Earthcast tools
ENABLED_TOOLS=basic,+earthcast_query_data,+earthcast_gonogo_decision

# All weather tools + Earthcast
ENABLED_TOOLS=all,+earthcast_query_data,+earthcast_gonogo_decision
```

**Available presets:**
- `basic` - Essential weather (9 tools): forecast, current, alerts, location services
- `standard` - Basic + historical weather
- `full` - Standard + air quality
- `all` - All 15 weather tools (marine, imagery, lightning, rivers, wildfires)

### Optional: Additional Settings

Create a `.env` file for advanced configuration:

```bash
# Earthcast API
ECT_API_URL=http://ect-sandbox.com:8000  # Default sandbox URL
ECT_API_USERNAME=your_username
ECT_API_PASSWORD=your_password

# Performance
CACHE_ENABLED=true
CACHE_MAX_SIZE=1000
API_TIMEOUT_MS=30000

# Logging (0=DEBUG, 1=INFO, 2=WARN, 3=ERROR)
LOG_LEVEL=1
```

## Available Tools

### Earthcast Tools

#### `earthcast_gonogo_decision`
Launch decision support with threshold-based evaluations.

**Example:**
```
Check launch conditions at Cape Canaveral (28.5, -80.5) with 
lightning threshold 0.5 and windshear threshold 15 m/s
```

**Parameters:**
- `products` - Weather products to evaluate (comma-separated)
- `thresholds` - Threshold values for each product (object)
- `latitude`, `longitude` - Launch site coordinates
- `radius` - Evaluation radius in km (default: 50)
- `site_description` - Optional site name

**Products:** `lightning_density`, `low-level-windshear`, `high-level-windshear`, `turbulence_max`, `reflectivity_5k`, `contrails_max`

#### `earthcast_query_data`
Query raw environmental data for analysis.

**Example:**
```
Get neutral atmospheric density at 400km altitude for coordinates 28.5, -80.5
```

**Parameters:**
- `products` - One or more product keys (comma-separated)
- `latitude`, `longitude` - Query location
- `altitude` - Altitude in km (for altitude-dependent products)
- `radius` - Query radius in km

**Products:** `neutral_density`, `ionospheric_density`, `contrails_max`, `contrails`, `lightning_density`, `low-level-windshear`, `high-level-windshear`, `turbulence_max`, `reflectivity_5k`

### Weather Tools (15 tools)

Earthcast MCP includes all 15 weather tools from the proven weather-mcp foundation:

- `get_forecast` - Weather forecasts (1-16 days, global)
- `get_current_conditions` - Current weather observations (US)
- `get_alerts` - Weather watches and warnings (US)
- `get_historical_weather` - Past weather data (1940-present, global)
- `search_location` - Find coordinates for locations (global)
- `get_air_quality` - AQI and pollutant data (global)
- `get_marine_conditions` - Wave heights and ocean conditions (global)
- `get_lightning_activity` - Real-time lightning strikes (global)
- `get_river_conditions` - Water levels and flood status (US)
- `get_wildfire_info` - Active fire tracking (US)
- `get_weather_imagery` - Radar and satellite images (global)
- `save_location` - Save favorite locations
- `list_saved_locations` - List saved locations
- `get_saved_location` - Get specific saved location
- `remove_saved_location` - Remove saved location
- `check_service_status` - Check API health

📖 **[See WEATHER_TOOLS.md for detailed documentation](WEATHER_TOOLS.md)** - Complete parameters, examples, and return values for all 15 weather tools.

## Example Queries

### Launch Operations
```
Is it safe to launch from Cape Canaveral today?
Evaluate: lightning < 0.5, windshear < 15 m/s
```

### Aviation Planning
```
Compare surface winds with upper-level conditions at Houston
Show contrail potential and turbulence
```

### Space Weather
```
Get ionospheric density and neutral atmospheric density at 400km
over coordinates 28.5, -80.5
```

### Combined Analysis
```
Get NOAA weather forecast for Houston, then check Earthcast
specialized products for the same location
```

## Architecture

Built on the proven weather-mcp foundation with added Earthcast integration:

- **Handler-Service Pattern** - Clean separation of concerns
- **Intelligent Caching** - Reduces API calls by 50-80%
- **Error Handling** - Graceful degradation with detailed error messages
- **Type Safety** - Full TypeScript implementation
- **Retry Logic** - Exponential backoff for transient failures
- **Multi-Source** - Automatic fallback between data sources

## API Credits

### Earthcast Technologies
- Advanced environmental and weather products
- Launch decision support systems
- Space weather monitoring
- **Requires:** API credentials

### Free Weather APIs (No Authentication Required)
- **NOAA** - US weather data (forecasts, current conditions, alerts)
- **Open-Meteo** - Global weather and historical data
- **Nominatim (OpenStreetMap)** - Global geocoding
- **RainViewer** - Weather radar imagery
- **Blitzortung.org** - Real-time lightning detection
- **USGS** - River conditions and streamflow
- **NIFC** - Wildfire tracking

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
npm run test:coverage

# Type checking
npx tsc --noEmit
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

Based on [weather-mcp](https://github.com/weather-mcp/weather-mcp) by the Weather MCP Server Contributors.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/earthcast-mcp/issues)
- **Earthcast API**: Contact Earthcast Technologies for API access
- **Architecture**: See [WARP.md](WARP.md) for development guide and architecture details

## Version

Current version: 0.1.0

See [CHANGELOG.md](CHANGELOG.md) for version history.
