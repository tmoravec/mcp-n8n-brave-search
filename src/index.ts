import 'dotenv/config';
import { loadConfig } from './config.js';
import { BraveSearchServer } from './server.js';

async function main() {
  const config = loadConfig();
  const server = new BraveSearchServer(config);

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    process.exit(0);
  });

  await server.start();
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});