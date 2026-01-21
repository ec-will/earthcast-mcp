# Earthcast MCP Tools Documentation

Comprehensive documentation for all tools in earthcast-mcp, including 15 weather tools from the weather-mcp foundation and 4 specialized Earthcast Technologies tools.

---

## Tool Summary

### Earthcast Technologies Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `earthcast_gonogo_decision` | Launch decision support | Space launch safety |
| `earthcast_query_data` | Advanced environmental data | Satellite ops, aviation |
| `earthcast_vector_query` | Weather along trajectories | Orbital mechanics |
| `earthcast_optical_depth` | Atmospheric optical depth | Telescope operations |

### Weather Tools

| Tool | Description | Coverage |
|------|-------------|----------|
| `get_forecast` | Weather forecasts (1-16 days) | Global |
| `get_current_conditions` | Current weather observations | US |
| `get_alerts` | Weather watches/warnings | US |
| `get_historical_weather` | Past weather data (1940-present) | Global |
| `search_location` | Find coordinates for locations | Global |
| `get_air_quality` | AQI and pollutant data | Global |
| `get_marine_conditions` | Wave heights, swell, currents | Global |
| `get_lightning_activity` | Real-time lightning strikes | Global |
| `get_river_conditions` | Water levels and flood status | US |
| `get_wildfire_info` | Active fire tracking | US |
| `get_weather_imagery` | Radar and precipitation maps | Global |
| `save_location` | Save favorite locations | - |
| `list_saved_locations` | List saved locations | - |
| `get_saved_location` | Get specific saved location | - |
| `remove_saved_location` | Remove saved location | - |

---

## Earthcast Technologies Tools

### earthcast_gonogo_decision
Launch decision support with threshold-based GO/NO-GO evaluation.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `products` (required): Comma-separated product keys to evaluate
- `thresholds` (optional): Custom thresholds per product (e.g., `{"lightning_density": 0.5}`)
- `radius` (optional): Query radius in km (default: 50)
- `use_forecast` (optional): Use forecast vs observed data (default: false)

**Available Products:**
- `lightning_density` - 30-minute average lightning activity
- `low-level-windshear` - Winds at 850mb (~5,000 ft)
- `high-level-windshear` - Winds at 300mb (~30,000 ft)
- `turbulence_max` - Maximum turbulence composite
- `contrails_max` - Maximum contrail potential
- `reflectivity_5k` - Radar reflectivity at 5km resolution

**Returns:**
- Overall GO/NO-GO decision
- Product-by-product evaluation
- Values vs thresholds comparison
- Safety recommendations

**Examples:**
```
Is it safe to launch from Cape Canaveral today?
Evaluate launch conditions: lightning < 0.5, windshear < 15 m/s
```

---

### earthcast_query_data
Query advanced environmental data products.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `products` (required): Comma-separated product keys
- `altitude` (optional): Altitude in km for altitude-dependent products
- `radius` (optional): Query radius in km
- `start_date` (optional): Start time in ISO 8601 format
- `end_date` (optional): End time in ISO 8601 format

**Available Products:**
- `neutral_density` - Atmospheric density at 100-1000km altitude (satellite drag)
- `ionospheric_density` - VTEC for GPS/radio propagation
- `lightning_density` - 30-minute average lightning activity
- `low-level-windshear` - Winds at 850mb (~5,000 ft)
- `high-level-windshear` - Winds at 300mb (~30,000 ft)
- `turbulence_max` - Maximum turbulence composite
- `contrails_max` - Maximum contrail formation potential
- `contrails` - Altitude-specific contrail potential (100+ levels)
- `reflectivity_5k` - Global radar reflectivity at 5km resolution

**Returns:**
- Grid values for requested products
- Statistics (min, max, mean)
- Timestamps and spatial metadata

**Examples:**
```
Get neutral atmospheric density at 400km altitude over Cape Canaveral
Query ionospheric density for GPS planning
```

---

### earthcast_vector_query
Query weather data along an ordered vector path - ideal for orbital trajectories.

**Parameters:**
- `products` (required): Comma-separated product keys
- `vectors` (required): Array of points defining the path, each with:
  - `lat` - Latitude
  - `lon` - Longitude
  - `radius` - Search radius in km
  - `altitude` (optional) - Altitude in km
- `date` (optional): ISO 8601 timestamp

**Returns:**
- Weather data at each vector point
- Product values along the trajectory
- Spatial and temporal metadata

**Examples:**
```
Get neutral density along a satellite trajectory from 28.5, -80.5 through 30.0, -78.0 to 32.0, -76.0
Query atmospheric conditions along reentry path
```

