import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbpkvyyxbsmzwxsqpdtr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicGt2eXl4YnNtend4c3FwZHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjgyNTUsImV4cCI6MjA4NzMwNDI1NX0.TwzDCskqdD_M8Mt-J0eDwn51sl7P2GYf8h_J5CuksJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload('test.txt', 'hello world', { upsert: true });
  console.log('Upload error:', uploadError);
}

test();
