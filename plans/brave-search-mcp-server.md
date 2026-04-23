# Implementation Plan: Brave Search MCP Server

**Created**: Thu Apr 23 2026
**Original Request**: Break down the PRD for Brave Search MCP Server into actionable specs for a coding agent

## Context Summary

The codebase is currently empty except for:
- `plans/prd.md` - The PRD document describing the MCP server to build
- `plugin.json` - Existing TypingMind plugin configuration (to be replaced)

This is a greenfield project. The PRD specifies building a TypeScript MCP server that:
- Uses `@modelcontextprotocol/sdk` for MCP protocol
- Proxies requests to an n8n webhook with Brave Search API
- Runs on Node 22+ with native fetch
- Uses built-in `node:test` for testing (zero external test dependencies)

## High-Level Implementation Plan

### Overview

Build a lightweight TypeScript MCP server exposing Brave Search via HTTP transport. The server receives MCP tool calls, forwards them to an n8n webhook, and returns search results to MCP clients.

### Approach

**Phased TDD approach** following the PRD's implementation phases:
1. Scaffold + Config module (foundation)
2. Tool definition + handler (core logic)
3. MCP server + HTTP transport (integration)
4. Test suite + documentation (verification)

Each phase follows Red-Green-Refactor: write failing tests first, implement minimal code to pass, then refactor.

### Test-Driven Development

For each module:
1. **Red**: Write unit test in `test/*.test.ts` using `node:test` and `node:assert`
2. **Green**: Implement minimal code in `src/` to make test pass
3. **Refactor**: Clean up code while keeping tests green

Tests use AAA pattern (Arrange-Act-Assert). External `fetch` calls are mocked via `globalThis.fetch` override.

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Config Module | `src/config.ts` | Environment variable parsing and validation |
| Tool Definition | `src/tools/brave-search.ts` | brave_web_search tool schema and handler |
| MCP Server | `src/server.ts` | Server setup, tool registration, HTTP transport |
| Entry Point | `src/index.ts` | Bootstrap and start server |
| Test Suite | `test/server.test.ts` | Unit + integration tests |

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.12.1 | MCP protocol implementation |
| `typescript` | ^5.x | Type safety |
| `@types/node` | ^22.x | Node.js type definitions (dev) |

## TODO List

**TDD Required**: Write tests first, then implementation.

> **Note**: Tests use TypeScript syntax. The `test` npm script runs `tsc && node --test` to compile TypeScript to JavaScript before executing tests with the built-in Node test runner.

### Phase 1: Project Scaffolding & Config

> **Note**: Phase 1 creates infrastructure first so tests can compile and run. Write tests first but execution requires infrastructure.

- [x] **Task 1.1**: Create `package.json` with dependencies and scripts
- [x] **Task 1.2**: Create `tsconfig.json` with strict mode
- [x] **Task 1.3**: Create `src/config.ts` with env var parsing and validation
- [x] **Task 1.4**: Run `tsc` to verify TypeScript compiles without errors
- [x] **Test 1.1**: Write test for config parsing with valid env vars
- [x] **Test 1.2**: Write test for config validation errors (missing required vars)
- [x] **Test 1.3**: Write test for default values (PORT, DEBUG)

### Phase 2: Tool Definition & Handler

- [x] **Test 2.1**: Write test for tool parameter schema validation
- [x] **Task 2.1**: Create `src/tools/brave-search.ts` with tool definition and parameter schema
- [x] **Test 2.2**: Write test for URL construction with all parameters
- [x] **Task 2.2**: Implement `buildN8NRequestUrl()` helper function for URL construction
- [x] **Test 2.3**: Write test for country code validation (reject "CZ")
- [x] **Task 2.3**: Add validation logic for country code, freshness enum, and count capping
- [x] **Test 2.4**: Write test for freshness enum validation
- [x] **Test 2.5**: Write test for count > 10 capping at 10
- [x] **Test 2.6**: Write test for empty query string rejection
- [x] **Test 2.7**: Write integration test mocking fetch for successful response
- [x] **Task 2.4**: Implement `handleBraveSearch()` tool handler with fetch call to n8n
- [x] **Test 2.8**: Write test for error handling (n8n timeout/failure)
- [x] **Task 2.5**: Add try-catch error handling with MCP-formatted errors for timeout/failure

### Phase 3: MCP Server & HTTP Transport

- [ ] **Test 3.1**: Write test for server instantiation without errors
- [x] **Task 3.1**: Create `src/server.ts` with MCP server setup and tool registration
- [ ] **Test 3.2**: Write test for tool registration verification
- [ ] **Test 3.3**: Write test for HTTP server startup on configured port
- [x] **Task 3.2**: Create `src/index.ts` entry point that starts HTTP server on configured port
- [ ] **Test 3.4**: Write test for DEBUG logging toggle
- [x] **Task 3.3**: Implement conditional DEBUG logging based on env var

