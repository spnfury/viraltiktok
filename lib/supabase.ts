import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Persistence will be disabled.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * SQL for the 'videos' table:
 * 
 * create table videos (
 *   id uuid default gen_random_uuid() primary key,
 *   generation_id text unique,
 *   prompt text not null,
 *   status text not null, -- pending, processing, completed, failed
 *   video_url text,
 *   aspect_ratio text,
 *   duration int,
 *   model text,
 *   created_at timestamp with time zone default now()
 * );
 */
