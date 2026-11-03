import handler from '../server/functions/connect-token.mjs';

// Vercel Web Standard handler: preserves headers, status and request body.
export default {fetch: handler};