### Phase 4: Documentation & Polish

- [x] **Task 4.1**: Create `.env.example` with all environment variables
- [x] **Task 4.2**: Create `README.md` with setup instructions
- [x] **Task 4.3**: Add npm scripts (`start`, `dev`, `test`, `build`)
- [x] **Task 4.4**: Create `.gitignore` for node_modules, dist, .env

### Phase 5: Verification

- [x] **Task 5.1**: Run full test suite with `npm test`
- [ ] **Task 5.2**: Manual test: Start server and verify tools/list works
- [ ] **Task 5.3**: Manual test: Execute brave_web_search and verify response
- [ ] **Task 5.4**: Verify server starts in < 1 second
- [ ] **Task 5.5**: Check memory footprint < 30 MB

### Test Locations

```
test/
└── server.test.ts    # All tests (unit + integration)
```

Tests are co-located in a single `test/` directory per the PRD spec. Use Node's built-in test runner.

### Test Patterns

Follow **AAA Pattern** (Arrange-Act-Assert):

```typescript
import { test } from 'node:test';
import assert from 'node:assert';

test('should parse valid env vars', () => {
  // Arrange
  process.env.N8N_URL = 'https://example.com/webhook';
  process.env.N8N_TOKEN = 'secret';

  // Act
  const config = loadConfig();

  // Assert
  assert.strictEqual(config.n8nUrl, 'https://example.com/webhook');
});
```

### Mock Strategy

**Mock globalThis.fetch** for integration tests:

```typescript
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ results: [] }),
  text: async () => JSON.stringify({ results: [] })
}) as any;

// After test:
globalThis.fetch = originalFetch;
```

### Edge Cases to Test

1. **Config**: Missing required env vars throws error
2. **Config**: Invalid PORT number falls back to default
3. **Tool**: Country code "CZ" rejected with helpful error
4. **Tool**: Count > 10 capped at 10
5. **Tool**: Freshness accepts only pd/pw/pm/py
6. **Handler**: n8n timeout returns formatted MCP error
7. **Handler**: Empty query string rejected

## Testing Verification

### Unit Tests

All unit tests should exist from TDD process:
- Config parsing and validation
- URL construction with various parameter combinations
- Parameter validation (country, freshness, count)

### Integration Tests

Mocked fetch tests:
- Successful n8n response → MCP ToolResult
- n8n error response → MCP error content
- Network timeout → Graceful error message

Run with: `npm test` (which executes `tsc && node --test`)

### Manual Testing

1. **Setup**: Copy `.env.example` to `.env`, fill in N8N_URL and N8N_TOKEN
2. **Start**: `npm run dev` or `npm start`
3. **Verify Discovery**: Connect MCP client, call `tools/list`, confirm `brave_web_search` appears
4. **Verify Execution**: Call tool with `{query: "test"}`, verify results returned in < 5 seconds
5. **Verify Logging**: Set `DEBUG=true`, restart, observe request/response traces

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Create | Project metadata, dependencies, scripts |
| `tsconfig.json` | Create | TypeScript configuration |
| `src/config.ts` | Create | Environment variable parsing |
| `src/tools/brave-search.ts` | Create | Tool definition and handler |
| `src/server.ts` | Create | MCP server setup |
| `src/index.ts` | Create | Entry point |
| `test/server.test.ts` | Create | Test suite |
| `.env.example` | Create | Environment variable template |
| `README.md` | Create | Setup and usage documentation |
| `.gitignore` | Create | Ignore node_modules, dist, .env |
| `.nvmrc` | Create | Specify Node version (22+) |

## Notes

### Alternative Approaches Considered

1. **Separate test files per module** (`test/config.test.ts`, `test/tools.test.ts`): Rejected per PRD spec calling for single test file
2. **Jest/Vitest**: Rejected - PRD explicitly requires built-in `node:test` for zero external dependencies
3. **Separate HTTP layer**: Rejected - StreamableHTTPTransport from SDK handles both MCP protocol and HTTP

### Critical Constraints

- **Node 22+ required** for native fetch and node:test
- **Country code "CZ" must be rejected** - use "ALL" instead (per existing plugin.json)
- **Zero runtime dependencies** beyond MCP SDK
- **Startup time < 1 second**, memory < 30 MB

### Migration Path

The existing `plugin.json` will be deprecated once this MCP server is deployed. MCP clients (Cursor, Claude Desktop, etc.) will connect directly to this server instead of using TypingMind's proprietary plugin system.

---

## Context Files (Auto-Generated)

The following files were examined during planning:

- `/home/tadeas/mac/mcp-n8n-brave/plans/prd.md`: Primary requirements document specifying architecture, dependencies, tool schema, and success criteria
- `/home/tadeas/mac/mcp-n8n-brave/plugin.json`: Existing TypingMind plugin showing current parameter defaults, headers, and behavior to replicate/migrate
