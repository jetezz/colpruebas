// Re-export from .cjs using ESM default export + createRequire.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cjs = require('./playwright.config.cjs');
export default cjs.default ?? cjs;
