# 🎬 YurBuster Payment Recovery - Your Action Items

## Your Request
Recover 16 payment orders from April 13-14, 2026 (Flow, Webpay, Khipu, Mach) and reflect them in the admin panel.

## ✅ What's Ready

- **API Endpoint**: `POST /api/admin/recover-payments` (deployed)
- **Recovery Scripts**: Ready to process your data
- **Documentation**: Complete guides available

## 📋 What You Need to Provide

To recover your 16 payments, compile them in this exact format:

### JSON Template

Save this as `my_payments.json`:

```json
[
  {
    "orderId": "ORDER_ID_1",
    "timestamp": "2026-04-13T10:30:00Z",
    "amount": 5000,
    "videoId": "VIDEO_UUID_1",
    "userId": "USER_UUID_1",
    "paymentMethod": "Webpay"
  },
  {
    "orderId": "ORDER_ID_2",
    "timestamp": "2026-04-13T11:15:00Z",
    "amount": 3000,
    "videoId": "VIDEO_UUID_2",
    "userId": "USER_UUID_2",
    "paymentMethod": "Khipu"
  },
  ...
  (14 more payments)
]
```

### For Each of Your 16 Payments, Provide

| Field | Example | Where to Get It |
|-------|---------|-----------------|
| `orderId` | `flow_2026041301` | From Flow.cl transaction ID |
| `timestamp` | `2026-04-13T10:30:45Z` | Payment completion time from provider |
| `amount` | `5000` | Total amount paid in CLP |
| `videoId` | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | From your database (video UUID) |
| `userId` | `x9y8z7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k4` | From your database (user UUID) |
| `paymentMethod` | `Webpay` | Webpay, Khipu, Mach, or Flow |

### How to Get UUIDs from Database

**Option 1: Using SQLite directly (on server)**

```bash
# SSH to server
ssh root@144.126.150.81
password: reyderscg87

# Query users
sqlite3 /var/www/yurbuster-app/backend/prisma/database.sqlite
> SELECT id, username, email FROM users;

# Find specific user
> SELECT id FROM users WHERE username = 'javiera';

# Find videos
> SELECT id, title FROM videos;

# Find video by title
> SELECT id FROM videos WHERE title LIKE '%pendejo%';

# Exit
> .quit
```

**Option 2: Using Node.js REPL (easier)**

```bash
ssh root@144.126.150.81
cd /var/www/yurbuster-app/backend
node

// In REPL:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Find user by username
await prisma.user.findUnique({ where: { username: 'javiera' } });

// Find video by title
await prisma.video.findMany({ where: { title: { contains: 'pendejo' } } });

// Exit with Ctrl+C
```

### Example: Your 4 Videos

Based on your mentioned videos, you might have entries like:

```json
[
  {
    "orderId": "webpay_20260413_001",
    "timestamp": "2026-04-13T10:30:45Z",
    "amount": 5000,
    "videoId": "PUT_ACTUAL_VIDEO_UUID_HERE",
    "userId": "PUT_JAVIERA_USER_UUID_HERE",
    "paymentMethod": "Webpay"
  },
  {
    "orderId": "khipu_20260413_002",
    "timestamp": "2026-04-13T11:15:30Z",
    "amount": 3000,
    "videoId": "PUT_ACTUAL_VIDEO_UUID_HERE",
    "userId": "PUT_GATADOLCE_USER_UUID_HERE",
    "paymentMethod": "Khipu"
  },
  {
    "orderId": "mach_20260413_003",
    "timestamp": "2026-04-13T14:45:20Z",
    "amount": 4000,
    "videoId": "PUT_ACTUAL_VIDEO_UUID_HERE",
    "userId": "PUT_DONPOOL_USER_UUID_HERE",
    "paymentMethod": "Mach"
  },
  {
    "orderId": "webpay_20260413_004",
    "timestamp": "2026-04-13T16:20:10Z",
    "amount": 2000,
    "videoId": "PUT_ACTUAL_VIDEO_UUID_HERE",
    "userId": "PUT_JAVIERA_USER_UUID_HERE",
    "paymentMethod": "Webpay"
  },
  ... (12 more)
]
```

## 🚀 How to Submit

### Step 1: Create Payment JSON

Create file with your 16 payments in the format above. Name it: `my_payments.json`

### Step 2: Submit via API

**Using curl** (from any computer):

```bash
curl -X POST https://api.yurbuster.com/api/admin/recover-payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d @my_payments.json
```

**To get your admin JWT token**:

1. Go to https://yurbuster.com (login page)
2. Login with admin credentials
3. Open browser DevTools (F12)
4. Go to Application → Cookies
5. Find cookie named `token` or check localStorage
6. Copy the token value

**OR use the API directly in admin panel** (future feature)

### Step 3: Check Results

You'll get a response like:

```json
{
  "success": true,
  "total": 16,
  "results": [
    {
      "orderId": "webpay_20260413_001",
      "status": "success",
      "rentalId": "rental_uuid_generated",
      "amount": 5000,
      "uploaderEarned": 4500,
      "platformFee": 500
    },
    ...
  ]
}
```

### Step 4: Verify in Admin Panel

1. Go to Admin Dashboard
2. Check "Stats" section - should see updated earnings
3. Check "Creadores Ganancias" - should see new amounts for each creator
4. Total recovered should equal sum of all payment amounts

## 💾 File Format Validation

Before submitting, validate your JSON:

```bash
# On any computer with Node.js
node -e "console.log(JSON.parse(require('fs').readFileSync('my_payments.json', 'utf8')))" && echo "✅ Valid JSON"
```

## ⚠️ Important Notes

### Validation Rules
- ❌ `amount` must be a number (not a string)
- ❌ `orderId` must be unique (no duplicates)
- ❌ `videoId` and `userId` must exist in database
- ✅ `timestamp` must be valid ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- ✅ Currency is always CLP (no decimals)

### What Happens After Recovery

✅ **Rental records are created** - Links payment to video and user
✅ **Creator earnings updated** - 90% of amount goes to creator
✅ **Admin dashboard reflects it** - Shows in statistics
✅ **Creator dashboards updated** - They see new "Por Liquidar" amounts
✅ **Payment history preserved** - Each has payment_id and timestamp

### Cannot be Undone Directly

- Once a payment is recovered, it creates a rental record
- To reverse, would need manual database cleanup
- To avoid errors, validate all data before submitting
- Test with 1-2 payments first if unsure

## 📞 Support

If you have questions about:
- **How to use**: See `QUICK_RECOVERY_GUIDE.md`
- **Technical details**: See `PAYMENT_RECOVERY.md`
- **Troubleshooting**: See `PAYMENT_RECOVERY_SETUP.md`

## 🎯 Your Next Step

**Please provide the JSON with your 16 payment orders!**

Include:
- [ ] Order IDs from payment provider
- [ ] Payment amounts
- [ ] Timestamps
- [ ] Video UUIDs (from database)
- [ ] User UUIDs (from database)
- [ ] Payment methods

Once you provide this data, I can:
1. Validate the format
2. Submit to the API
3. Verify all 16 are recovered
4. Confirm earnings updated in admin panel

---

**Status**: ✅ Ready to accept and process your 16 payment orders

Commit: `4106737` - Payment recovery system complete and deployed
