/**
 * Supabase Client Configuration
 * Handles database operations for notifications and announcements.
 * Provides persistent storage for notification tokens and announcement data.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Type definition for announcement data
 */
export type Announcement = {
  id: number
  title: string
  text: string
  created_at: string
}

/**
 * Type definition for notification token data
 */
export type NotificationToken = {
  fid: number
  token: string
  url: string
  created_at: string
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Retrieves all announcements from the database
 * Used for displaying announcements in the UI
 * @returns {Promise<Announcement[]>} Array of announcements
 */
export async function getAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Announcement[]
}

/**
 * Gets the most recent announcement from the database
 * Used for checking if there are new announcements to notify about
 * @returns {Promise<Announcement>} Latest announcement
 */
export async function getLatestAnnouncement() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) throw error
  return data as Announcement
}

/**
 * Saves a notification token to the database
 * @param {NotificationToken} token - Token details without created_at
 * @returns {Promise<void>}
 */
export async function saveNotificationToken(token: Omit<NotificationToken, 'created_at'>) {
  const { error } = await supabase
    .from('notification_tokens')
    .upsert([{ ...token, created_at: new Date().toISOString() }])
  
  if (error) throw error
}

/**
 * Removes a notification token from the database
 * Used when notifications are disabled or tokens become invalid
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<void>}
 */
export async function removeNotificationToken(fid: number) {
  const { error } = await supabase
    .from('notification_tokens')
    .delete()
    .eq('fid', fid)
  
  if (error) throw error
}

/**
 * Retrieves all notification tokens for a user
 * @param {number} fid - Farcaster user ID
 * @returns {Promise<NotificationToken[]>} Array of token details
 */
export async function getNotificationTokens(fid: number) {
  const { data, error } = await supabase
    .from('notification_tokens')
    .select('*')
    .eq('fid', fid)
  
  if (error) throw error
  return data as NotificationToken[]
}
