import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { loadConfig } from '../src/config.js';
const originalEnv = { ...process.env };
beforeEach(() => {
    Object.assign(process.env, originalEnv);
});
afterEach(() => {
    Object.assign(process.env, originalEnv);
});
test('loadConfig parses valid env vars', () => {
    process.env.N8N_URL = 'https://example.com/webhook';
    process.env.N8N_TOKEN = 'secret';
    process.env.PORT = '3000';
    process.env.DEBUG = 'true';
    const config = loadConfig();
    assert.strictEqual(config.n8nUrl, 'https://example.com/webhook');
    assert.strictEqual(config.n8nToken, 'secret');
    assert.strictEqual(config.port, 3000);
    assert.strictEqual(config.debug, true);
});
test('loadConfig throws error for missing N8N_URL', () => {
    delete process.env.N8N_URL;
    delete process.env.N8N_TOKEN;
    assert.throws(() => loadConfig(), { message: 'N8N_URL environment variable is required' });
});
test('loadConfig throws error for missing N8N_TOKEN', () => {
    process.env.N8N_URL = 'https://example.com/webhook';
    delete process.env.N8N_TOKEN;
    assert.throws(() => loadConfig(), { message: 'N8N_TOKEN environment variable is required' });
});
test('loadConfig uses default PORT 3328 when not set', () => {
    process.env.N8N_URL = 'https://example.com/webhook';
    process.env.N8N_TOKEN = 'secret';
    delete process.env.PORT;
    const config = loadConfig();
    assert.strictEqual(config.port, 3328);
});
test('loadConfig uses default DEBUG false when not set', () => {
    process.env.N8N_URL = 'https://example.com/webhook';
    process.env.N8N_TOKEN = 'secret';
    delete process.env.DEBUG;
    const config = loadConfig();
    assert.strictEqual(config.debug, false);
});
//# sourceMappingURL=config.test.js.map