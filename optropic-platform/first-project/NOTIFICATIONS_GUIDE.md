# Notifications System Guide

## Overview

The Optropic Platform notification system provides real-time alerts for critical events like key expiration, failed verifications, revoked code usage, and suspicious activity. Built with tRPC subscriptions and EventEmitter, it supports both persistent storage and live updates.

## Features

### Core Capabilities
- ✅ **Real-time Updates**: WebSocket-based subscriptions via tRPC
- ✅ **Persistent Storage**: All notifications saved to Supabase
- ✅ **Event-Driven**: Automatic triggers from system events
- ✅ **User-Scoped**: Notifications filtered by user ownership
- ✅ **Read/Unread Tracking**: Mark as read functionality
- ✅ **Scheduled Checks**: Daily key expiry and cleanup jobs

### Notification Types
- **INFO**: General information messages
- **SUCCESS**: Successful operations
- **WARNING**: Important alerts requiring attention
- **CRITICAL**: Urgent security or system issues

### Notification Categories
- **SECURITY**: Security incidents (revoked code usage, breaches)
- **KEY_MANAGEMENT**: Key lifecycle events (expiry, rotation)
- **SCAN**: Verification events (failures, suspicious activity)
- **PROJECT**: Project-related updates
- **SYSTEM**: System health and maintenance

## API Reference

### `notifications.list`
Get notifications for the current user.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  limit?: number;    // 1-100, default: 50
  offset?: number;   // default: 0
  isRead?: boolean;  // filter by read status
}

Output: {
  notifications: Array<{
    id: number;
    userId: number;
    type: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
    title: string;
    message: string;
    metadata: any;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }>;
  total: number;
}
```

**Example**:
```typescript
// Get unread notifications
const { notifications, total } = await trpc.notifications.list.query({
  limit: 20,
  isRead: false
});

console.log(`${total} unread notifications`);
```

---

### `notifications.getUnreadCount`
Get count of unread notifications.

**Type**: `query`
**Auth**: Required

```typescript
Output: number
```

**Example**:
```typescript
const count = await trpc.notifications.getUnreadCount.query();
console.log(`${count} unread`);
```

---

### `notifications.markAsRead`
Mark a single notification as read.

**Type**: `mutation`
**Auth**: Required

```typescript
Input: {
  id: number;
}

