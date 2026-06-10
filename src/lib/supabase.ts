import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface ContactMessage {
  name: string
  email: string
  message: string
}

export async function submitContact(data: ContactMessage) {
  if (!supabase) {
    console.warn('Supabase not configured — contact form will not persist.')
    return { error: null }
  }

  const { error } = await supabase
    .from('contact_messages')
    .insert([{ ...data, created_at: new Date().toISOString() }])

  return { error }
}

/*
 * ── Supabase Schema (run in Supabase SQL Editor) ──
 *
 * CREATE TABLE contact_messages (
 *   id BIGSERIAL PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   email TEXT NOT NULL,
 *   message TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow anonymous inserts" ON contact_messages
 *   FOR INSERT WITH CHECK (true);
 */
