import {handleTax} from '../../../server/taxes/handler.js';
const env=Deno.env.toObject();
function key(name:string,legacy:string){try{return JSON.parse(env[name]||'{}').default||env[legacy]}catch{return env[legacy]}}
Deno.serve(req=>handleTax(req,{...env,SUPABASE_PUBLIC_KEY:key('SUPABASE_PUBLISHABLE_KEYS','SUPABASE_ANON_KEY'),SUPABASE_SERVER_KEY:key('SUPABASE_SECRET_KEYS','SUPABASE_SERVICE_ROLE_KEY')}));
