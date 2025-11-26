# Earthcast Technologies API Documentation

## Base URLs

- **Sandbox**: `http://ect-sandbox.wx-farms.com:8000`
- **Production** (coming): `https://ect-api.com` or `https://ect-api.com:8000`

## Authentication

The API uses HTTP Basic Authentication (check with team for credentials).

## Interactive Documentation

- **Swagger UI**: `http://ect-sandbox.wx-farms.com:8000/docs`
- **OpenAPI JSON**: `http://ect-sandbox.wx-farms.com:8000/openapi.json`

## Available Products

The following weather products are available:

| Product Key | Description | Altitude Support |
|-------------|-------------|------------------|
| `lightning_density` | Lightning density (30-min average) | N/A |
| `contrails_max` | Maximum contrail potential (composite) | Multi-level |
| `contrails` | Contrail potential by altitude | Multi-level (100+ levels) |
| `ionospheric_density` | Ionospheric (VTEC) density | N/A |
| `neutral_density` | Neutral atmospheric density | 100km - 1000km |
| `low-level-windshear` | Winds at 850mb (~5,000 ft) | 850mb |
| `high-level-windshear` | Winds at 300mb (~30,000 ft) | 300mb |
| `turbulence_max` | Maximum turbulence (composite) | Multi-level |
| `reflectivity_5k` | Global radar reflectivity @ 5km resolution | N/A |

---

## API Endpoints

### 1. Launch Go/No-Go Decision Support

**GET** `/weather/dss/launch/gonogo`

Retrieve go/no-go predictions based on one or more weather conditions with threshold checks.

**Tags**: DSS Services

**Parameters**:
- `products` (required, array): One or more product keys (comma-separated)
  - Example: `reflectivity_5k,low-level-windshear`
- `site_description` (optional, string): Launch site description
  - Example: `Cape Canaveral LC-39A`
- **Spatial filtering** (choose one):
  - `lat` + `lon` + `radius`: Center point and radius in km
  - `bbox`: Bounding box as `west,south,east,north`
- **Altitude filtering** (optional):
  - `alt`: Single altitude (km)
  - `alt_min` + `alt_max`: Altitude range (km)
  - `alts`: Comma-separated list of specific altitudes
- **Time selection** (optional):
  - `date`: ISO 8601 timestamp (past, present, or future)
    - Example: `2025-05-26T12:00:00Z`
- **Resolution** (optional):
  - `width`: Output width in pixels (default: 100)
  - `height`: Output height in pixels (default: auto)

**Response**: `GoNoGoResponse` with threshold evaluation

**Example**:
```
GET /weather/dss/launch/gonogo?products=reflectivity_5k,low-level-windshear&lat=28.6084&lon=-80.6043&site_description=Cape%20Canaveral%20LC-39A
```

---

### 2. Get Latest Forecast Data

**GET** `/weather/query/forecast`

Retrieve the latest forecasted geospatial weather data for a single product.

**Tags**: Data Services

**Parameters**:
- `product` (required, string): Single product key
  - Example: `neutral_density`
- **Spatial filtering** (optional):
  - `lat` + `lon` + `radius`: Center point and radius in km
  - `bbox`: Bounding box as `west,south,east,north`
- **Altitude filtering** (optional):
  - `alt`: Single altitude (km)
  - `alt_min` + `alt_max`: Altitude range (km)
  - `alts`: Comma-separated list of specific altitudes
- **Resolution** (optional):
  - `width`: Output width in pixels (default: 100)
  - `height`: Output height in pixels (default: auto)

**Response**: `GeodataResponse` with forecasted data

**Example**:
```
GET /weather/query/forecast?product=neutral_density&alt=400&bbox=-180,-90,180,90&width=500
```

---

### 3. Query Weather Data

**GET** `/weather/query/request`

Retrieve geospatial data for one or more weather products with flexible filtering.

**Tags**: Data Services

**Parameters**:
- `products` (required, array): One or more product keys (comma-separated)
  - Example: `neutral_density,turbulence_max`
- **Time selection** (optional):
  - `date`: Single ISO 8601 timestamp
  - `date_start` + `date_end`: Time range
- **Spatial filtering** (optional):
  - `lat` + `lon` + `radius`: Center point and radius in km
  - `bbox`: Bounding box as `west,south,east,north`
- **Altitude filtering** (optional):
  - `alt`: Single altitude (km)
  - `alt_min` + `alt_max`: Altitude range (km)
  - `alts`: Comma-separated list of specific altitudes
- **Resolution** (optional):
  - `width`: Output width in pixels (default: 100)
  - `height`: Output height in pixels (default: auto)

**Response**: `GeodataResponse` with requested data

**Example**:
```
GET /weather/query/request?products=neutral_density,turbulence_max&date=2025-05-26T12:00:00Z&bbox=-180,-90,180,90&width=500
```

---

### 4. Get Product Timestamp

**GET** `/weather/product/timestamp`

Retrieve the most recent data timestamp for a specified product.

