import fetch from 'node-fetch';

const SUPABASE_URL = "https://trrczotezojyyjcmeqvt.supabase.co"; // Replace with your Supabase URL

async function pingSupabase() {
    try {
        const response = await fetch(SUPABASE_URL);
        if (response.ok) {
            console.log(`[${new Date().toISOString()}] ✅ Supabase pinged successfully.`);
        } else {
            console.error(`[${new Date().toISOString()}] ❌ Failed to ping Supabase:`, response.statusText);
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ⚠️ Error pinging Supabase:`, error);
    }
}

// Run the function
pingSupabase();
