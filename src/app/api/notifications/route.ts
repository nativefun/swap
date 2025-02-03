/**
 * Notifications API Route
 * Handles sending notifications to Farcaster users who have enabled notifications for the frame.
 * Implements the Frames v2 notification protocol with proper error handling and rate limiting.
 */
import { NextRequest } from 'next/server'
import { getNotificationTokens, removeNotificationToken } from '@/lib/supbase/client'
import { getCachedNotificationToken, removeCachedNotificationToken } from '@/lib/kv/client'
import { z } from 'zod'

/**
 * Validation schema for notification requests
 * Enforces Frames v2 size limits:
 * - title: max 32 characters
 * - body: max 128 characters
 * - notificationId: max 128 characters (used for idempotency)
 */
const notificationSchema = z.object({
  fid: z.number(),
  title: z.string().max(32),
  body: z.string().max(128),
  notificationId: z.string().max(128)
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
 * Type definition for notification data
 * Matches the Frames v2 notification request format
 */
type NotificationData = {
  fid: number;
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
}

/**
 * Sends a notification to a Farcaster client
 * Handles response validation and token management according to Frames v2 spec
 * @param {string} url - The notification endpoint URL
 * @param {string} token - The notification token
 * @param {NotificationData} data - The notification content
 * @param {boolean} skipRateLimit - Whether to skip rate limit checks
 * @returns {Promise<boolean>} True if notification was successful
 */
async function sendNotification(url: string, token: string, data: NotificationData, skipRateLimit: boolean = false) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        tokens: [token]
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Handle response according to Frames v2 spec
    if (result.result) {
      const { successfulTokens, invalidTokens, rateLimitedTokens } = result.result
      
      // Clean up invalid tokens
      if (invalidTokens?.length > 0) {
        await Promise.all(
          invalidTokens.map((invalidToken: string) => removeInvalidToken(data.fid, invalidToken))
        )
      }
      
      // Return success only if we have successful tokens
      if (successfulTokens?.length > 0) {
        return true
      }
      
      // Handle rate limited tokens according to spec
      if (rateLimitedTokens?.length > 0 && !skipRateLimit) {
        throw new Error('Rate limited')
      }

      // If skipping rate limit, consider it a success even if rate limited
      if (skipRateLimit && rateLimitedTokens?.length > 0) {
        return true
      }
    }
    
    return false
  } catch (error: unknown) {
    console.error('Failed to send notification:', error)
    throw error
  }
}

/**
 * POST /api/notifications
 * Main notification endpoint that handles:
 * - Request validation
 * - Token retrieval (Redis cache with Supabase fallback)
 * - Notification sending with retries
 * - Error handling and rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    const skipRateLimit = request.headers.get('X-Skip-Rate-Limit') === 'true'
    const body = await request.json()
    const result = notificationSchema.safeParse(body)
    
    if (!result.success) {
      return Response.json({ 
        success: false, 
        errors: result.error.errors 
      }, { status: 400 })
    }

    const { fid, title, body: notifBody, notificationId } = result.data
    
    // Try Redis cache first for better performance
    const cached = await getCachedNotificationToken(fid)
    if (cached) {
      const { token, url } = cached
      const success = await sendNotification(url, token, {
        fid,
        notificationId,
        title,
        body: notifBody,
        targetUrl: process.env.NEXT_PUBLIC_URL!
      }, skipRateLimit)
      
      if (success) {
        return Response.json({ success: true })
      }
    }

    // Fallback to Supabase if cache miss or notification failed
    const tokens = await getNotificationTokens(fid)
    if (!tokens.length) {
      return new Response('No notification tokens found', { status: 404 })
    }

    // Try all available tokens (usually just one)
    const results = await Promise.allSettled(
      tokens.map(({ token, url }) =>
        sendNotification(url, token, {
          fid,
          notificationId,
          title,
          body: notifBody,
          targetUrl: process.env.NEXT_PUBLIC_URL!
        }, skipRateLimit)
      )
    )

    // Consider success if any token worked
    const successful = results.some(
      result => result.status === 'fulfilled' && result.value === true
    )
    
    if (!successful) {
      throw new Error('All notification attempts failed')
    }

    return Response.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Rate limited' && !request.headers.get('X-Skip-Rate-Limit')) {
      return Response.json({ 
        success: false, 
        error: 'Rate limited. Please try again later.' 
      }, { status: 429 })
    }
    
    console.error('Failed to send notification:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 