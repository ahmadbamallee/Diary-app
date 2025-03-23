import fetch from 'node-fetch';

const SUPABASE_URL = "https://trrczotezojyyjcmeqvt.supabase.co";
const SUPABASE_API_KEY = process.env.VITE_SUPABASE_ANON_KEY; // Set this in GitHub Secrets
const TABLE = "entries"; // Or use "profiles" or "diary_entries"

async function pingSupabase() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?limit=1`, {
            headers: {
                apikey: SUPABASE_API_KEY,
                Authorization: `Bearer ${SUPABASE_API_KEY}`
            }
        });

        if (response.ok) {
            console.log(`[${new Date().toISOString()}] ✅ Supabase pinged successfully.`);
        } else {
            console.error(`[${new Date().toISOString()}] ❌ Failed to ping Supabase:`, response.statusText);
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ⚠️ Error pinging Supabase:`, error.message);
    }
}

pingSupabase();