---

### earthcast_optical_depth
Assess atmospheric optical depth along a line-of-sight for ground-based telescope operations.

**Parameters:**
- `products` (required): Comma-separated product keys (recommended: neutral_density, ionospheric_density, contrails)
- `vectors` (required): Minimum 2 vectors defining the line-of-sight:
  - Telescope location
  - Target point (or intermediate points)
- `description` (optional): Observation description

**Returns:**
- Optical depth assessment
- Visibility probability
- Atmospheric interference metrics
- Observation recommendations

**Examples:**
```
Evaluate viewing conditions from Mount Palomar Observatory to target at azimuth 180°, elevation 45°
Assess optical depth for tonight's observation
```

---

## Weather Tools

### 1. get_forecast
Get weather forecast for any location worldwide.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `days` (optional): Number of days in forecast (1-16, default: 7)
- `granularity` (optional): "daily" or "hourly" (default: "daily")
- `include_precipitation_probability` (optional): Include rain chances (default: true)
- `include_normals` (optional): Include climate normals for comparison (default: false)
- `include_severe_weather` (optional): Include severe weather probabilities - US only (default: false)
- `source` (optional): "auto" (default), "noaa" (US only), or "openmeteo" (global)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Sources:**
- **US locations**: NOAA (more detailed, up to 7 days)
- **International**: Open-Meteo (up to 16 days)
- Automatic selection based on coordinates

**Returns:**
- Temperature (high/low, feels like)
- Sunrise/sunset times with daylight duration
- Precipitation chances and amounts
- Wind speed, direction, and gusts
- Weather conditions and descriptions
- UV index (international)
- Humidity and atmospheric conditions
- Climate normals comparison (optional)
- Snow and ice accumulation forecasts
- Severe weather probabilities (US only, optional)
- All timestamps in local timezone

**Examples:**
```
Get a 7-day forecast for Paris
Get hourly forecast for Tokyo for the next 3 days
Show 16-day extended forecast for Sydney
What's the forecast at home? (using saved location)
```

---

### 2. get_current_conditions
Get current weather conditions for a location (US only).

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `include_fire_weather` (optional): Include fire weather indices (default: false)
- `include_normals` (optional): Include climate normals (default: false)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Source:** NOAA (US only)

**Returns:**
- Current temperature, humidity, wind, pressure
- Heat index or wind chill (when applicable)
- 24-hour temperature range
- Recent precipitation
- Cloud cover and visibility
- Snow depth on ground (when available)
- Climate normals comparison (optional)
- Fire weather indices (optional)
- All timestamps in local timezone

**Examples:**
```
What are the current weather conditions in New York?
Get current conditions with fire weather data for California
Show current weather at work (using saved location)
```

---

### 3. search_location
Find coordinates for any location worldwide by name.

**Parameters:**
- `query` (required): Location name to search (e.g., "Paris", "New York, NY", "Tokyo")
- `limit` (optional): Maximum number of results (1-100, default: 5)

**Data Source:** Nominatim (OpenStreetMap)

**Returns:**
- Location name and full administrative hierarchy
- Latitude and longitude coordinates
- Timezone and elevation
- Population (when available)
- Country and region information
- Feature type (capital, city, airport, etc.)

**Examples:**
```
Find coordinates for Paris
Search for Tokyo, Japan
Where is San Francisco, CA?
```

---

### 4. get_alerts
Get active weather alerts, watches, warnings, and advisories for US locations.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `active_only` (optional): Show only active alerts (default: true)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Source:** NOAA (US only)

**Returns:**
- Alert type and severity (Extreme → Severe → Moderate → Minor)
- Urgency, certainty, and response type
- Event description and instructions
- Effective and expiration times
- Affected geographic areas
- Recommended actions and safety information

**Examples:**
```
Are there any weather alerts for Miami, Florida?
Check for severe weather warnings in Oklahoma City
What weather watches are active in my area?
```

---

### 5. get_historical_weather
Get historical weather observations for any location worldwide.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `start_date` (required): Start date in ISO format (YYYY-MM-DD)
- `end_date` (required): End date in ISO format (YYYY-MM-DD)
- `limit` (optional): Max observations to return (1-500, default: 168)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Sources:**
- **Last 7 days (US)**: NOAA real-time API (detailed hourly observations)
- **Older than 7 days (Global)**: Open-Meteo Historical API (1940-present)

**Returns:**
- Temperature and conditions
- Precipitation amounts
- Wind speed and direction
- Humidity and pressure
- Cloud cover
- Historical data back to 1940

