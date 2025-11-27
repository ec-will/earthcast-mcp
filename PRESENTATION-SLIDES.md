---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section {
    font-size: 24px;
  }
  h1 {
    color: #1e40af;
    font-size: 48px;
  }
  h2 {
    color: #1e40af;
  }
  h3 {
    color: #3b82f6;
    font-size: 28px;
  }
  code {
    background-color: #f3f4f6;
  }
  pre {
    background-color: #1f2937;
    color: #f9fafb;
  }
---

<!-- _class: lead -->

# Earthcast MCP
**Environmental & Weather Data for AI Systems**

### What It Is
Model Context Protocol (MCP) server combining comprehensive global weather data with specialized environmental products from Earthcast Technologies API

---

## Overview

### Key Stats
- **17 Total Tools**: 15 weather tools + 2 Earthcast tools
- **9 New Products**: Specialized environmental and launch decision data
- **6+ Platforms**: Warp, Claude Desktop, Claude Code, Cline, Cursor, Grok (xAI)
- **Global Coverage**: Weather data worldwide + specialized US launch operations

### Status
✅ **Production Ready** - All tools tested and documented  
🎯 **DoD Ready** - Grok (xAI) support for defense deployment

---

## Core Capabilities

### 🚀 Launch Decision Support
- **GO/NO-GO Evaluations** with customizable safety thresholds
- Real-time assessment of lightning, windshear, turbulence, radar
- Comprehensive launch weather analysis for Cape Canaveral, Vandenberg, etc.

### 🛰️ Space Weather & Aviation
- **Neutral Atmospheric Density** (100-1000km altitude) - Satellite drag calculations
- **Ionospheric Density (VTEC)** - GPS/radio propagation, space weather
- **Contrail Formation** - Aviation condensation trail prediction
- **Multi-Level Windshear** - Low (5,000 ft) and high-altitude (30,000 ft)
- **Turbulence Forecasting** - Flight safety and passenger comfort

---

## Complete Weather Coverage

### 🌍 Global Weather Data
- Global forecasts (1-16 days, NOAA + Open-Meteo)
- Current conditions, alerts, historical data (1940-present)
- Air quality, marine conditions, lightning, rivers, wildfires
- Location services with saved favorites

---

## Technical Architecture

### Integration Pattern
```
AI Assistant (Warp/Claude/Grok)
    ↓
MCP Protocol (stdio communication)
    ↓
Earthcast MCP Server
    ├── Earthcast Technologies API ─→ Specialized environmental data
    ├── NOAA ─────────────────────→ US weather (detailed forecasts, alerts)
    ├── Open-Meteo ───────────────→ Global weather & historical (1940-present)
    ├── Nominatim (OpenStreetMap) ─→ Global geocoding & location search
    ├── Blitzortung.org ───────────→ Real-time lightning detection (global)
    ├── RainViewer ────────────────→ Precipitation radar imagery (global)
    ├── NIFC ──────────────────────→ Active wildfire perimeters (US)
    └── USGS ──────────────────────→ River conditions & flood status (US)
```

---

## API Details

**Core Weather Data**
- **NOAA** (National Oceanic & Atmospheric Administration) - Official US weather service, no API key
- **Open-Meteo** - Global forecasts + 85 years of historical data (ERA5 reanalysis), no API key

**Location Services**
- **Nominatim** - OpenStreetMap geocoding with excellent coverage of small towns/villages worldwide

**Specialized Services**
- **Blitzortung.org** - Community-operated global lightning network via MQTT, real-time strike data
- **RainViewer** - Global precipitation radar with tile-based imagery system
- **NIFC** (National Interagency Fire Center) - ArcGIS service with current wildfire perimeters
- **USGS** - River gauges and water levels for flood monitoring

---

## Key Features

- **Intelligent Caching** - 50-80% fewer API calls, <10ms cached responses
- **Retry Logic** - Exponential backoff with jitter for reliability
- **Multi-Source Fallback** - Automatic selection of best data source
- **Type Safety** - Full TypeScript implementation
- **Production Ready** - Comprehensive error handling and logging

### Installation (One Command)
```bash
npx earthcast-mcp
```

No installation needed - works immediately with any MCP-compatible AI assistant

---

## Real-World Applications

### Launch Operations
**Query:** *"Is it safe to launch from Cape Canaveral today?"*

