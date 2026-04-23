export interface Config {
  n8nUrl: string;
  n8nToken: string;
  port: number;
  debug: boolean;
}

const DEFAULT_PORT = 3328;
const DEFAULT_DEBUG = false;

export function loadConfig(): Config {
  const n8nUrl = process.env.N8N_URL;
  const n8nToken = process.env.N8N_TOKEN;
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
  let debug: boolean;
  if (process.env.DEBUG === 'true') {
    debug = true;
  } else {
    debug = DEFAULT_DEBUG;
  }

  if (!n8nUrl) {
    throw new Error('N8N_URL environment variable is required');
  }

  if (!n8nToken) {
    throw new Error('N8N_TOKEN environment variable is required');
  }

  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)');
  }

  return { n8nUrl, n8nToken, port, debug };
}