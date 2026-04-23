import type { Config } from './config.js';
export declare class BraveSearchServer {
    private server;
    private transport;
    private config;
    constructor(config: Config);
    private registerTools;
    start(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map