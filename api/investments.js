import handler from '../server/functions/investments.mjs';

// Vercel Web Standard handler: preserves headers, status and request body.
export default {fetch: handler};
