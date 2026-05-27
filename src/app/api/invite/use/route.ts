import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynwltwklsphquttgapqh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlud2x0d2tsc3BocXV0dGdhcHFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgwNDEyMCwiZXhwIjoyMDk1MzgwMTIwfQ.5nJktdh27UR0WA88z_rsyz4yfXBFLjv5pBQvIGLmKlM';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json({ error: 'Missing code or userId' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('invite_codes')
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq('code', code)
      .eq('used_by', null)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Invite code not found or already used' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
