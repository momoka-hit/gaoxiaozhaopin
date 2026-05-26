import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynwltwklsphquttgapqh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlud2x0d2tsc3BocXV0dGdhcHFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgwNDEyMCwiZXhwIjoyMDk1MzgwMTIwfQ.5nJktdh27UR0WA88z_rsyz4yfXBFLjv5pBQvIGLmKlM';

export function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
