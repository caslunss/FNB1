import handler from '../server/functions/market-rates.mjs';

// Vercel Web Standard handler: preserves headers, status and request body.
export default {fetch: handler};
