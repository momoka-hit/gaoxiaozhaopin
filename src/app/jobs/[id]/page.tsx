import JobDetailClient from './JobDetailClient';

export async function generateStaticParams() {
  // Uses anon key — only reads public IDs at build time
  const supabaseUrl = 'https://ynwltwklsphquttgapqh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlud2x0d2tsc3BocXV0dGdhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDQxMjAsImV4cCI6MjA5NTM4MDEyMH0.tBnETGs-5rOvP5vQoXWg0DtbkWI2ZAxDpBea8vXY1VE';

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/recruitments?select=id`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) return data.map((r: any) => ({ id: r.id }));
  } catch {}

  return [];
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}
