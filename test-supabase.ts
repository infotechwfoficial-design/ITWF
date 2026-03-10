import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing Supabase Plans Table...');
    const { data, error } = await supabase.from('plans').select('*');
    console.log('Select Result:', data, error);

    const { data: insertData, error: insertError } = await supabase.from('plans').insert([{
        name: 'Test Plan',
        price: 10,
        duration: '1 Mês',
        payment_link: '',
        features: '[]'
    }]).select();
    console.log('Insert Result:', insertData, insertError);
}

test();
