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

You can also use Python to manage notifications and announcements:

1. **Setup and Configuration**

```python
import requests
import json
from datetime import datetime

class FarcasterNotifications:
    def __init__(self):
        self.supabase_url = "YOUR_SUPABASE_URL"
        self.supabase_key = "YOUR_SUPABASE_KEY"
        self.app_url = "YOUR_APP_URL"

        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        }
```

2. **Create and Send Announcements**

```python
def create_announcement(self, title: str, text: str) -> dict:
    """Create a new announcement in Supabase"""
    data = {
        "title": title,
        "text": text,
        "created_at": datetime.utcnow().isoformat()
    }

    response = requests.post(
        f"{self.supabase_url}/rest/v1/announcements",
        headers=self.headers,
        json=data
    )
    return response.json()

def send_notification(self, fid: int, skip_rate_limit: bool = False) -> dict:
    """Send notification to specific user"""
    headers = {
        "Content-Type": "application/json"
    }
    if skip_rate_limit:
        headers["X-Skip-Rate-Limit"] = "true"

    data = {"fid": fid}

    response = requests.post(
        f"{self.app_url}/api/announcements",
        headers=headers,
        json=data
    )
    return response.json()
```

3. **Bulk Operations Example**

```python
def send_bulk_notifications(self, fids: list[int]) -> dict:
    """Send notifications to multiple users"""
    results = {
        "success": [],
        "failed": [],
        "rate_limited": []
    }

    for fid in fids:
        try:
            response = self.send_notification(fid, skip_rate_limit=True)
            if "successTokens" in response:
                results["success"].append(fid)
            elif "rateLimitedTokens" in response:
                results["rate_limited"].append(fid)
            else:
                results["failed"].append(fid)
        except Exception as e:
            results["failed"].append(fid)

    return results
```

4. **Usage Example**

```python
# Initialize the client
client = FarcasterNotifications()

# Create new announcement
announcement = client.create_announcement(
    title="🚀 New Feature Alert!",
    text="We've just launched our new swap feature!"
)

# Send to specific user
response = client.send_notification(fid=123, skip_rate_limit=True)

# Send to multiple users
fids = [123, 456, 789]
results = client.send_bulk_notifications(fids)
print(f"Success: {len(results['success'])} users")
print(f"Rate Limited: {len(results['rate_limited'])} users")
print(f"Failed: {len(results['failed'])} users")
```

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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

### Supabase Tables

1. **notification_tokens**

```sql
create table notification_tokens (
  id bigint generated by default as identity primary key,
  fid bigint not null,
  token text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create unique index to prevent duplicate tokens per user
create unique index notification_tokens_fid_token_key on notification_tokens(fid, token);
```

2. **announcements**

```sql
create table announcements (
  id bigint generated by default as identity primary key,
  title text not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Farcaster Frames Documentation](https://docs.farcaster.xyz/reference/frames/spec)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
