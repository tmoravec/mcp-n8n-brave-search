import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { braveSearchInputSchema, handleBraveSearch } from './tools/brave-search.js';
export class BraveSearchServer {
    server;
    transport;
    httpServer;
    config;
    constructor(config) {
        this.config = config;
        this.server = new McpServer({
            name: 'brave-search-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });
        this.registerTools();
    }
    registerTools() {
        this.server.registerTool('brave_web_search', {
            description: 'Search the web using Brave Search. Returns relevant web pages, news, and information. Use for finding current information, news, facts, or researching topics.',
            inputSchema: braveSearchInputSchema,
        }, async (args) => {
            try {
                if (this.config.debug) {
                    console.log('[DEBUG] Tool call received:', args);
                }
                const result = await handleBraveSearch(args, this.config.n8nUrl, this.config.n8nToken);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                if (this.config.debug) {
                    console.error('[DEBUG] Tool error:', error);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async start() {
        await this.server.connect(this.transport);
        const http = await import('node:http');
        this.httpServer = http.createServer(async (req, res) => {
            if (req.url === '/mcp' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk;
                    if (body.length > this.config.maxBodySize) {
                        res.statusCode = 413;
                        res.end('Payload too large');
                        return;
                    }
                });
                req.on('end', async () => {
                    try {
                        await this.transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
                    }
                    catch (error) {
                        if (!res.headersSent) {
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: 'Internal server error' }));
                        }
                    }
                });
            }
            else if (req.url === '/mcp' && req.method === 'GET') {
                await this.transport.handleRequest(req, res);
            }
            else {
                res.statusCode = 404;
                res.end('Not found');
            }
        });
        await new Promise((resolve) => {
            this.httpServer.listen(this.config.port, () => {
                if (this.config.debug) {
                    console.log(`[DEBUG] Brave Search MCP Server running on port ${this.config.port}`);
                }
                else {
                    console.log(`Brave Search MCP Server running on port ${this.config.port}`);
                }
                resolve();
            });
        });
    }
    async stop() {
        await new Promise((resolve) => {
            this.httpServer.close(() => resolve());
        });
        await this.server.close();
    }
}
//# sourceMappingURL=server.js.map