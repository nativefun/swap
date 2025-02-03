/**
 * Announcements API Route
 * Handles fetching announcements and sending notifications for new announcements.
 * Implements announcement tracking and notification delivery using Redis for caching
 * and Supabase for persistence.
 */
import { NextRequest } from 'next/server'
import { getAnnouncements, getLatestAnnouncement, removeNotificationToken } from '@/lib/supbase/client'
import { getLastSeenAnnouncementId, setLastSeenAnnouncementId, getCachedNotificationToken, removeCachedNotificationToken } from '@/lib/kv/client'
import { z } from 'zod'

/**
 * Validation schema for announcement check requests
 * Requires only the Farcaster user ID (fid)
 */
const announcementRequestSchema = z.object({
  fid: z.number()
})

/**
 * Removes an invalid notification token from both Redis cache and Supabase
 * Called when a token is reported as invalid by the Farcaster client
 * @param {number} fid - Farcaster user ID
 * @param {string} token - The invalid token to remove
 */
async function removeInvalidToken(fid: number, token: string) {
  try {
    // Remove from both Supabase and Redis
    await Promise.all([
      removeNotificationToken(fid),
      removeCachedNotificationToken(fid)
    ])
  } catch (error) {
    console.error('Failed to remove invalid token:', error)
  }
}

/**
 * Sends a notification about a new announcement to a user
 * Handles token validation and notification delivery according to Frames v2 spec
 * @param {number} fid - Farcaster user ID
 * @param {Object} announcement - The announcement to notify about
 * @param {number} announcement.id - Announcement ID
 * @param {string} announcement.title - Announcement title
 * @param {string} announcement.text - Announcement content
 * @returns {Promise<boolean>} True if notification was successful
 */
async function sendAnnouncementNotification(fid: number, announcement: { id: number, title: string, text: string }) {
  const cached = await getCachedNotificationToken(fid)
  if (!cached) return false

  const { token, url } = cached
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: `announcement:${announcement.id}`,
        title: announcement.title,
        body: announcement.text,
        targetUrl: process.env.NEXT_PUBLIC_URL!,
        tokens: [token]
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to send announcement notification: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Handle response according to Frames v2 spec
    if (result.result) {
      const { successfulTokens, invalidTokens, rateLimitedTokens } = result.result
      
      // Clean up invalid tokens
      if (invalidTokens?.length > 0) {
        await Promise.all(
          invalidTokens.map((invalidToken: string) => removeInvalidToken(fid, invalidToken))
        )
      }
      
      // Return success only if we have successful tokens
      if (successfulTokens?.length > 0) {
        return true
      }
      
      // Handle rate limited tokens according to spec
      if (rateLimitedTokens?.length > 0) {
        throw new Error('Rate limited')
      }
    }
    
    return false
  } catch (error: unknown) {
    console.error('Failed to send announcement notification:', error)
    if (error instanceof Error && error.message === 'Rate limited') {
      throw error
    }
    return false
  }
}

/**
 * GET /api/announcements
 * Retrieves all announcements from the database
 * Used for displaying announcements in the UI
 */
export async function GET() {
  try {
    const announcements = await getAnnouncements()
    return Response.json(announcements)
  } catch (error: unknown) {
    console.error('Failed to get announcements:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

/**
 * POST /api/announcements
 * Checks for new announcements and sends notifications if needed
 * Implements announcement tracking using Redis for last seen IDs
 * Features:
 * - Request validation
 * - Last seen tracking
 * - Notification sending with proper error handling
 * - Rate limit handling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = announcementRequestSchema.safeParse(body)
    
    if (!result.success) {
      return Response.json({ 
        success: false, 
        errors: result.error.errors 
      }, { status: 400 })
    }

    const { fid } = result.data

    // Get user's last seen announcement and latest announcement
    const lastSeenId = await getLastSeenAnnouncementId(fid)
    const latestAnnouncement = await getLatestAnnouncement()

    // Check if there are new announcements to notify about
    if (!lastSeenId || lastSeenId < latestAnnouncement.id) {
      try {
        // Send notification for new announcement
        const success = await sendAnnouncementNotification(fid, latestAnnouncement)
        
        if (success) {
          // Update last seen only if notification was successful
          await setLastSeenAnnouncementId(fid, latestAnnouncement.id)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Rate limited') {
          return Response.json({
            success: false,
            error: 'Rate limited. Please try again later.',
            lastSeenId,
            latestAnnouncement
          }, { status: 429 })
        }
        throw error
      }
    }

    return Response.json({
      success: true,
      lastSeenId,
      latestAnnouncement
    })
  } catch (error: unknown) {
    console.error('Failed to process announcement:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 