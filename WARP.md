# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Earthcast MCP Server** - A Model Context Protocol server combining global weather data (NOAA, Open-Meteo) with specialized environmental products from Earthcast Technologies API. Built with TypeScript and Node.js, enabling AI assistants to access comprehensive weather forecasts, current conditions, and advanced environmental data for launch operations, aviation planning, and space weather monitoring.

- **Language**: TypeScript (Node.js >= 18.0.0)
- **MCP SDK**: @modelcontextprotocol/sdk v1.21.1
- **Test Framework**: Vitest (31 test files)
- **Package Manager**: npm
- **Version**: 0.1.0

## Common Development Commands

### Build & Run
```bash
npm run build        # Compile TypeScript to dist/
npm run dev          # Run in development mode with tsx (hot reload)
npm start           # Run compiled dist/index.js
```

### Testing
```bash
npm test                    # Run all tests (31 test files)
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
npm run test:ui            # Interactive test UI
```

### Maintenance
```bash
npm run audit              # Check for dependency vulnerabilities
npm run audit:fix          # Automatically fix vulnerabilities
```

## Architecture

### Handler-Service Pattern

**Structure**: Each MCP tool → handler function → service layer → external API

```
User Query (MCP Tool Call)
    ↓
Handler (src/handlers/*.ts) - validates input, orchestrates logic
    ↓
Service (src/services/*.ts) - handles API communication, retry logic
    ↓
External API (Earthcast Technologies, NOAA, Open-Meteo, etc.)
```

**Key Principle**: Handlers orchestrate business logic; services abstract API communication. Keep them separate.

### Critical Components

**Validation First**: All user inputs MUST be validated using `src/utils/validation.ts` functions before processing. Never trust raw input.

**Error Hierarchy**: Use custom error classes from `src/errors/ApiError.ts`:
- `InvalidLocationError` - Invalid coordinates/location
- `RateLimitError` - API rate limit exceeded  
- `ServiceUnavailableError` - API temporarily down
- All errors are sanitized via `formatErrorForUser()` before returning to users

**Caching Strategy**: LRU cache with TTL in `src/utils/cache.ts`:
- Grid coordinates: Infinite (never change)
- Forecasts: 2 hours (update ~hourly)
- Current conditions: 15 minutes (observation frequency)
- Historical data (>1 day old): Infinite (finalized)
- Cache stats visible via `check_service_status` tool

**Logging**: Use structured logging from `src/utils/logger.js`:
- All logs go to `stderr` (MCP protocol requirement - NEVER use `stdout`)
- Security events: `logger.warn('message', { securityEvent: true })`
- Never use `console.log()` - always use `logger` methods

### Service Layer Architecture

Each external API has a dedicated service class with:
1. **Retry logic**: Exponential backoff with jitter for transient failures
2. **Caching**: Built-in cache with appropriate TTL per data type
3. **Error handling**: Converts API errors to custom error classes
4. **Type safety**: Proper TypeScript interfaces for all responses

### Location Resolution System (v1.7.0)

**Saved Locations**: Users can save locations with aliases ("home", "work") in `~/.weather-mcp/locations.json`

**Resolution Flow**:
```typescript
// Tools accept either coordinates OR location_name
{ latitude: 40.7, longitude: -74.0 }  // Direct coordinates
{ location_name: "home" }              // Saved location alias

// Use resolveLocation() utility to normalize both to coordinates
import { resolveLocation } from '../utils/locationResolver.js';
const { latitude, longitude } = resolveLocation(args, locationStore);
```

**Adding location_name support to a tool**:
1. Add `location_name?: string` to Args interface
2. Import `resolveLocation` and pass `locationStore` to handler
3. Call `resolveLocation(args, locationStore)` early in handler
4. Update tool schema to make `latitude`/`longitude` optional (not in `required` array)
5. Add `location_name` to tool schema properties

## Code Style Conventions

### TypeScript Strict Mode

**All strict flags enabled** - see `tsconfig.json`:
- No `any` types (use proper types or `unknown` with validation)
- All functions must return on all code paths (`noImplicitReturns`)
- No unused variables/parameters (`noUnusedLocals`, `noUnusedParameters`)
- Explicit nullability checks (`strictNullChecks`)

### Testing Requirements

