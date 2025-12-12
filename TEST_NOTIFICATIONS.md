# Testing Driver Application Notifications

## ✅ Implementation Complete

All notification hooks have been added to the driver application flow:

### 1. **Driver Applies to Company** (`applyToCompany`)

- ✅ Push notification sent to company
- ✅ In-app notification created
- 📧 Message: "🚗 New Driver Application"
- 🎯 Action: Opens `/driver-applications`

### 2. **Company Accepts Application** (`acceptDriverApplication`)

- ✅ Push notification sent to driver
- ✅ In-app notification created
- 📧 Message: "🎉 Application Accepted!"
- 🎯 Action: Opens `/company/{companyId}`

### 3. **Company Rejects Application** (`rejectDriverApplication`)

- ✅ Push notification sent to driver
- ✅ In-app notification created
- 📧 Message: "Application Status Update"
- 🎯 No action URL (informational only)

---

## 🧪 How to Test

### Method 1: Test with Seed Endpoint

```bash
# Get your user ID from the login response or database
# Then seed test notifications

POST http://localhost:3002/api/v1/test/seed-notifications/{userId}

# Example:
curl -X POST http://localhost:3002/api/v1/test/seed-notifications/06366cb6-e402-40a9-94d9-5c0513bf8883

# Response:
{
  "success": true,
  "message": "✅ Successfully seeded 10 notifications for user ...",
  "data": {
    "total": 10,
    "unread": 10
  }
}
```

### Method 2: Test Real Flow

#### Step 1: Driver Applies to Company

```bash
# As a driver, apply to a company
POST http://localhost:3002/api/v1/drivers/apply-to-company
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "companyId": "company-uuid-here",
  "message": "I would like to join your company"
}

# Check company notifications:
GET http://localhost:3002/api/v1/notifications
Authorization: Bearer {company_token}
```

#### Step 2: Company Accepts Application

```bash
# As company, accept the application
POST http://localhost:3002/api/v1/delivery-company/applications/{applicationId}/accept
Authorization: Bearer {company_token}

# Check driver notifications:
GET http://localhost:3002/api/v1/notifications
Authorization: Bearer {driver_token}
```

#### Step 3: Company Rejects Application

```bash
# As company, reject the application
POST http://localhost:3002/api/v1/delivery-company/applications/{applicationId}/reject
Authorization: Bearer {company_token}

# Check driver notifications:
GET http://localhost:3002/api/v1/notifications
Authorization: Bearer {driver_token}
```

### Method 3: Clear Notifications

```bash
# Clear all notifications for a user
POST http://localhost:3002/api/v1/test/clear-notifications/{userId}

# Example:
curl -X POST http://localhost:3002/api/v1/test/clear-notifications/06366cb6-e402-40a9-94d9-5c0513bf8883
```

---

## 📱 Frontend Testing

Your app already fetches notifications. After backend operations:

```typescript
// Notifications appear automatically via:
// 1. useRealtimeNotifications hook
// 2. API polling every 30 seconds
// 3. Pull-to-refresh on company dashboard

// Check logs:
LOG  📬 Fetching notifications (page: 1, limit: 50)
LOG  ✅ Fetched X notifications, Y unread
```

### View Notifications in App

1. Open Company Dashboard
2. Check notification bell icon (top right)
3. Badge shows unread count
4. Tap to see notification list

---

## 🔍 Verify Notifications

### Database Check

```sql
-- Check notifications table
SELECT * FROM notifications
WHERE "userId" = 'your-user-id'
ORDER BY "createdAt" DESC;

-- Check unread count
SELECT COUNT(*) FROM notifications
WHERE "userId" = 'your-user-id' AND "isRead" = false;
```

### API Response

```json
{
  "notifications": [
    {
      "id": "notification-uuid",
      "userId": "user-uuid",
      "title": "🚗 New Driver Application",
      "message": "John Doe wants to join Swift Logistics",
      "type": "driver",
      "isRead": false,
      "actionUrl": "/driver-applications",
      "data": {
        "applicationId": "app-uuid",
        "driverUserId": "driver-uuid",
        "driverName": "John Doe",
        "companyId": "company-uuid"
      },
      "createdAt": "2025-12-11T18:35:04.214Z"
    }
  ],
  "unread": 1,
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

## 🎯 Expected Behavior

### When Driver Applies:

1. Company receives push notification (if app in background)
2. Company receives in-app notification
3. Badge count increases
4. Notification center shows new entry
5. Tap notification → Navigate to Driver Applications screen

### When Company Accepts:

1. Driver receives push notification
2. Driver receives in-app notification
3. Driver's notification badge increases
4. Tap notification → Navigate to company profile

### When Company Rejects:

1. Driver receives push notification
2. Driver receives in-app notification
3. No navigation action (informational)

---

## 🐛 Troubleshooting

### No notifications appearing?

1. **Check user ID**: Make sure using correct userId

```bash
# Get your user ID from login
POST http://localhost:3002/api/v1/auth/login
```

2. **Check backend logs**: Look for these messages

```
✅ Sent application notification to company {userId}
✅ Sent acceptance notification to driver {userId}
📧 Sent rejection notification to driver {userId}
```

3. **Verify notification service**: Test seed endpoint

```bash
curl -X POST http://localhost:3002/api/v1/test/seed-notifications/{your-user-id}
```

4. **Check database**: Query notifications table directly

5. **Frontend console**: Look for these logs

```
📬 Fetching notifications (page: 1, limit: 50)
✅ Fetched X notifications, Y unread
```

### Push notifications not working?

- Push notifications require Expo Go or standalone build
- In development: Only in-app notifications work
- Log message: `⚠️ Push notifications not available in Expo Go`

---

## 📊 Notification Types

| Type         | Use Case                     | Has Action URL |
| ------------ | ---------------------------- | -------------- |
| `driver`     | Driver-related notifications | ✅ Yes         |
| `invitation` | Application accept/reject    | Sometimes      |
| `order`      | Order updates                | ✅ Yes         |
| `system`     | System messages              | ❌ No          |
| `payment`    | Payment notifications        | ✅ Yes         |
| `alert`      | Important alerts             | Sometimes      |

---

## ✨ Quick Test Command

```bash
# Replace with your actual user ID
USER_ID="06366cb6-e402-40a9-94d9-5c0513bf8883"

# Seed notifications
curl -X POST "http://localhost:3002/api/v1/test/seed-notifications/$USER_ID"

# Verify in app or via API
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3002/api/v1/notifications"
```

---

## 🎉 Success Indicators

- ✅ Backend logs show notification sent
- ✅ Database has notification record
- ✅ API returns notification in list
- ✅ App shows unread badge count
- ✅ Notification appears in notification center
- ✅ Tap navigation works (if applicable)

---

**All notifications are now fully implemented! 🚀**
