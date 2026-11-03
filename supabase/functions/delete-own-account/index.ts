import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {createDeleteAccountHandler} from './handler.mjs';

Deno.serve(createDeleteAccountHandler(()=>createClient(
  Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {auth:{persistSession:false,autoRefreshToken:false}},
)));
