import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

(async () => {
    console.log('Fetching admins...');
    const { data: admins, error: ce } = await supabase.from('admins').select('*');
    console.log('Admins:', admins);
    if (ce) console.error(ce);
    
    console.log('Fetching clients with no profile...');
    const { data: noProfileClients, error: npce } = await supabase.from('clients').select('id, email, user_id').is('name', null);
    console.log('No profile clients:', noProfileClients);
    if (npce) console.error(npce);
})();


