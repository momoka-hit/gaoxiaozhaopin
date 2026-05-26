import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = 'https://ynwltwklsphquttgapqh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlud2x0d2tsc3BocXV0dGdhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDQxMjAsImV4cCI6MjA5NTM4MDEyMH0.tBnETGs-5rOvP5vQoXWg0DtbkWI2ZAxDpBea8vXY1VE';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
