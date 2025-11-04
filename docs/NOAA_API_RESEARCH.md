# NOAA Weather API Research

## API Base URL
`https://api.weather.gov`

## Authentication & Requirements
- **User-Agent Header Required**: Must identify your application
  - Format: `User-Agent: (myweatherapp.com, contact@myweatherapp.com)`
- **No API Key Required**: Free public access
- **Rate Limits**: Enforced limits with 5-second retry window when exceeded

## Data Formats
- Default: GeoJSON
- Also supports: JSON-LD, DWML, OXML, CAP, ATOM
- Specify format via `Accept` header

## Key Endpoints

### 1. Location to Grid Conversion
**Endpoint**: `/points/{latitude},{longitude}`

**Purpose**: Convert lat/lon to NWS grid reference and get forecast/station URLs

**Returns**:
- Grid office (WFO)
- Grid X, Y coordinates
- Forecast URL
- Hourly forecast URL
- Observation stations URL
- Forecast zone
- County
- Fire weather zone

**Example**: `GET /points/39.7456,-97.0892`

### 2. Forecast Data
**Endpoint**: `/gridpoints/{office}/{gridX},{gridY}/forecast`

**Purpose**: Get 12-hour period forecast (7-day forecast)

**Returns**:
- Temperature
- Wind speed/direction
- Short forecast description
- Detailed forecast
- Icon URL
- Precipitation probability

**Hourly Alternative**: `/gridpoints/{office}/{gridX},{gridY}/forecast/hourly`

### 3. Current Conditions
**Endpoint**: `/stations/{stationId}/observations/latest`

**Purpose**: Get most recent observation from a weather station

**Returns**:
- Temperature
- Dewpoint
- Wind speed/direction
- Barometric pressure
- Sea level pressure
- Visibility
- Precipitation
- Cloud layers
- Relative humidity

**Note**: Observations may be delayed up to 20 minutes from upstream source

### 4. Historical/Time-Series Observations
**Endpoint**: `/stations/{stationId}/observations`

**Purpose**: Get observation history for a station

**Query Parameters**:
- `start` (date-time): Beginning time
- `end` (date-time): Ending time
- `limit` (integer): Number of results (1-500 max)

**Example**: `GET /stations/KLAX/observations?start=2024-01-01T00:00:00Z&end=2024-01-07T23:59:59Z`

### 5. Find Nearest Stations
**Endpoint**: `/points/{latitude},{longitude}/stations`

**Purpose**: Get list of nearby observation stations for a location

**Returns**: Array of stations with:
- Station ID
- Name
- Time zone
- Forecast office
- County
- Elevation

**Alternative**: `/gridpoints/{wfo}/{x},{y}/stations` (for 2.5km grid area)

### 6. Weather Alerts
**Endpoint**: `/alerts/active`

**Query Parameters**:
- `area={state}`: Filter by state (e.g., CA)
- `point={lat},{lon}`: Filter by coordinates
- `zone={zoneId}`: Filter by zone

**Returns**: Active weather alerts, warnings, watches

## Typical Workflow for Our Tools

### Get Forecast
1. `/points/{lat},{lon}` → Get grid reference
2. `/gridpoints/{office}/{gridX},{gridY}/forecast` → Get forecast data

### Get Current Conditions
1. `/points/{lat},{lon}` → Get station URLs
2. `/stations/{stationId}/observations/latest` → Get current observation

### Get Historical Data
1. `/points/{lat},{lon}/stations` → Find nearest station(s)
2. `/stations/{stationId}/observations?start={date}&end={date}` → Get observations

## Important Notes

### Limitations
- Observations are delayed up to 20 minutes
- Historical data via observations API is limited to what stations have recorded
- No guarantee all stations have complete historical records
- For extensive historical data, may need NCDC (National Climatic Data Center) API

### Best Practices
- Always include descriptive User-Agent
- Cache forecast data appropriately (forecasts update periodically)
- Handle missing/null data gracefully (not all observations have all fields)
- Implement retry logic for rate limit errors (5-second backoff)

### Data Units
All quantitative values include `unitCode` following the format:
- Temperature: `wmoUnit:degC` or `wmoUnit:degF`
- Wind speed: `wmoUnit:km_h-1` or `wmoUnit:m_s-1`
- Pressure: `wmoUnit:Pa`
- Distance: `wmoUnit:m`

Convert as needed for user presentation.

## Implementation Priorities

### Phase 1: Core Functionality
1. ✅ Points endpoint - location to grid conversion
2. ✅ Forecast endpoint - 7-day forecast
3. ✅ Latest observation - current conditions
4. ✅ Station search - find nearest stations

### Phase 2: Historical Data
1. ✅ Observations with time range - recent history
2. ⚠️ Note limitations in documentation
3. 🔮 Future: Consider NCDC API for older data

### Phase 3: Enhanced Features
1. Weather alerts
2. Hourly forecasts
3. Extended forecasts
4. Marine/aviation data (if needed)
