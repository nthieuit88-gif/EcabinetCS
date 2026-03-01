import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbpkvyyxbsmzwxsqpdtr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicGt2eXl4YnNtend4c3FwZHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjgyNTUsImV4cCI6MjA4NzMwNDI1NX0.TwzDCskqdD_M8Mt-J0eDwn51sl7P2GYf8h_J5CuksJQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: insertData, error: insertError } = await supabase.from('users').insert({
    id: 999,
    name: 'Test 999',
    role: 'Admin',
    dept: 'IT',
    status: 'active',
    avatar_color: 'bg-red-500',
    email: 'test999@test.com',
    unit_id: 'unit_1'
  }).select();
  console.log('Insert test:', { insertData, insertError });
}
test();
