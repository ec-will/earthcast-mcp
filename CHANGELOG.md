# Changelog

All notable changes to the Earthcast MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-27

### Added - Earthcast Technologies Integration

#### New MCP Tools
- **`earthcast_gonogo_decision`** - Launch decision support with customizable threshold evaluation
  - Multi-product weather assessment (lightning, windshear, turbulence, radar, contrails)
  - GO/NO-GO determination with detailed product-by-product analysis
  - Configurable safety thresholds per product
  - Spatial filtering with radius or bounding box
  - Optional forecast vs observed data selection
  - Formatted output with safety recommendations

- **`earthcast_query_data`** - Advanced environmental data query tool
  - Access to 9 specialized weather products
  - Altitude-dependent data (neutral atmospheric density 100-1000km)
  - Multi-product queries with single API call
  - Time range filtering and spatial filtering
  - Comprehensive data formatting with statistics

#### New Weather Products
- **Neutral Atmospheric Density** - Satellite drag calculations (100-1000km altitude)
- **Ionospheric Density (VTEC)** - Space weather and GPS/radio propagation impacts
- **Lightning Density** - 30-minute average lightning activity
- **Contrails Max** - Maximum contrail formation potential (composite)
- **Contrails** - Altitude-specific contrail potential (100+ levels)
- **Low-Level Windshear** - 850mb (~5,000 ft) wind conditions
- **High-Level Windshear** - 300mb (~30,000 ft) wind conditions
- **Turbulence Max** - Maximum turbulence composite
- **Reflectivity 5K** - Global radar reflectivity at 5km resolution

#### Infrastructure
- New `EarthcastService` class with retry logic and caching
- HTTP Basic Authentication support for Earthcast API
- Intelligent caching with product-specific TTLs (5min-2hr)
- Complete TypeScript type definitions for all API endpoints
- Error handling with custom error classes
- Tool configuration system integration

### Changed
- Project renamed from `weather-mcp` to `earthcast-mcp`
- Package name updated to `earthcast-mcp`
- Server name changed to `earthcast-mcp` in MCP protocol
- Default tool preset remains `basic` (9 tools)
- Tool enabling now supports Earthcast tools via `+earthcast_query_data,+earthcast_gonogo_decision`

### Documentation
- Comprehensive README.md with multi-platform installation guides
  - Warp, Claude Desktop, Claude Code, Cline, Cursor, Grok (xAI)
- Complete API documentation in `ECT_API_DOCUMENTATION.md`
- Development guide in `WARP.md` with Earthcast patterns
- Example queries for launch operations, aviation, and space weather

### Technical Details
- Built on weather-mcp v1.7.x foundation
- Maintains all 15 original weather tools
- 11 total tools when Earthcast tools enabled (9 basic + 2 Earthcast)
- Node.js >= 18.0.0 required
- TypeScript 5.9.3
- MCP SDK 1.21.1

### API Requirements
- **Earthcast API**: Requires username/password credentials
- **Weather APIs**: No authentication required (NOAA, Open-Meteo, etc.)

### Environment Variables
```bash
ECT_API_URL          # Earthcast API endpoint (default: sandbox)
ECT_API_USERNAME     # Earthcast API username (required)
ECT_API_PASSWORD     # Earthcast API password (required)
ENABLED_TOOLS        # Tool selection (default: basic)
```

---

## [Pre-0.1.0] - Weather MCP Foundation

This project is based on [weather-mcp](https://github.com/weather-mcp/weather-mcp) which provides the foundation with 15 weather tools:

### Inherited Features
- Global weather forecasts (NOAA + Open-Meteo)
- Current weather conditions
- Weather alerts (US)
- Historical weather data (1940-present)
- Location search and saved locations
- Air quality monitoring
- Marine conditions
- Lightning detection
- River conditions
- Wildfire tracking
- Weather imagery
- Intelligent caching system
- Multi-source fallback
- Complete error handling

---

## Release Notes

### Version 0.1.0 Highlights

This is the initial release of Earthcast MCP, integrating specialized environmental and weather data from Earthcast Technologies with the proven weather-mcp foundation.

**Key Capabilities:**
- 🚀 Launch decision support for space operations
- ✈️ Advanced aviation weather (contrails, windshear, turbulence)
- 🛰️ Space weather monitoring (ionospheric density, neutral atmosphere)
- 🌍 Complete global weather coverage (inherited from weather-mcp)

**Use Cases:**
- Launch operations at Cape Canaveral, Vandenberg, etc.
- Aviation flight planning with high-altitude data
- Satellite operations and orbital mechanics
- DoD weather intelligence and planning
- Research and environmental monitoring

**Deployment Ready:**
- Multi-platform support (6+ AI assistants)
- Production-ready architecture
- Comprehensive error handling
- Intelligent caching and retry logic
- Full TypeScript type safety

---

## Links

- [GitHub Repository](https://github.com/your-org/earthcast-mcp)
- [npm Package](https://www.npmjs.com/package/earthcast-mcp)
- [MCP Registry](https://registry.modelcontextprotocol.io)
- [Earthcast Technologies API](http://ect-api.com)
- [Weather MCP (Base Project)](https://github.com/weather-mcp/weather-mcp)

---

## Attribution

Based on [weather-mcp](https://github.com/weather-mcp/weather-mcp) by the Weather MCP Server Contributors.

Earthcast Technologies integration by Will.

Licensed under MIT License.