**Tags**: Data Services

**Parameters**:
- `product` (required, string): Product key to query
  - Example: `lightning_density`

**Response**: Latest timestamp for the product

**Example**:
```
GET /weather/product/timestamp?product=lightning_density
```

---

## Response Models

### GeodataResponse

Contains geospatial weather data in various formats:

```json
{
  "data": {
    "raster": "base64_encoded_geotiff_data",
    "metadata": {
      "bounds": [-180, -90, 180, 90],
      "resolution": [0.1, 0.1],
      "crs": "EPSG:4326",
      "timestamp": "2025-05-26T12:00:00Z"
    }
  },
  "products": ["neutral_density"],
  "timestamp": "2025-05-26T12:00:00Z"
}
```

### GoNoGoResponse

Decision support evaluation:

```json
{
  "site": "Cape Canaveral LC-39A",
  "timestamp": "2025-05-26T12:00:00Z",
  "decision": "GO" | "NO-GO",
  "products": [
    {
      "product": "reflectivity_5k",
      "status": "GO",
      "threshold": 40,
      "max_value": 35,
      "message": "Reflectivity within acceptable limits"
    }
  ],
  "overall_status": "GO",
  "confidence": "HIGH"
}
```

---

## Common Query Patterns

### 1. Point Query (specific location)
```
?lat=28.6084&lon=-80.6043&radius=50
```

### 2. Bounding Box Query (area)
```
?bbox=-82,-28,-78,32
```

### 3. Altitude Range Query
```
?alt_min=200&alt_max=600
```

### 4. Specific Altitudes
```
?alts=200,400,600,800
```

### 5. Time Range Query
```
?date_start=2025-05-26T00:00:00Z&date_end=2025-05-26T23:59:59Z
```

### 6. High-Resolution Output
```
?width=1000&height=800
```

---

## Error Responses

### 400 Bad Request
Invalid request parameters

### 404 Not Found
Requested resource or product not available

### 500 Internal Server Error
Server-side processing error

---

## Rate Limiting

The API implements rate limiting based on client IP address. Specific limits TBD.

---

## Data Formats

### Spatial Data
- **Format**: GeoTIFF (base64 encoded)
- **CRS**: EPSG:4326 (WGS84)
- **Resolution**: Configurable via `width` and `height` parameters

### Timestamps
- **Format**: ISO 8601 UTC
- **Example**: `2025-05-26T12:00:00Z`

### Coordinates
- **Latitude**: -90 to 90 (decimal degrees)
- **Longitude**: -180 to 180 (decimal degrees)
- **Altitude**: Kilometers above sea level

---

## Additional Services

### GeoServer (WMS)
- **URL**: `http://ect-sandbox.com:8080/geoserver/earthcast/wms`
- **Purpose**: Web Map Service for tile-based visualization
- **Workspace**: `earthcast`
- **GetCapabilities**: `http://ect-sandbox.com:8080/geoserver/earthcast/wms?service=WMS&version=1.1.0&request=GetCapabilities`

**100+ Available WMS Layers** including:
- Contrails (multiple altitude levels: 100MB-500MB)
- Neutral Density (100-1000km altitude)
- Turbulence (GTGN, maxcomp, multiple levels)
- Reflectivity (MRMS, composite, various resolutions)
- Lightning density
- Wind speed (isobaric levels: 300MB, 500MB, 700MB, 850MB)
- Cloud tops, visibility, hail, echo tops
- VTEC (ionospheric)
- Wave height
- And many more...

### Layer Timestamp Service
- **URL**: `http://ect-sandbox.com:3674/ect/layers/{layer}/timestamp`
- **Purpose**: Get latest timestamp for visualization layers
- **Example**: `http://ect-sandbox.com:3674/ect/layers/lightning_density/timestamp`
- **Response**: `{"timestamp": "2025-11-26T12:00:00Z"}` or `{"timestamp": "[not available]"}``

---

## Integration Notes

1. **Authentication**: Implement HTTP Basic Auth in your API client
2. **Caching**: Layer timestamps change infrequently - cache them appropriately
3. **Forecast vs Current**: Use `/weather/query/forecast` for future data, `/weather/query/request` for current/historical
4. **Altitude Units**: All altitudes are in kilometers
5. **Coordinate System**: Always use EPSG:4326 (WGS84) lat/lon
6. **Data Size**: Use `width`/`height` parameters to control output size and reduce bandwidth

---

## Next Steps for MCP Integration

1. **Create Type Definitions** (`src/types/earthcast.ts`)
2. **Implement Service Methods** in `src/services/earthcast.ts`:
   - `getGoNoGoDecision()`
   - `getForecastData()`
   - `queryWeatherData()`
   - `getProductTimestamp()`
3. **Create Handlers** for each endpoint
4. **Register Tools** in `src/index.ts`
5. **Add Authentication** via environment variable

---

**Last Updated**: November 26, 2024
**API Version**: 0.1.0
**Contact**: Earthcast Technologies
