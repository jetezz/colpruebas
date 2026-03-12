import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  server: {
    port: 4321,
    host: true,
    allowedHosts: ['colpruebas.online', 'localhost', '127.0.0.1'],
  }
});
