# Brave Search MCP Server

A lightweight TypeScript MCP (Model Context Protocol) server that exposes Brave Search via an n8n webhook.

## Requirements

- Node.js 22+
- n8n instance with a Brave Search webhook configured

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Set your n8n webhook URL and token in `.env`

## Running

```bash
# Development (with tsx)
npm run dev

# Production
npm run build
npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `N8N_URL` | Yes | - | n8n webhook URL |
| `N8N_TOKEN` | Yes | - | Bearer token for n8n auth |
| `PORT` | No | `3328` | HTTP server port |
| `DEBUG` | No | `false` | Enable verbose logging |

## MCP Tool: brave_web_search

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query |
| `count` | number | No | 4 | Results to return (max 10) |
| `country` | string | No | "ALL" | 2-char country code (not "CZ") |
| `freshness` | enum | No | - | Time filter: pd, pw, pm, py |
| `search_lang` | string | No | "en-gb" | Language code |

## Testing

```bash
npm test
```