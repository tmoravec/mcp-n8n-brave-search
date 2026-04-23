import type { Config } from './config.js';
export declare class BraveSearchServer {
    private server;
    private transport;
    private httpServer;
    private config;
    constructor(config: Config);
    private registerTools;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map