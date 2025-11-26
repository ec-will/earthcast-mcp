# EarthCast MCP Server - Next Steps

This project has been successfully rebranded from weather-mcp to **earthcast-mcp** for integrating with the Earthcast Technologies API.

## ✅ Completed Setup

1. **Rebranded** package.json, LICENSE, and documentation
2. **Created** Earthcast service (`src/services/earthcast.ts`)
3. **Updated** error classes to support 'Earthcast' service
4. **Configured** environment variables (.env.example)
5. **Built** successfully with TypeScript

## 🚀 Your Next Steps

### 1. ✅ API Discovery Complete!

**See `ECT_API_DOCUMENTATION.md` for full API details.**

**Quick Summary:**
- **Base URL**: `http://ect-sandbox.wx-farms.com:8000`
- **Auth**: HTTP Basic Authentication
- **Docs**: http://ect-sandbox.wx-farms.com:8000/docs (Swagger UI)

**4 Main Endpoints:**
1. `/weather/dss/launch/gonogo` - Launch decision support
2. `/weather/query/forecast` - Latest forecast data
3. `/weather/query/request` - Query weather data
4. `/weather/product/timestamp` - Get latest timestamp

**9 Products Available:**
- lightning_density, contrails_max, contrails, ionospheric_density
- neutral_density, low-level-windshear, high-level-windshear
- turbulence_max, reflectivity_5k

### 2. Update the Earthcast Service

Edit `src/services/earthcast.ts`:
- Replace the example `getEnvironmentalData()` method with actual API endpoints
- Add methods for each API endpoint you want to expose
- Update the API URL in the `get()` calls to match real endpoints
- Adjust cache TTL values based on how often the data changes

### 3. Create Type Definitions

Create `src/types/earthcast.ts`:
```typescript
export interface EarthcastDataResponse {
  // Define the structure of API responses
}

export interface EarthcastToolArgs {
  latitude: number;
  longitude: number;
  // Other parameters
}
```

### 4. Create Handlers

Create handlers in `src/handlers/` for each MCP tool:
```typescript
// src/handlers/earthcastDataHandler.ts
import { validateLatitude, validateLongitude } from '../utils/validation.js';
import { EarthcastService } from '../services/earthcast.js';

export async function handleGetEarthcastData(
  args: unknown,
  earthcastService: EarthcastService
): Promise<{ content: { type: 'text'; text: string }[] }> {
  // Validate inputs
  // Call service
  // Format response
}
```

### 5. Register Tools in index.ts

In `src/index.ts`:
1. Import your handler
2. Add tool definition to `TOOL_DEFINITIONS` object
3. Add case to the switch statement in `CallToolRequestSchema` handler
4. Initialize and pass the `earthcastService` to your handler

### 6. Test Your Integration

```bash
# Build
npm run build

# Run in dev mode
npm run dev

# Test with Claude Code or another MCP client
```

### 7. Update Documentation

Once your tools are working:
- Update `README.md` with your tool descriptions
- Update `WARP.md` if architecture changes
- Document API requirements

## 📁 Key Files to Work With

- `src/services/earthcast.ts` - API client (start here!)
- `src/types/earthcast.ts` - Type definitions (create this)
- `src/handlers/` - Tool handlers (create new files)
- `src/index.ts` - Tool registration
- `.env.example` - Configuration documentation

## 🔧 Useful Commands

```bash
npm run build          # Compile TypeScript
npm run dev            # Run with hot reload
npm test               # Run tests (update tests as you go)
npm run test:watch     # Watch mode for testing
npx tsc --noEmit       # Type check without building
```

## 💡 Tips

1. **Start small** - Get one endpoint working first
2. **Use existing patterns** - Look at `src/services/noaa.ts` or `openmeteo.ts` for examples
3. **Validate everything** - Always use the validation utilities
4. **Cache appropriately** - Match TTL to data volatility
5. **Test as you go** - Don't wait until everything is done

## 📚 References

- **WARP.md** - Development guide for this codebase
- **Original weather-mcp** - Study the existing handlers/services for patterns
- **MCP Spec** - https://spec.modelcontextprotocol.io/

## 🎯 Quick Win

To see immediate results:
1. Find an actual API endpoint from ect-sandbox.com
2. Update the URL in `getEnvironmentalData()` method
3. Create a simple handler that calls this method
4. Register it as a tool in `index.ts`
5. Test with Claude Code

Good luck! The infrastructure is ready - now it's just about connecting to your API! 🚀
