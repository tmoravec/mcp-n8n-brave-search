# PRD: Brave Search MCP Server

## Overview

A lightweight TypeScript MCP (Model Context Protocol) server that exposes Brave Search web search capabilities via the MCP HTTP transport. It proxies tool calls to a personal n8n webhook instance, replacing the existing TypingMind plugin architecture with the standard MCP protocol.

## Problem Statement

The current TypingMind Brave Search plugin uses a proprietary plugin system with custom HTTP function definitions. Rewriting as an MCP server provides:
- Standardised protocol support across any MCP-compatible client (Cursor, Claude Desktop, Claude Code, etc.)
- HTTP transport for remote accessibility
- Clean separation between AI client and search orchestration

## Architecture

```
MCP Client ←→ MCP Server (HTTP, port 3000) ←→ n8n Webhook ←→ Brave Search API
```

## Technical Requirements

### Dependencies

| Package | Purpose |
|---|---|
| `@modelcontextprotocol/sdk` ^1.12.1 | MCP protocol implementation |
| `typescript` ^5.x | Type safety |
| (dev) `node:test`, `node:assert` | Built-in test framework |

No additional HTTP client library needed — `fetch` is built into Node 22+.

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `N8N_URL` | Yes | _none_ | n8n webhook URL |
| `N8N_TOKEN` | Yes | _none_ | Bearer token for n8n authentication |
| `PORT` | No | `3328` | HTTP server listen port |
| `DEBUG` | No | `false` | Enable verbose logging |

### Tool Definition: `brave_web_search`

**Description:** Search the web using Brave Search. Returns relevant web pages, news, and information. Use for finding current information, news, facts, or researching topics.

**Parameters:**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | — | Search query (keywords, not nested) |
| `count` | number | No | 4 | Results to return (max 10) |
| `country` | string | No | `"ALL"` | 2-char country code. Must not be `"CZ"` — use `"ALL"` instead |
| `freshness` | enum | No | — | Time filter: `"pd"`, `"pw"`, `"pm"`, `"py"` |
| `search_lang` | string | No | `"en-gb"` | Language code |

### n8n Request Mapping

The MCP tool handler constructs a GET request to the n8n webhook:

```
GET {N8N_URL}?query={q}&count={n}&country={cc}&freshness={f}&search_lang={lang}
Headers:
  Accept: application/json
  Accept-Encoding: gzip
  Authorization: Bearer {N8N_TOKEN}
```

The raw n8n response is returned as the MCP tool result content (text block).

### Transport

- **Protocol:** HTTP (Streamable HTTP transport from `@modelcontextprotocol/sdk`)
- **Listen:** `0.0.0.0:{PORT}`
- **Logging:** `console` with `DEBUG` toggle for verbose request/response tracing

## Project Structure

```
brave-search-mcp/
├── src/
│   ├── index.ts          # Entry point — starts HTTP server
│   ├── server.ts          # MCP server + tool registration
│   ├── tools/
│   │   └── brave-search.ts # Tool definition + handler
│   └── config.ts          # Env var parsing + validation
├── test/
│   └── server.test.ts     # Node built-in test suite
├── package.json
├── tsconfig.json
└── .env.example
```

## Test Strategy

Using Node 22+ built-in `node:test` and `node:assert`:

1. **Unit tests:** Tool parameter validation, config parsing, URL construction from env vars
2. **Integration test:** Mock `fetch` to simulate n8n response; verify tool handler returns correctly formatted MCP `ToolResult`
3. **No external dependencies** — mock `globalThis.fetch` via standard mocking pattern

## Non-Functional Requirements

- **Startup time:** < 1 second
- **Memory footprint:** < 30 MB
- **Node version:** >= 22.0.0 (for native fetch + `node:test`)
- **Zero runtime dependencies** beyond the MCP SDK

## Implementation Phases

| Phase | Scope |
|---|---|
| 1 | Scaffold project, config module, tool definition |
| 2 | MCP server setup, HTTP transport, tool handler with fetch |
| 3 | Node test suite (unit + mocked integration) |
| 4 | README, `.env.example`, package scripts |

## Success Criteria

- MCP client can discover the `brave_web_search` tool via `tools/list`
- Tool execution returns search results from n8n in under 5 seconds
- All tests pass with `node --test`
- Server starts cleanly with only the four env vars configured
- Server works with OpenCode, ClaudeCode, and other MCP equipped tools
