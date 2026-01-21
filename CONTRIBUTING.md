# Contributing to Earthcast MCP

Thank you for your interest in contributing to Earthcast MCP! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## How to Contribute

### Reporting Bugs

If you find a bug, please [open an issue](https://github.com/ec-will/earthcast-mcp/issues/new?template=bug_report.yml) with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Your environment (OS, Node.js version, MCP client)
- Any relevant error messages or logs

### Suggesting Enhancements

We welcome feature suggestions! Please [open a feature request](https://github.com/ec-will/earthcast-mcp/issues/new?template=feature_request.yml) with:
- A clear description of the feature
- The use case it addresses
- Any implementation ideas (optional)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the coding standards below
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ec-will/earthcast-mcp.git
cd earthcast-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Project Structure

```
earthcast-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── handlers/             # Tool request handlers
│   │   ├── earthcastDataHandler.ts
│   │   ├── earthcastGoNoGoHandler.ts
│   │   ├── earthcastVectorHandler.ts
│   │   ├── earthcastOpticalDepthHandler.ts
│   │   ├── forecastHandler.ts
│   │   └── ... (weather handlers)
│   ├── services/             # External API clients
│   │   ├── earthcast.ts      # Earthcast Technologies API
│   │   ├── noaa.ts           # NOAA Weather API
│   │   ├── openmeteo.ts      # Open-Meteo API
│   │   └── ...
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Shared utilities
│   ├── config/               # Configuration
│   └── errors/               # Custom error classes
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
└── dist/                     # Compiled output (generated)
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode (already configured)
- Provide type annotations for function parameters and return values
- Avoid using `any` type unless absolutely necessary

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Follow existing code patterns and conventions
- Keep functions focused and single-purpose

### Error Handling

- Always handle errors gracefully
- Use custom error classes from `src/errors/ApiError.ts`
- Provide clear, user-friendly error messages
- Log detailed errors to stderr (never stdout - MCP protocol requirement)

### Testing

- Write tests for new features
- Ensure all existing tests pass before submitting PR
- Follow patterns in `tests/unit/` and `tests/integration/`

## Environment Variables

For Earthcast API features, you'll need credentials:

```bash
ECT_API_USERNAME=your_username
ECT_API_PASSWORD=your_password
```

Weather APIs (NOAA, Open-Meteo) require no authentication.

## Commit Messages

Write clear, descriptive commit messages:

```
Brief description (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
- Bullet points for multiple changes
- Use present tense ("Add feature" not "Added feature")
- Reference issues where relevant (#123)
```

## Questions?

If you have questions about contributing:
- Open an issue with the "question" label
- Check existing issues and discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Attribution

This project is a fork of [weather-mcp](https://github.com/weather-mcp/weather-mcp). Earthcast Technologies integration added by Earthcast Technologies' HPC and AI team.