- **Coverage Target**: 100% on critical utilities (cache, validation, units, errors)
- **Performance**: All tests complete in < 2 seconds
- **No Flakiness**: Tests must be deterministic, no reliance on timing/network
- **Test Organization**: 
  - `tests/unit/` - Fast, no I/O (965 tests)
  - `tests/integration/` - With API calls (77 tests)

### Security Boundaries

**Input Validation** (Defense in Depth):
```typescript
// ALWAYS validate coordinates
validateLatitude(latitude);   // Throws InvalidLocationError if invalid
validateLongitude(longitude);
```

**Bounds Checking** - Prevent resource exhaustion:
```typescript
// Limit array processing to prevent DoS
const maxEntries = 1000;
if (array.length > maxEntries) {
  logger.warn('Array exceeds max entries', { 
    length: array.length, 
    securityEvent: true 
  });
  array = array.slice(0, maxEntries);
}
```

**No Secrets in Code**:
- Most weather APIs are free and require no keys (NOAA, Open-Meteo, Nominatim)
- Earthcast Technologies API requires HTTP Basic Auth (username/password)
- Optional NCEI API token configured via environment variable only
- All credentials MUST be set via environment variables only
- Never commit `.env` files or credentials

## Adding New Features

### Adding a New MCP Tool

1. **Define Types** (`src/types/*.ts`):
   ```typescript
   export interface MyFeatureArgs {
     latitude: number;
     longitude: number;
     // ... other parameters
   }
   ```

2. **Create Handler** (`src/handlers/myFeatureHandler.ts`):
   ```typescript
   import { validateLatitude, validateLongitude } from '../utils/validation.js';
   
   export async function handleMyFeature(args: unknown): Promise<...> {
     const validatedArgs = args as MyFeatureArgs;
     validateLatitude(validatedArgs.latitude);
     validateLongitude(validatedArgs.longitude);
     // ... business logic
   }
   ```

3. **Add Service Methods** (if calling new API - `src/services/*.ts`):
   - Implement retry logic with exponential backoff
   - Add caching with appropriate TTL
   - Use custom error classes

4. **Register Tool** (`src/index.ts`):
   - Add to `TOOL_DEFINITIONS` object
   - Add case to `CallToolRequestSchema` handler
   - Add to tool configuration (`toolConfig`)

5. **Write Tests**:
   - Unit tests in `tests/unit/` for validation, data transformation
   - Integration tests in `tests/integration/` if calling external APIs

6. **Update Documentation**:
   - `README.md` - User-facing documentation
   - `CHANGELOG.md` - Version history
   - `CLAUDE.md` - AI assistant guide (architecture notes)

### Earthcast-Specific Patterns

**Two Main Handlers**:
1. `earthcastDataHandler.ts` - General data queries (`earthcast_query_data` tool)
   - Flexible spatial/temporal/altitude filtering
   - Returns raw geospatial data with grid values
   - Supports multiple products in single request

2. `earthcastGoNoGoHandler.ts` - Launch decision support (`earthcast_gonogo_decision` tool)
   - Threshold-based evaluation for launch safety
   - Accepts user-defined thresholds for each weather product
   - Returns GO/NO-GO decision with justification

**Available Products**:
- `neutral_density` - Atmospheric density at 100-1000km altitude
- `ionospheric_density` - VTEC for GPS/radio propagation
- `lightning_density` - 30-min average lightning activity
- `low-level-windshear` - Winds at 850mb (~5,000 ft)
- `high-level-windshear` - Winds at 300mb (~30,000 ft)
- `turbulence_max` - Maximum turbulence composite
- `contrails_max` - Maximum contrail potential
- `reflectivity_5k` - Radar reflectivity at 5km resolution

**Service Implementation** (`src/services/earthcast.ts`):
- HTTP Basic Auth for authentication
- Separate caching TTLs: 5 min (decision support), 1 hour (data queries)
- 4 endpoints: `/weather/dss/launch/gonogo`, `/weather/query/request`, `/weather/query/forecast`, `/weather/product/timestamp`

### Adding External API Integration

Follow pattern from existing services (`src/services/noaa.ts`, `openmeteo.ts`, `earthcast.ts`):

