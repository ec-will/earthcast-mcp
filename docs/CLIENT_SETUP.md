# Client Setup Guide

This guide covers how to set up Earthcast MCP with various AI assistants and code editors that support the Model Context Protocol (MCP).

## Prerequisites

- **Node.js 18 or higher** installed
- Earthcast API credentials (for Earthcast tools)

## Installation

Clone the repository and build:

```bash
git clone https://github.com/ec-will/earthcast-mcp.git
cd earthcast-mcp
npm install
npm run build
```

Note the absolute path to your `earthcast-mcp/dist/index.js` file for configuration below.

---

## Claude Desktop

**Platform:** macOS, Windows, Linux

### Configuration File Location

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### Setup

1. Open Claude Desktop Settings (Claude > Settings...)
2. Go to the **Developer** tab
3. Click **Edit Config** to open the configuration file
4. Add the earthcast server configuration:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "node",
      "args": ["/path/to/earthcast-mcp/dist/index.js"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password"
      }
    }
  }
}
```

5. Save the file and **restart Claude Desktop**
6. Look for the MCP icon in the chat interface to confirm connection

---

## Claude Code (CLI)

**Platform:** macOS, Windows, Linux

### Configuration File Location

- **macOS/Linux:** `~/.config/claude-code/mcp_settings.json`
- **Windows:** `%APPDATA%\claude-code\mcp_settings.json`

### Setup

Create or edit the `mcp_settings.json` file:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "node",
      "args": ["/path/to/earthcast-mcp/dist/index.js"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password"
      }
    }
  }
}
```

Restart Claude Code for changes to take effect.

---

## Warp

**Platform:** macOS, Linux

Add to `~/.config/warp/mcp_settings.json` or configure via Warp UI:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "node",
      "args": ["/path/to/earthcast-mcp/dist/index.js"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password",
        "ENABLED_TOOLS": "basic,+earthcast_query_data,+earthcast_gonogo_decision"
      }
    }
  }
}
```

---

## Cline (VS Code Extension)

**Platform:** VS Code on macOS, Windows, Linux

### Setup

1. Install the Cline extension in VS Code
2. Open the Cline panel
3. Click the **MCP Servers** icon
4. Click **Configure MCP Servers** (opens `cline_mcp_settings.json`)
5. Add configuration:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "node",
      "args": ["/path/to/earthcast-mcp/dist/index.js"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password"
      },
      "disabled": false
    }
  }
}
```

6. Save - Cline will automatically reload

---

## Cursor

**Platform:** macOS, Windows, Linux

### Setup via Settings

1. Open Cursor
2. Go to **Settings** (Cmd/Ctrl + ,)
3. Navigate to **Tools & Integrations**
4. Click **New MCP Server**
5. Enter:
   - **Name:** `earthcast`
   - **Command:** `node`
   - **Args:** `/path/to/earthcast-mcp/dist/index.js`

### Manual Configuration

Or edit the config file directly with the same JSON format as Claude Desktop.

---

## Grok (xAI)

For xAI's Grok integration, use the same JSON configuration format:

```json
{
  "mcpServers": {
    "earthcast": {
      "command": "node",
      "args": ["/path/to/earthcast-mcp/dist/index.js"],
      "env": {
        "ECT_API_USERNAME": "your_username",
        "ECT_API_PASSWORD": "your_password"
      }
    }
  }
}
```

---

## Environment Variables

### Required for Earthcast Tools

```bash
ECT_API_USERNAME=your_username
ECT_API_PASSWORD=your_password
```

### Optional Configuration

```bash
ENABLED_TOOLS=basic              # Tool preset (basic, standard, full, all)
CACHE_ENABLED=true               # Enable caching (default: true)
LOG_LEVEL=1                      # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
```

### Weather-Only Usage

If you only need weather tools (no Earthcast API), credentials are not required. Weather APIs (NOAA, Open-Meteo) are free and public.

---

## Troubleshooting

### Server Not Connecting

1. Verify Node.js >= 18 is installed: `node --version`
2. Check the path to `dist/index.js` is correct
3. Ensure the project is built: `npm run build`
4. Check logs for errors (stderr)

### Earthcast Tools Not Working

1. Verify credentials are set correctly
2. Check API connectivity to ect-sandbox.com
3. Enable debug logging: `LOG_LEVEL=0`

### Tools Not Appearing

1. Restart your MCP client
2. Check `ENABLED_TOOLS` configuration
3. Default is `basic` preset (9 weather tools)
4. Add Earthcast tools: `ENABLED_TOOLS=basic,+earthcast_query_data,+earthcast_gonogo_decision`

---

## Attribution

This project is a fork of [weather-mcp](https://github.com/weather-mcp/weather-mcp). Earthcast Technologies integration added by Earthcast Technologies' HPC and AI team.
