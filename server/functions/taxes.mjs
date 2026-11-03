import {handleTax} from '../../server/taxes/handler.js';
import config from '../../public/assets/auth-config.json' with {type:'json'};
export default req=>handleTax(req,{...process.env,SUPABASE_URL:config.supabaseUrl,SUPABASE_PUBLIC_KEY:config.supabasePublishableKey,SUPABASE_SERVER_KEY:process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY});
