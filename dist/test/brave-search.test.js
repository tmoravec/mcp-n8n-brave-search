import { test } from 'node:test';
import assert from 'node:assert';
import { buildN8NRequestUrl, handleBraveSearch, braveSearchTool, } from '../src/tools/brave-search.js';
const N8N_URL = 'https://example.com/webhook';
const N8N_TOKEN = 'secret';
test('braveSearchTool has correct name and description', () => {
    assert.strictEqual(braveSearchTool.name, 'brave_web_search');
    assert.ok(braveSearchTool.description.length > 0);
});
test('braveSearchTool inputSchema has required query field', () => {
    const schema = braveSearchTool.inputSchema;
    assert.strictEqual(schema.type, 'object');
    assert.deepStrictEqual(schema.required, ['query']);
    assert.ok(schema.properties.query);
});
test('buildN8NRequestUrl constructs URL with all parameters', () => {
    const url = buildN8NRequestUrl(N8N_URL, {
        query: 'test query',
        count: 5,
        country: 'US',
        freshness: 'pw',
        search_lang: 'en',
    });
    const parsed = new URL(url);
    assert.strictEqual(parsed.searchParams.get('query'), 'test query');
    assert.strictEqual(parsed.searchParams.get('count'), '5');
    assert.strictEqual(parsed.searchParams.get('country'), 'US');
    assert.strictEqual(parsed.searchParams.get('freshness'), 'pw');
    assert.strictEqual(parsed.searchParams.get('search_lang'), 'en');
});
test('buildN8NRequestUrl uses defaults when optional params not provided', () => {
    const url = buildN8NRequestUrl(N8N_URL, { query: 'test' });
    const parsed = new URL(url);
    assert.strictEqual(parsed.searchParams.get('query'), 'test');
    assert.strictEqual(parsed.searchParams.get('count'), '4');
    assert.strictEqual(parsed.searchParams.get('country'), 'ALL');
    assert.strictEqual(parsed.searchParams.get('search_lang'), 'en-gb');
    assert.strictEqual(parsed.searchParams.has('freshness'), false);
});
test('buildN8NRequestUrl rejects country code CZ', () => {
    assert.throws(() => buildN8NRequestUrl(N8N_URL, { query: 'test', country: 'CZ' }), /Country code "CZ" is not allowed/);
});
test('buildN8NRequestUrl caps count at 10', () => {
    const url = buildN8NRequestUrl(N8N_URL, { query: 'test', count: 20 });
    const parsed = new URL(url);
    assert.strictEqual(parsed.searchParams.get('count'), '10');
});
test('buildN8NRequestUrl accepts count <= 10 without capping', () => {
    const url = buildN8NRequestUrl(N8N_URL, { query: 'test', count: 10 });
    const parsed = new URL(url);
    assert.strictEqual(parsed.searchParams.get('count'), '10');
});
test('buildN8NRequestUrl accepts valid freshness values', () => {
    for (const freshness of ['pd', 'pw', 'pm', 'py']) {
        const url = buildN8NRequestUrl(N8N_URL, { query: 'test', freshness });
        const parsed = new URL(url);
        assert.strictEqual(parsed.searchParams.get('freshness'), freshness);
    }
});
test('buildN8NRequestUrl rejects empty query string', () => {
    assert.throws(() => buildN8NRequestUrl(N8N_URL, { query: '' }), /Query parameter cannot be empty/);
    assert.throws(() => buildN8NRequestUrl(N8N_URL, { query: '   ' }), /Query parameter cannot be empty/);
});
test('handleBraveSearch returns formatted result on success', async () => {
    const originalFetch = globalThis.fetch;
    try {
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => [{ title: 'Test', url: 'https://example.com' }],
        });
        const result = await handleBraveSearch({ query: 'test' }, N8N_URL, N8N_TOKEN);
        assert.strictEqual(result.query, 'test');
        assert.ok(Array.isArray(result.results));
        assert.strictEqual(result.results.length, 1);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('handleBraveSearch throws error on non-200 response', async () => {
    const originalFetch = globalThis.fetch;
    try {
        globalThis.fetch = async () => ({
            ok: false,
            status: 500,
        });
        await assert.rejects(async () => handleBraveSearch({ query: 'test' }, N8N_URL, N8N_TOKEN), /n8n request failed with status 500/);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('handleBraveSearch throws error on network failure', async () => {
    const originalFetch = globalThis.fetch;
    try {
        globalThis.fetch = async () => {
            throw new Error('Network timeout');
        };
        await assert.rejects(async () => handleBraveSearch({ query: 'test' }, N8N_URL, N8N_TOKEN), /Network timeout/);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('handleBraveSearch passes correct headers to n8n', async () => {
    const originalFetch = globalThis.fetch;
    try {
        let capturedAuthorization = '';
        globalThis.fetch = async (_url, init) => {
            const headers = init?.headers || {};
            capturedAuthorization = headers['Authorization'] || '';
            return {
                ok: true,
                status: 200,
                json: async () => ({ results: [] }),
            };
        };
        await handleBraveSearch({ query: 'test' }, N8N_URL, N8N_TOKEN);
        assert.strictEqual(capturedAuthorization, 'Bearer secret');
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('handleBraveSearch constructs correct URL with query parameters', async () => {
    const originalFetch = globalThis.fetch;
    try {
        let capturedUrl = '';
        globalThis.fetch = async (url) => {
            capturedUrl = url instanceof Request ? url.url : String(url);
            return {
                ok: true,
                status: 200,
                json: async () => [{ title: 'Test', url: 'https://example.com' }],
            };
        };
        await handleBraveSearch({ query: 'nodejs trends', count: 5, country: 'US', freshness: 'pw', search_lang: 'en' }, N8N_URL, N8N_TOKEN);
        const parsed = new URL(capturedUrl);
        assert.strictEqual(parsed.searchParams.get('query'), 'nodejs trends');
        assert.strictEqual(parsed.searchParams.get('count'), '5');
        assert.strictEqual(parsed.searchParams.get('country'), 'US');
        assert.strictEqual(parsed.searchParams.get('freshness'), 'pw');
        assert.strictEqual(parsed.searchParams.get('search_lang'), 'en');
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('handleBraveSearch caps count at 10 in URL construction', async () => {
    const originalFetch = globalThis.fetch;
    try {
        let capturedUrl = '';
        globalThis.fetch = async (url) => {
            capturedUrl = url instanceof Request ? url.url : String(url);
            return {
                ok: true,
                status: 200,
                json: async () => [],
            };
        };
        await handleBraveSearch({ query: 'test', count: 20 }, N8N_URL, N8N_TOKEN);
        const parsed = new URL(capturedUrl);
        assert.strictEqual(parsed.searchParams.get('count'), '10');
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('handleBraveSearch rejects CZ country via handler', async () => {
    const originalFetch = globalThis.fetch;
    try {
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => [],
        });
        await assert.rejects(async () => handleBraveSearch({ query: 'test', country: 'CZ' }, N8N_URL, N8N_TOKEN), /Country code "CZ" is not allowed/);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
//# sourceMappingURL=brave-search.test.js.map