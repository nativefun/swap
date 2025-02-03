## Introduction

This frame enables swaps and announcements.
It is built and customized for $NATIVE, but feel free to fork and use for your own projects (MIT-license).
For swaps, the fee is currently set to 25, split between Native and @nonomnouns with a 1% sponsorship fee to Splits.

## Credits

Initial developer: [@nonomnouns](https://github.com/nonomnouns).
Built as response to [bounty opened by Derek](https://www.bountycaster.xyz/bounty/0x029f96d23f7f41d1763de356fd1f68bc3a634b7f) and inspired by Dan Romero's original cast [here](https://warpcast.com/dwr.eth/0x7758a71c).

## Features

### 🔄 Token Swapping

- Swap ETH to NATIVE tokens on Base chain
- Real-time price updates
- Transaction status tracking
- Affiliate fee integration

### 📢 Notifications & Announcements

The frame supports various types of notifications following the [Farcaster Frames v2 Specification](https://docs.farcaster.xyz/developers/frames/v2/spec):

#### Notification Events in route.ts

The notifications handler supports these webhook events:

1. **frame_added**: When user adds the frame

```typescript
type EventFrameAddedPayload = {
    event: "frame_added";
    notificationDetails?: {
        url: string; // Notification endpoint URL
        token: string; // Auth token for sending notifications
    };
};
```

2. **frame_removed**: When user removes the frame

```typescript
{
    event: "frame_removed";
}
```

3. **notifications_enabled/disabled**: When user toggles notifications

```typescript
type EventNotificationsEnabledPayload = {
    event: "notifications_enabled";
    notificationDetails: {
        url: string;
        token: string;
    };
};
```

#### Rate Limiting

When sending notifications, the server will respond with:

- `successTokens`: Successfully sent notifications
- `invalidTokens`: Tokens that should not be used again
- `rateLimitedTokens`: Tokens that exceeded rate limit

To bypass rate limits for important notifications, use:

```bash
curl -X POST '[YOUR_APP_URL]/api/announcements' \
-H "Content-Type: application/json" \
-H "X-Skip-Rate-Limit: true" \
-d '{
  "fid": [USER_FID]
}'
```

#### Managing Announcements

You can manage announcements using the API endpoints:

1. Create a new announcement (POST to Supabase):

```bash
curl -X POST '[SUPABASE_URL]/rest/v1/announcements' \
-H "apikey: [YOUR_KEY]" \
-H "Authorization: Bearer [YOUR_KEY]" \
-H "Content-Type: application/json" \
-d '{
  "title": "🎉 New Feature Alert!",
  "text": "Check out our latest updates!",
  "created_at": "2024-02-09T12:00:00Z"
}'
```

2. Send notifications to users:

```bash
curl -X POST '[YOUR_APP_URL]/api/announcements' \
-H "Content-Type: application/json" \
-H "X-Skip-Rate-Limit: true" \
-d '{
  "fid": [USER_FID]
}'
```

3. Get all announcements:

```bash
curl -X GET '[YOUR_APP_URL]/api/announcements' \
-H "Content-Type: application/json"
```

#### Python Script Examples

You can use this Python script to manage notifications and announcements:

```python
import requests
import time
import json

# Configuration
SUPABASE_URL = "https://mock-supabase-url.example.com"  # Mock Supabase URL
SUPABASE_KEY = "mock-supabase-key-1234567890"  # Mock Supabase API key
APP_URL = "https://mock-app-url.example.com"  # Mock application URL

def get_all_fids():
    """Fetch all FIDs from Supabase"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/notification_tokens?select=fid",
        headers=headers
    )
    
    if response.status_code == 200:
        return [item['fid'] for item in response.json()]
    else:
        print(f"Error getting FIDs: {response.status_code}")
        return []

def send_announcement_to_user(fid):
    """Send an announcement to a single user"""
    headers = {
        "Content-Type": "application/json",
        "X-Skip-Rate-Limit": "true"
    }
    
    data = {
        "fid": fid
    }
    
    response = requests.post(
        f"{APP_URL}/api/announcements",
        headers=headers,
        json=data
    )
    
    return response.status_code == 200

def create_announcement(title, text):
    """Create a new announcement in Supabase"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    data = {
        "title": title,
        "text": text,
        "created_at": time.strftime('%Y-%m-%dT%H:%M:%SZ')
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/announcements",
        headers=headers,
        json=data
    )
    
    return response.status_code == 201

def main():
    # 1. Create a new announcement
    announcement_title = "🎉 New Features Released!"
    announcement_text = "We've just released exciting new features for NativeSwap. Check them out!"
    
    print("Creating new announcement...")
    if create_announcement(announcement_title, announcement_text):
        print("Announcement created successfully!")
    else:
        print("Failed to create announcement")
        return

    # 2. Fetch all FIDs
    print("\nGetting all FIDs...")
    fids = get_all_fids()
    print(f"Found {len(fids)} users")

    # 3. Send to all users
    success_count = 0
    fail_count = 0

    print("\nSending notifications to users...")
    for i, fid in enumerate(fids, 1):
        print(f"Processing {i}/{len(fids)}: FID {fid}", end=" ")
        
        if send_announcement_to_user(fid):
            print("✅")
            success_count += 1
        else:
            print("❌")
            fail_count += 1
        
        # Small delay between requests
        time.sleep(0.5)

    # 4. Print summary
    print("\nNotification Summary:")
    print(f"Total Users: {len(fids)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {fail_count}")

if __name__ == "__main__":
    main()

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

For local development and testing with Farcaster Frames, you'll need to expose your local server using ngrok:

1. Install ngrok:
```bash
# Using npm
npm install ngrok -g

# Using chocolatey (Windows)
choco install ngrok

# Using homebrew (macOS)
brew install ngrok
```

2. Start your local server (default port 3000):
```bash
npm run dev
```

3. In a new terminal, start ngrok:
```bash
ngrok http 3000
```

4. Copy the HTTPS URL provided by ngrok (e.g., `https://your-ngrok-url.ngrok.io`)

5. Update your environment variables:
```env
NEXT_PUBLIC_URL=https://your-ngrok-url.ngrok.io
```

6. Test your Frame:
- Go to [Warpcast Frame Development](https://warpcast.com/~/developers/frames)
- Paste your ngrok URL into the frame URL field
- Click "Test frame" to preview and debug your frame

Note: The ngrok URL changes each time you restart ngrok. For persistent URLs, consider upgrading to a paid ngrok plan or using a production deployment.

You can access your local development server at [http://localhost:3000](http://localhost:3000) and the ngrok-exposed version at your ngrok URL.

## Dependencies

### Summary

- Next.js 14 with App Router
- Supabase for data storage
- Upstash Redis for caching
- Farcaster Frame SDK
- 0x Protocol for swaps
- Moralis for token data
- Neynar for Farcaster data

### Environment Variables

Create a `.env` file with the following variables:

```env
NEXT_PUBLIC_URL=your_app_url
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
NEYNAR_API_KEY=your_neynar_key
ZEROX_API_KEY=your_0x_key
NEXT_PUBLIC_MORALIS_API_KEY=your_moralis_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Database Schema

### Supabase Setup

To set up the database tables in Supabase, follow these steps:

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste the following SQL:

```sql
-- Announcements table
create table announcements (
  id bigint generated by default as identity primary key,
  title text not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notification tokens table
create table notification_tokens (
  fid bigint not null,
  token text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (fid, token)
);

-- Optional: Add some test data
insert into announcements (title, text) values 
('🎉 Welcome to NativeSwap!', 'We are excited to launch our new swap platform.'),
('📢 New Features', 'Check out our latest updates and improvements.');
```

This setup creates:
1. `announcements` table for storing platform announcements
2. `notification_tokens` table for managing user notification preferences
3. Sample announcement data

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Farcaster Frames Documentation](https://docs.farcaster.xyz/reference/frames/spec)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
