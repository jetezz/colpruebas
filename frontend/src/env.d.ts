/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_ENVIRONMENT?: string;
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_GIT_BRANCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}