**Examples:**
```
What was the weather like in Chicago 3 days ago?
What was the weather in Paris on January 15, 2024?
Show me weather data for Tokyo from Jan 1 to Dec 31, 2020
```

---

### 6. get_air_quality
Get comprehensive air quality data for any location worldwide.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `forecast` (optional): Include hourly forecast for next 5 days (default: false)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Source:** Open-Meteo Air Quality API

**Returns:**
- Air Quality Index (US AQI for US, European EAQI elsewhere)
- Health risk category and recommendations
- Pollutant concentrations (PM2.5, PM10, O₃, NO₂, SO₂, CO, NH₃)
- UV Index with sun protection guidance
- Activity recommendations for sensitive groups
- Optional 5-day hourly forecast

**Examples:**
```
What's the air quality in Los Angeles?
Check pollution levels in Beijing
Get air quality forecast for Paris for the next 5 days
```

---

### 7. get_marine_conditions
Get marine weather conditions including waves, swell, and ocean currents.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `forecast` (optional): Include 5-day marine forecast (default: false)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Sources:**
- **Great Lakes & Coastal Bays**: NOAA gridpoint data (automatic)
- **Ocean Coverage**: Open-Meteo Marine API (global)

**Returns:**
- Significant wave height with safety category
- Wind waves (locally generated) height and direction
- Swell height, period, and direction
- Ocean current velocity and direction
- Sea state interpretation (Douglas Sea Scale)
- Safety assessment for maritime activities
- Optional 5-day forecast

**Important:** NOT for coastal navigation - consult official marine forecasts.

**Examples:**
```
What are the ocean conditions off California?
Get wave height and swell for surfing in Hawaii
Check marine conditions in the Atlantic Ocean
```

---

### 8. get_lightning_activity
Get real-time lightning strike detection and safety assessment.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `radius` (optional): Search radius in km (1-500, default: 100)
- `timeWindow` (optional): Historical window in minutes (1-180, default: 60)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Source:** Blitzortung.org (free community lightning network)

**Returns:**
- Real-time lightning strikes within radius
- 4-level safety assessment:
  - **Safe** (>50km): No immediate threat
  - **Elevated** (16-50km): Monitor conditions
  - **High** (8-16km): Seek shelter immediately
  - **Extreme** (<8km): Active thunderstorm, dangerous
- Comprehensive statistics (total strikes, density, rate)
- Distance to nearest strike
- Strike details (polarity, amplitude, timestamp, location)
- Safety recommendations

**Examples:**
```
Are there any lightning strikes near Miami?
Check for lightning activity within 50km
Is it safe to be outside based on lightning?
```

---

### 9. get_river_conditions
Monitor river levels and flood status using NOAA and USGS data.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `radius` (optional): Search radius in km (1-500, default: 50)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Sources:**
- **Gauge locations**: NOAA National Water Prediction Service (NWPS)
- **Streamflow data**: USGS Water Services

**Returns:**
- Current water levels from nearby gauges
- Flood stage thresholds (action, minor, moderate, major)
- Streamflow data in cubic feet per second
- Safety assessment for boating and recreation
- Historical flood crest data (when available)
- Distance to gauges

**Examples:**
```
What are the river conditions near St. Louis?
Check for flooding on the Mississippi River
Is the river level safe for kayaking?
```

---

### 10. get_wildfire_info
Track active wildfires and fire perimeters.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `radius` (optional): Search radius in km (1-500, default: 100)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Source:** NIFC WFIGS (National Interagency Fire Center)

**Returns:**
- Active wildfire locations and prescribed burns
- Fire size, containment status, and discovery date
- 4-level safety assessment:
  - **Extreme Danger** (<5km): Immediate evacuation
  - **High Alert** (5-25km): Prepare to evacuate
  - **Caution** (25-50km): Monitor conditions
  - **Awareness** (>50km): Stay informed
- Distance-based proximity filtering
- Detailed fire attributes (type, location, status)
- Evacuation recommendations

**Examples:**
```
Are there any wildfires near Los Angeles?
Check for active fires within 50 miles
What's the containment status of nearby wildfires?
```

---

### 11. get_weather_imagery
Get weather radar and precipitation imagery for visual analysis.

**Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `type` (required): "precipitation", "radar", or "satellite" (satellite not yet implemented)
- `animated` (optional): Return animated loop vs static (default: false)
- `layers` (optional): Additional map layers (reserved for future use)
- `location_name` (optional): Use saved location name instead of coordinates

**Data Source:** RainViewer API (global coverage)

