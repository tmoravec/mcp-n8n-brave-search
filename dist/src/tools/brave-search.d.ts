import { z } from 'zod';
export interface BraveSearchParams {
    query: string;
    count?: number;
    country?: string;
    freshness?: 'pd' | 'pw' | 'pm' | 'py';
    search_lang?: string;
}
export interface BraveSearchResult {
    query: string;
    count: number;
    country: string;
    freshness?: string;
    search_lang: string;
    results: unknown[];
}
export declare const braveSearchInputSchema: z.ZodObject<{
    query: z.ZodString;
    count: z.ZodOptional<z.ZodNumber>;
    country: z.ZodOptional<z.ZodString>;
    freshness: z.ZodOptional<z.ZodEnum<{
        pd: "pd";
        pw: "pw";
        pm: "pm";
        py: "py";
    }>>;
    search_lang: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function buildN8NRequestUrl(baseUrl: string, params: BraveSearchParams): string;
export declare function handleBraveSearch(params: BraveSearchParams, n8nUrl: string, n8nToken: string): Promise<BraveSearchResult>;
export declare const braveSearchTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            count: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
            };
            country: {
                type: string;
                description: string;
            };
            freshness: {
                type: string;
                enum: string[];
                description: string;
            };
            search_lang: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=brave-search.d.ts.map