```typescript
export class MyAPIService {
  private cache: Cache;
  
  constructor() {
    this.cache = new Cache(CacheConfig.maxSize);
  }
  
  async fetchData(params: Params): Promise<Response> {
    // 1. Check cache
    const cacheKey = Cache.generateKey('my_api', ...params);
    const cached = this.cache.get<Response>(cacheKey);
    if (cached) return cached;
    
    // 2. Make API call with retry logic
    const data = await this.retryWithBackoff(async () => {
      const response = await axios.get(url, { params });
      return response.data;
    });
    
    // 3. Cache with appropriate TTL
    this.cache.set(cacheKey, data, MY_API_TTL);
    return data;
  }
  
  private async retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
    // Exponential backoff with jitter (see existing services for pattern)
  }
}
```

## Tool Configuration System (v1.4.0)

Control which MCP tools are exposed via `ENABLED_TOOLS` environment variable:

**Presets**:
- `basic` (default): Essential weather (9 tools) - forecast, current, alerts, location, status, saved locations (4 tools)
- `standard`: Basic + historical_weather
- `full`: Standard + air_quality
- `all`: All 17 tools (15 weather tools + 2 Earthcast tools)

**Earthcast Tools** (not in presets by default):
- `earthcast_query_data` - Query specialized environmental data products
- `earthcast_gonogo_decision` - Launch decision support system

**Configuration** (in `.env` or MCP client config):
```bash
ENABLED_TOOLS=full                                    # Use preset
ENABLED_TOOLS=forecast,current,alerts,air_quality    # Specific tools
ENABLED_TOOLS=basic,+historical,+air_quality         # Add to preset
ENABLED_TOOLS=all,-marine                            # Remove from preset
```

## Common Pitfalls

1. **Don't log to stdout**: MCP protocol uses stdio for communication. All logging MUST go to stderr via `logger`.

2. **Don't skip validation**: Always validate user inputs even if TypeScript types look correct. Runtime validation catches NaN, Infinity, out-of-range values.

3. **Don't ignore cache TTLs**: Cache durations in `src/config/cache.ts` are optimized for data volatility. Don't arbitrarily change them.

4. **Don't use console.log**: Always use `logger.info()`, `logger.warn()`, etc. for proper structured logging.

5. **Don't hardcode coordinates/locations in tests**: Use well-known test locations (NYC: 40.7128, -74.0060) but make them clearly identifiable as test data.

6. **Don't make assumptions about array lengths**: Always apply bounds checking when processing arrays from external APIs.

## Environment Variables

All variables validated with bounds checking in `src/config/cache.ts`:

```bash
# Earthcast Technologies API (Required for Earthcast tools)
ECT_API_URL=http://ect-sandbox.com:8000     # API base URL (default: sandbox)
ECT_API_USERNAME=your_username              # HTTP Basic Auth username
ECT_API_PASSWORD=your_password              # HTTP Basic Auth password

# Cache Configuration
CACHE_ENABLED=true                    # Enable/disable caching (default: true)
CACHE_MAX_SIZE=1000                   # Max cache entries (100-10000, default: 1000)

# API Configuration  
API_TIMEOUT_MS=30000                  # Request timeout (5000-120000ms, default: 30000)

# Logging
LOG_LEVEL=1                           # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR (default: 1)

# Optional: Climate Normals (falls back to Open-Meteo if not set)
NCEI_TOKEN=your_token_here           # Free token from https://www.ncdc.noaa.gov/cdo-web/token

# Tool Selection
ENABLED_TOOLS=basic                   # Which tools to expose (default: basic)
# Add Earthcast tools: ENABLED_TOOLS=basic,+earthcast_query_data,+earthcast_gonogo_decision
```

## Debugging Tips

```bash
# Enable debug logging
LOG_LEVEL=0 npm run dev

# Run single test file
npx vitest run tests/unit/cache.test.ts

# Type check without building
npx tsc --noEmit

# Watch mode with specific test pattern
npx vitest watch --grep "validation"
```

## References

- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **Earthcast Technologies API**: http://ect-sandbox.com:8000/docs (Swagger UI)
- **NOAA API Documentation**: https://www.weather.gov/documentation/services-web-api
- **Open-Meteo API Documentation**: https://open-meteo.com/en/docs
- **ECT_API_DOCUMENTATION.md**: Earthcast Technologies API endpoint reference
- **CLAUDE.md**: Comprehensive AI assistant development guide with architecture details
- **README.md**: User-facing documentation and installation instructions
