export default defineNuxtConfig({
  extends: ['docus'],

  compatibilityDate: '2025-01-23',

  $production: {
    mcp: { enabled: false },
  },

  mcp: {
    enabled: false,
  },
});