Output: NotificationDTO
```

**Example**:
```typescript
await trpc.notifications.markAsRead.mutate({ id: 123 });
```

---

### `notifications.markAllAsRead`
Mark all notifications as read for the current user.

**Type**: `mutation`
**Auth**: Required

```typescript
Output: {
  count: number;
}
```

**Example**:
```typescript
const { count } = await trpc.notifications.markAllAsRead.mutate();
console.log(`Marked ${count} notifications as read`);
```

---

### `notifications.subscribe`
Real-time subscription for new notifications.

**Type**: `subscription`
**Auth**: Required

```typescript
Output: Observable<{
  type: "new" | "update" | "bulk_update";
  payload: NotificationDTO | { userId: number; count: number };
}>
```

**Example**:
```typescript
// React component
useEffect(() => {
  const subscription = trpc.notifications.subscribe.subscribe(undefined, {
    onData: (event) => {
      if (event.type === 'new') {
        toast.info(event.payload.message);
        queryClient.invalidateQueries(['notifications']);
      }
    },
    onError: (err) => {
      console.error('Subscription error:', err);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

---

### `notifications.create`
Manually create a notification (typically used by system).

**Type**: `mutation`
**Auth**: Required

```typescript
Input: {
  type: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  title: string;
  message: string;
  metadata?: Record<string, any>;
  link?: string;
}
```

**Example**:
```typescript
await trpc.notifications.create.mutate({
  type: "INFO",
  title: "Export Complete",
  message: "Your data export is ready for download",
  link: "/downloads/export-2024-10-05.zip"
});
```

## Automatic Triggers

### Key Expiry Notifications
Automatically sent 7 days before key expiration.

**Trigger**: Daily scheduled job
**Recipients**: Project owners
**Type**: WARNING

```typescript
// Manually trigger (admin only)
await trpc.notifications.triggerKeyExpiryCheck.mutate({ days: 7 });
```

**Example Notification**:
```
Title: Key Expiring Soon
Message: Key "Production Signing Key" in project "Widget Auth" expires in 7 days.
Link: /keys
```

---

### Failed Verification
Sent when code verification fails.

**Trigger**: Verification failure in `VerificationService.verifyCode()`
**Recipients**: Project owners
**Type**: WARNING

```typescript
// Triggered automatically
await NotificationService.triggerFailedVerification(
  codeId,
  userId,
  "Signature mismatch"
);
```

**Example Notification**:
```
Title: Verification Failed
Message: Code verification failed in project "Widget Auth": Signature mismatch.
Link: /projects/1
```

---

### Revoked Code Usage
Critical alert when a revoked code is scanned.

**Trigger**: Scan attempt on revoked code
**Recipients**: Project owners
**Type**: CRITICAL

```typescript
// Triggered automatically
await NotificationService.triggerRevokedCodeUsage(codeId, userId);
```

**Example Notification**:
```
Title: Revoked Code Scanned
Message: A revoked code was scanned in project "Widget Auth". This may indicate a security issue.
Link: /projects/1
```

---

### Suspicious Activity
Alert for unusual scan patterns.

**Trigger**: Analytics anomaly detection
**Recipients**: Project owners
**Type**: CRITICAL

```typescript
await NotificationService.triggerSuspiciousActivity(
  projectId,
  userId,
  {
    suspiciousScans: 150,
    timeWindow: "1h",
    suspiciousIPs: [
      { ip: "192.168.1.1", count: 50 },
      { ip: "10.0.0.1", count: 100 }
    ]
  }
);
```

**Example Notification**:
```
Title: Suspicious Activity Detected
Message: 150 suspicious scans detected in project "Widget Auth" over 1h. Top IPs: 192.168.1.1 (50 scans), 10.0.0.1 (100 scans)
Link: /projects/1
```

---

### Key Rotated
Info notification when a key is rotated.

**Trigger**: Key rotation via `KeyService.rotateKey()`
**Recipients**: Project owners
**Type**: INFO

```typescript
await NotificationService.triggerKeyRotated(oldKeyId, newKeyId, userId);
```

**Example Notification**:
```
Title: Key Rotated
Message: Key "Production Signing Key" has been rotated. New key ID: 456.
Link: /keys
```

---

### High Failure Rate
Warning when verification failure rate exceeds threshold.

**Trigger**: Manual or scheduled analytics check
**Recipients**: Project owners
**Type**: WARNING

```typescript
await NotificationService.triggerHighFailureRate(
  projectId,
  userId,
  25.5,  // 25.5% failure rate
  "24h"
);
```

**Example Notification**:
```
Title: High Verification Failure Rate
Message: Project "Widget Auth" has a 25.5% failure rate over 24h.
Link: /projects/1
```

## Frontend Integration

### React Hook Example

```typescript
import { trpc } from '@/trpc/react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useNotifications() {
  const utils = trpc.useUtils();

  // Get notifications list
  const { data: notifications } = trpc.notifications.list.useQuery({
    limit: 10,
    isRead: false
  });

  // Get unread count
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery();

  // Mark as read mutation
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    }
  });

  // Mark all as read mutation
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    }
  });

  // Real-time subscription
  useEffect(() => {
    const subscription = trpc.notifications.subscribe.subscribe(undefined, {
      onData: (event) => {
        if (event.type === 'new') {
          const notification = event.payload as any;

          // Show toast
          if (notification.type === 'CRITICAL') {
            toast.error(notification.message);
          } else if (notification.type === 'WARNING') {
            toast.warn(notification.message);
          } else {
            toast.info(notification.message);
          }

          // Invalidate queries to refresh UI
          utils.notifications.list.invalidate();
          utils.notifications.getUnreadCount.invalidate();
        }
      },
      onError: (err) => {
        console.error('Notification subscription error:', err);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    notifications: notifications?.notifications || [],
    unreadCount: unreadCount || 0,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate
  };
}
```

### Notification Center Component

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from 'lucide-react';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="relative">
      <button className="relative">
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-sm text-blue-600"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                markAsRead({ id: notification.id });
                if (notification.link) {
                  window.location.href = notification.link;
                }
              }}
            >
              <div className="flex items-start gap-2">
                <NotificationIcon type={notification.type} />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(notification.createdAt)} ago
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Scheduled Jobs

### Setup

```typescript
// In your server entry point (e.g., server/index.ts)
import { initializeScheduledJobs } from './jobs/keyExpiryCheck';

// After server starts
initializeScheduledJobs();
```

### Job Configuration

**Key Expiry Check**
- **Frequency**: Daily
- **Action**: Check for keys expiring in < 7 days
- **Notifications**: WARNING type to project owners

**Notification Cleanup**
- **Frequency**: Weekly (Sundays at 3 AM)
- **Action**: Delete read notifications older than 90 days
- **Purpose**: Database maintenance

### Manual Triggers

```typescript
import { runKeyExpiryCheck, runNotificationCleanup } from './jobs/keyExpiryCheck';

// Run immediately
await runKeyExpiryCheck(7);  // Check 7 days ahead
await runNotificationCleanup(90);  // Delete > 90 days old
```

## Integration with Existing Services

### KeyService Integration

```typescript
// In KeyService.rotateKey()
const newKey = await KeyService.rotateKey(keyId);

// Send notification
await NotificationService.triggerKeyRotated(
  keyId,
  newKey.id,
  ctx.user.id
);
```

### VerificationService Integration

```typescript
// In VerificationService.verifyCode()
if (!isValid) {
  await NotificationService.triggerFailedVerification(
    code.id,
    code.project.userId,
    "Signature mismatch"
  );
}

if (!code.isActive) {
  await NotificationService.triggerRevokedCodeUsage(
    code.id,
    code.project.userId
  );
}
```

### AnalyticsService Integration

```typescript
// In AnalyticsService.detectAnomalies()
if (anomaly.hasAnomaly) {
  const suspicious = await VerificationService.detectSuspiciousActivity(
    projectId,
    24
  );

  await NotificationService.triggerSuspiciousActivity(
    projectId,
    project.userId,
    {
      suspiciousScans: suspicious.totalSuspicious,
      timeWindow: "24h",
      suspiciousIPs: suspicious.suspiciousIPs
    }
  );
}
```

## Security Considerations

### Access Control
- ✅ All endpoints require authentication
- ✅ Notifications filtered by user ownership
- ✅ Users can only mark their own notifications as read
- ✅ Subscriptions scoped to authenticated user

### Data Privacy
- ✅ No sensitive data in notification messages
- ✅ Code values truncated in messages
- ✅ Metadata stored as JSONB (not exposed to UI unless needed)
- ✅ Links point to detail pages, not direct data

### Rate Limiting
Consider implementing rate limits for:
- Subscription connections (max per user)
- Notification creation (prevent spam)
- Mark as read operations (prevent abuse)

## Best Practices

### 1. Use Appropriate Types
```typescript
// ✅ Good
await NotificationService.create({
  type: "CRITICAL",  // For security issues
  title: "Security Alert",
  message: "..."
});

// ❌ Avoid
await NotificationService.create({
  type: "INFO",  // Too casual for security
  title: "Security Alert",
  message: "..."
});
```

### 2. Include Actionable Links
```typescript
// ✅ Good
await NotificationService.create({
  message: "Key expiring soon",
  link: "/keys"  // User can take action
});

// ❌ Avoid
await NotificationService.create({
  message: "Key expiring soon"  // No clear next step
});
```

### 3. Add Context in Metadata
```typescript
// ✅ Good
await NotificationService.create({
  message: "Verification failed",
  metadata: {
    codeId: 123,
    projectId: 1,
    failureReason: "Signature mismatch",
    timestamp: new Date()
  }
});
```

### 4. Handle Errors Gracefully
```typescript
// ✅ Good: Don't break main flow
NotificationService.triggerRevokedCodeUsage(codeId, userId)
  .catch(err => console.error('Notification failed:', err));

// ❌ Avoid: Unhandled promise
NotificationService.triggerRevokedCodeUsage(codeId, userId);
```

## Troubleshooting

### Subscriptions Not Working
```typescript
// Check WebSocket connection
const wsUrl = process.env.VITE_WS_URL || 'ws://localhost:3000';
console.log('WebSocket URL:', wsUrl);

// Verify subscription setup
trpc.notifications.subscribe.subscribe(undefined, {
  onStarted: () => console.log('Subscription started'),
  onData: (data) => console.log('Received:', data),
  onError: (err) => console.error('Error:', err),
  onStopped: () => console.log('Subscription stopped')
});
```

### Notifications Not Appearing
```typescript
// Check event emitter
import { notifier } from './services/notificationService';

notifier.on('notification:new', (notification) => {
  console.log('Emitted:', notification);
});

// Verify database storage
const notifications = await db.notification.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5
});
console.log('Recent notifications:', notifications);
```

### Scheduled Jobs Not Running
```typescript
// Check job initialization
console.log('Jobs initialized at:', new Date());

// Manually trigger
import { runKeyExpiryCheck } from './jobs/keyExpiryCheck';
await runKeyExpiryCheck(7);
```

---

**Built with 🔔 by AiO.digital - Secure Touchpoint Ecosystem**
