# Quick Payment Recovery Guide

## Your 16 Payment Orders (April 13-14, 2026)

You mentioned recovering 16 payment orders from Flow, Webpay, Mach, and Khipu. Here's how to do it:

### Step 1: Gather Payment Data

Collect the following information for each of your 16 payments:
- Order ID (from payment provider)
- Timestamp (when payment completed)
- Amount in CLP
- Video ID (from your database)
- User ID (from your database)
- Payment method (Webpay, Khipu, Mach, etc.)

### Step 2: Format as JSON

Create a file called `my_payments.json` in the backend folder:

```bash
cd backend
```

Then create the file with your 16 payments (example):

```json
[
  {
    "orderId": "flow_order_001",
    "timestamp": "2026-04-13T10:30:00Z",
    "amount": 5000,
    "videoId": "YOUR_VIDEO_UUID_HERE",
    "userId": "YOUR_USER_UUID_HERE",
    "paymentMethod": "Webpay"
  },
  {
    "orderId": "flow_order_002",
    "timestamp": "2026-04-13T11:15:00Z",
    "amount": 3000,
    "videoId": "ANOTHER_VIDEO_UUID",
    "userId": "ANOTHER_USER_UUID",
    "paymentMethod": "Khipu"
  },
  ...
  (14 more payments)
]
```

### Step 3: Process the Payments

#### Option A: Using the Recovery Script (Local/Server)

```bash
# From the backend folder
node recover_payments.js < my_payments.json
```

This will:
- ✅ Verify each video exists
- ✅ Verify each user exists
- ✅ Create Rental records with automatic 90/10 split
- ✅ Show a summary with success/error count

#### Option B: Using the API (From Anywhere)

```bash
curl -X POST https://api.yurbuster.com/api/admin/recover-payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d @my_payments.json
```

#### Option C: Interactive Collection Tool

If you need help formatting the data:

```bash
node collect_payments.js
```

This will prompt you to enter each payment and save it as JSON.

### Step 4: Verify Recovery

After processing, check these to confirm payments are recorded:

**1. Check Admin Panel**
- Go to admin dashboard
- Look at total earnings in stats
- Creator earnings should increase by sum of all payments × 0.9

**2. Check Creator Dashboard**
- Login as each creator who received payments
- "Por Liquidar" amount should show the pending earnings
- Rental count should increase

**3. Database Check** (if needed)
```sql
-- Count recovered payments
SELECT COUNT(*) FROM rentals WHERE payment_id LIKE 'flow_%';

-- Sum of all recovered amounts
SELECT SUM(total_paid) FROM rentals WHERE payment_id LIKE 'flow_%';

-- Creator earnings from recovered payments
SELECT SUM(uploader_earned) FROM rentals WHERE payment_id LIKE 'flow_%';
```

## Expected Results

For your 16 payments:
- **Total to be recovered:** Sum of all 16 amounts
- **Creator earnings:** 90% of total
- **Platform fee:** 10% of total
- **New rentals created:** 16 (one per payment)

## Example with Your Video Titles

Based on the video titles mentioned:
- PENDEJO ME DA RICO
- Un poco de mi coño
- Montando rico
- masturbanome hasta chorrar rico

Your JSON might look like:

```json
[
  {
    "orderId": "webpay_001_20260413",
    "timestamp": "2026-04-13T10:30:00Z",
    "amount": 5000,
    "videoId": "video_id_for_pendejo_me_da_rico",
    "userId": "javiera_user_id",
    "paymentMethod": "Webpay"
  },
  {
    "orderId": "khipu_001_20260413",
    "timestamp": "2026-04-13T11:15:00Z",
    "amount": 3000,
    "videoId": "video_id_for_un_poco_coño",
    "userId": "gatadolce_user_id",
    "paymentMethod": "Khipu"
  },
  ...
]
```

## Getting User and Video IDs

### To Find User ID:

```bash
# Open a Node REPL
node

// In the REPL:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Find user by username
await prisma.user.findUnique({ where: { username: 'javiera' } });
// Returns: { id: 'xxxxx-xxxxx-xxxxx', ... }
```

### To Find Video ID:

```bash
// In the Node REPL:
// Find by title (partial match)
await prisma.video.findMany({ where: { title: { contains: 'pendejo', mode: 'insensitive' } } });
// Returns: [{ id: 'xxxxx-xxxxx-xxxxx', title: 'PENDEJO ME DA RICO', ... }]
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Video not found" | Check video ID is correct - may have different ID than expected |
| "User not found" | Verify user exists - may need to create account first |
| "Already exists" | Payment was already recorded - check payment_id in database |
| Amounts don't match | Ensure amount is number not string, and no decimals |
| Script not found | Make sure you're in backend folder: `cd backend` |

## After Recovery

1. **Admin Dashboard** will automatically show:
   - Updated total earnings
   - Updated creator breakdown
   - Payment history

2. **Creator Dashboard** will show:
   - New rental counts
   - Updated earnings (pending and paid)

3. **Payment Verification**:
   - Each recovered payment has unique payment_id
   - Cannot be duplicated (payment_id must be unique)
   - Timestamp preserved from original payment
   - Both created_at and paid_at set to payment timestamp

## Need Help?

- Review full docs: `PAYMENT_RECOVERY.md`
- Check database directly if needed
- Verify UUIDs match between users and videos
- Ensure JSON is valid before submitting

Good luck! 🚀
