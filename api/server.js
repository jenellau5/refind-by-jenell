// Vercel serverless function — Express API handler
// Uses @neondatabase/serverless for Postgres (no native binaries)

let appPromise = null;

function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      // Set VERCEL flag so storage.ts uses PgStorage
      process.env.VERCEL = "1";
      const mod = require("../dist/index.cjs");
      // The default export is the async handler
      return mod.default || mod;
    })();
  }
  return appPromise;
}

module.exports = async (req, res) => {
  const handler = await getApp();
  return handler(req, res);
};
