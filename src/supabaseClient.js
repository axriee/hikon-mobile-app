import { createClient } from '@supabase/supabase-js';

// IMPORTANT: do NOT commit sensitive keys into source control. For development
// you can set the values below or use environment variables injected at build
// time (for Expo use EXPO_PUBLIC_* variables or replace the placeholders).
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ogapdrgcwmzecbwwrmre.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nYXBkcmdjd216ZWNid3dybXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDIxNzAsImV4cCI6MjA3MzkxODE3MH0.5ondVqwEc09dcuO9DsFcOqVl8lctcrI4CIjmhKsua10';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