**Returns:**
- Precipitation radar imagery (static or animated)
- Tile URLs for efficient rendering
- Frame timestamps for animated sequences
- Coverage area and resolution information
- Up to 2 hours of historical radar frames (animated)

**Examples:**
```
Show me the current radar for New York
Get animated precipitation radar for London
Is there any precipitation showing on radar?
```

---

### 12. save_location
Save a location for easy reuse in weather queries.

**Parameters:**
- `alias` (required): Short name for location (e.g., "home", "work", "cabin")
- `location_query` (optional): Location to geocode (e.g., "Seattle, WA")
- `latitude` (optional): Latitude if providing coordinates directly
- `longitude` (optional): Longitude if providing coordinates directly
- `name` (optional): Display name for the location
- `description` (optional): Description for natural language matching
- `alternateNames` (optional): Alternate names/aliases (array)
- `activities` (optional): Activities at this location (array)
- `notes` (optional): Freeform notes

**Storage:** `~/.earthcast-mcp/locations.json`

**Examples:**
```
Save my home location in Seattle
Save my cabin at coordinates 45.5, -120.7
Save work location with activities: boating, fishing
```

---

### 13. list_saved_locations
List all saved locations.

**Parameters:** None

**Returns:**
- All saved locations with aliases
- Names, coordinates, and metadata
- Activities and notes

**Examples:**
```
What locations do I have saved?
Show my saved places
```

---

### 14. get_saved_location
Get details for a specific saved location.

**Parameters:**
- `alias` (required): The alias/name of the saved location

**Returns:**
- Complete location details
- Coordinates, name, description
- Activities and notes

**Examples:**
```
Show me details for my home location
What are the coordinates for my cabin?
```

---

### 15. remove_saved_location
Remove a saved location.

**Parameters:**
- `alias` (required): The alias/name of the location to remove

**Examples:**
```
Remove my work location
Delete the cabin from saved locations
```

---

### 16. check_service_status
Check the operational status of weather APIs and cache performance.

**Parameters:** None

**Returns:**
- Operational status for NOAA API
- Operational status for Open-Meteo API
- Cache statistics (hit rate, size, efficiency)
- Status page links
- Recommended actions if issues detected
- Overall service availability

**Examples:**
```
Check if the weather services are operational
Are there any API outages?
What's the cache hit rate?
```

---

## Common City Coordinates

For quick reference:

| City | Latitude | Longitude |
|------|----------|-----------|
| New York, NY | 40.7128 | -74.0060 |
| Los Angeles, CA | 34.0522 | -118.2437 |
| Chicago, IL | 41.8781 | -87.6298 |
| Houston, TX | 29.7604 | -95.3698 |
| Miami, FL | 25.7617 | -80.1918 |
| London, UK | 51.5074 | -0.1278 |
| Paris, France | 48.8566 | 2.3522 |
| Tokyo, Japan | 35.6762 | 139.6503 |
| Sydney, Australia | -33.8688 | 151.2093 |
| Berlin, Germany | 52.5200 | 13.4050 |

---

## Data Source Credits

### Earthcast Technologies API (Requires Credentials)
- Advanced environmental products for space and aviation
- Neutral atmospheric density (100-1000km altitude)
- Ionospheric density (VTEC)
- Launch decision support systems
- See [ECT_API_DOCUMENTATION.md](ECT_API_DOCUMENTATION.md) for details

### Free APIs (No Authentication Required)
- **NOAA** - US weather data (forecasts, current conditions, alerts, marine, rivers)
- **Open-Meteo** - Global weather, historical data, air quality, marine
- **Nominatim** - Global geocoding via OpenStreetMap
- **RainViewer** - Global weather radar imagery
- **Blitzortung.org** - Real-time lightning detection
- **USGS** - River conditions and streamflow
- **NIFC** - Wildfire tracking

---

## Related Documentation

- [README.md](README.md) - Project overview and installation
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [WARP.md](WARP.md) - Development guide and architecture
- [ECT_API_DOCUMENTATION.md](ECT_API_DOCUMENTATION.md) - Earthcast API reference

---

## Notes

- **Saved Locations**: Introduced in v1.7.0 - Use location aliases in any weather tool
- **Climate Normals**: Available with `include_normals=true` parameter
- **Severe Weather**: US only, use `include_severe_weather=true` in forecasts
- **Fire Weather**: US only, use `include_fire_weather=true` in current conditions
- **Timezone-Aware**: All timestamps automatically displayed in local timezone

Weather tools based on [weather-mcp](https://github.com/weather-mcp/weather-mcp) v1.7.x

Earthcast tools by Earthcast Technologies' HPC and AI team.
