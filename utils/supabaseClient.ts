import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wbpkvyyxbsmzwxsqpdtr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicGt2eXl4YnNtend4c3FwZHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjgyNTUsImV4cCI6MjA4NzMwNDI1NX0.TwzDCskqdD_M8Mt-J0eDwn51sl7P2GYf8h_J5CuksJQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to test connection
export const testSupabaseConnection = async () => {
    try {
        // Just a simple query to check if we can connect
        // We query a non-existent table or just auth state
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Supabase connection error:', error.message);
            return false;
        }
        console.log('Supabase connected successfully!');
        return true;
    } catch (err) {
        console.error('Supabase connection failed:', err);
        return false;
    }
};
