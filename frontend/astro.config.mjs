import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: {
    port: 4321,
    host: true,
    allowedHosts: ['colpruebas.online', 'test.colpruebas.online', 'localhost', '127.0.0.1'],
  }
});
