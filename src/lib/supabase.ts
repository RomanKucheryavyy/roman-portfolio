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
    return { error: null, data: null }
  }

  const { error } = await supabase
    .from('contact_messages')
    .insert([{ ...data, created_at: new Date().toISOString() }])

  return { error }
}

export interface GuestbookEntry {
  id: number
  name: string
  message: string
  created_at: string
}

export async function getGuestbookEntries(): Promise<GuestbookEntry[]> {
  if (!supabase) return []

  const { data } = await supabase
    .from('guestbook')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (data as GuestbookEntry[]) ?? []
}

export async function addGuestbookEntry(name: string, message: string) {
  if (!supabase) return { error: null }

  const { error } = await supabase
    .from('guestbook')
    .insert([{ name, message }])

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
 * CREATE TABLE guestbook (
 *   id BIGSERIAL PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   message TEXT NOT NULL CHECK (char_length(message) <= 280),
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Row Level Security: insert-only for anon, read-only for guestbook
 * ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow anonymous inserts" ON contact_messages
 *   FOR INSERT WITH CHECK (true);
 *
 * ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow anonymous inserts" ON guestbook
 *   FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Allow public reads" ON guestbook
 *   FOR SELECT USING (true);
 *
 * -- Rate limiting via pg_cron or Edge Function recommended for production
 */
