// Vercel serverless entry point
// Wraps the Express app exported from dist/index.cjs

let handlerPromise = null;

function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const mod = require("../dist/index.cjs");
      const handler = mod.default || mod;
      return handler;
    })();
  }
  return handlerPromise;
}

module.exports = async (req, res) => {
  const handler = await getHandler();
  return handler(req, res);
};