**Result:**
- ✅ Lightning: 0.0 (threshold: 0.5) - **GO**
- ✅ Windshear: 6.17 m/s (threshold: 15.0) - **GO**
- **OVERALL: GO FOR LAUNCH** 🚀

---

## Aviation Planning

**Query:** *"Compare surface winds with upper-level conditions at Houston"*

**Result:**
- Low-level windshear: 1.34 m/s (very calm)
- High-level windshear: 23.71 m/s (significant jet stream)
- Turbulence: Moderate (2.74)
- Contrail potential: 40.72 (moderate to high)

---

## Space Weather Monitoring

**Query:** *"Get ionospheric density and neutral atmospheric density at 400km"*

**Result:**
- Ionospheric density: 12.38 TECU (moderate activity)
- Neutral density (100km): 3.54×10⁻⁷ kg/m³
- Impact analysis for satellite operations

---

## DoD Weather Intelligence

**Query:** *"Combined weather and environmental analysis for operational planning"*

**Result:** NOAA standard weather + Earthcast specialized products + launch criteria

---

## Historical & Archive Data

# Comprehensive Historical Weather Archive

### Data Coverage
**Global weather data from 1940 to present** - 85+ years of historical weather records

---

## Recent Data (Last 7 Days) - US Only

- **Source:** NOAA Real-Time API
- **Resolution:** Detailed hourly observations from weather stations
- **Data Points:** Temperature, conditions, wind speed/direction, humidity, pressure, precipitation
- **Reliability:** High accuracy from official weather station networks
- **Use Cases:** Recent event analysis, trend verification, short-term pattern analysis

---

## Archive Data (1940-Present) - Global

- **Source:** Open-Meteo Historical Weather API (ERA5 reanalysis)
- **Coverage:** Worldwide - any location on Earth
- **Resolution:** 9-25km grid, hourly or daily summaries
- **Data Points:** Temperature, precipitation, wind, humidity, pressure, cloud cover, snow depth
- **Time Ranges:** 
  - Hourly data for ranges up to 31 days
  - Daily summaries for longer periods
- **Data Quality:** High-resolution reanalysis data validated against observations
- **Latency:** 5-day delay for most recent data (finalization period)

---

## Real-World Applications

**Climate Research & Analysis**
- Long-term temperature trends and climate change studies
- Historical extreme weather events (hurricanes, floods, droughts)
- Seasonal pattern analysis across decades
- Climate model validation

**Operational Planning**
- Launch site historical weather conditions ("What was the weather on this date last year?")
- Site selection analysis ("Average wind conditions in January for the past 10 years")
- Risk assessment for operations
- Insurance and liability analysis

---

## DoD Mission Planning

- Historical weather conditions for training scenarios
- Environmental baseline assessments for new installations
- Operational weather pattern analysis
- Post-mission weather reconstruction

### Technical Details
- **Caching:** Archived data (>1 day old) cached indefinitely (never changes)
- **Performance:** Fast retrieval for any date in 85+ year archive
- **No Authentication Required:** Free access via Open-Meteo API
- **Global Coverage:** Works for any coordinate pair worldwide

---

## Query Examples

```
"What was the weather in Paris on January 15, 2024?"
→ Returns: Temperature, precipitation, wind, cloud cover for that specific day

"Show me weather data for Tokyo from Jan 1 to Dec 31, 2020"
→ Returns: Full year of daily summaries with temperature ranges, precipitation totals

"What was the weather like at Cape Canaveral 3 days ago?"
→ Returns: Detailed hourly observations from NOAA (US location)

"Average February conditions at 45°N, 120°W for 2015-2024"
→ Returns: 10-year February weather climatology for that location
```

---

<!-- _class: lead -->

## Summary

### Earthcast MCP delivers:
1. ✅ **Launch decision support** for space operations
2. ✅ **Advanced environmental data** for aviation and satellites
3. ✅ **Complete weather coverage** from proven foundation
4. ✅ **Multi-platform support** including DoD-ready Grok integration
5. ✅ **Production architecture** with caching, retry logic, error handling

---

## Ready for Deployment

### Ready for deployment across:
- Defense operations (DoD via Grok)
- Commercial space launch operations
- Aviation weather planning
- Research and environmental monitoring
- AI-assisted weather intelligence

**Built on proven earthcast-mcp foundation + specialized Earthcast Technologies integration**

---

<!-- _class: lead -->

# Questions?

*For more information, see README.md in the project repository*
