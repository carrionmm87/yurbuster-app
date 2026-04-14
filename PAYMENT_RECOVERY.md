# Payment Recovery Guide

This guide explains how to recover past payments from Flow.cl, Webpay, Khipu, and Mach payment platforms and sync them into the YurBuster database.

## Overview

When payments are made through external payment gateways (Flow, Webpay, Khipu, Mach), they may not always be automatically recorded in the database due to:
- API timeouts or failures
- Network issues during payment confirmation
- Payment processing delays
- Manual admin recovery needs

The Payment Recovery system allows you to:
1. Collect payment order data from your payment provider
2. Submit it to the backend
3. Automatically create Rental records and update creator earnings

## Data Format

Payment data must be provided as a JSON array with the following structure:

```json
[
  {
    "orderId": "unique_order_id_from_payment_provider",
    "timestamp": "2026-04-13T10:30:45Z",
    "amount": 5000,
    "videoId": "video_uuid",
    "userId": "user_uuid",
    "paymentMethod": "Webpay"
  },
  {
    "orderId": "flow_2026041302",
    "timestamp": "2026-04-13T11:15:30Z",
    "amount": 3000,
    "videoId": "another_video_id",
    "userId": "another_user_id",
    "paymentMethod": "Khipu"
  }
]
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Unique identifier from payment provider (e.g., transaction/order ID). Must be unique in database. |
| `timestamp` | ISO 8601 String | Payment completion time (e.g., `"2026-04-13T10:30:45Z"`) |
| `amount` | Number | Amount paid in CLP (Chilean Pesos) |
| `videoId` | UUID String | ID of the video that was rented |
| `userId` | UUID String | ID of the user who made the payment |
| `paymentMethod` | String | Payment method name (Webpay, Khipu, Mach, etc.) - informational only |

## Methods

### Method 1: API Endpoint (Recommended)

Submit payment data directly via the admin API:

```bash
curl -X POST https://api.yurbuster.com/api/admin/recover-payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "payments": [
      {
        "orderId": "flow_2026041301",
        "timestamp": "2026-04-13T10:30:45Z",
        "amount": 5000,
        "videoId": "video_id_here",
        "userId": "user_id_here",
        "paymentMethod": "Webpay"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "total": 1,
  "results": [
    {
      "orderId": "flow_2026041301",
      "status": "success",
      "rentalId": "rental_uuid",
      "amount": 5000,
      "uploaderEarned": 4500,
      "platformFee": 500
    }
  ]
}
```

### Method 2: Node.js Script

For bulk recovery on the server, use the recovery script:

```bash
cd /path/to/backend

# Create a JSON file with payment orders
cat > payments.json << 'EOF'
[
  {
    "orderId": "flow_2026041301",
    "timestamp": "2026-04-13T10:30:45Z",
    "amount": 5000,
    "videoId": "video_id",
    "userId": "user_id",
    "paymentMethod": "Webpay"
  }
]
EOF

# Run recovery script
node recover_payments.js < payments.json
```

### Method 3: Direct Admin Dashboard UI (Future)

A dedicated admin panel will be available to upload and preview payment data before processing.

## Step-by-Step: Recovering Payments from Flow.cl

1. **Log into Flow.cl Dashboard**
   - Navigate to Transactions/Orders section
   - Filter by date range (e.g., Apr 13-14, 2026)
   - Note payment status (Completed, Pending, Failed)

2. **Extract Required Data**
   - Order ID / Transaction ID
   - Payment amount
   - Payment timestamp
   - Payment method (Webpay, Khipu, Mach)

3. **Match with Your Database**
   - Determine which user made the payment (look up by email/username)
   - Determine which video was rented
   - Get the user's UUID and video's UUID from your database

4. **Format as JSON**
   - Create array with all payments
   - Ensure timestamps are in ISO 8601 format

5. **Submit to Backend**
   - Use API endpoint or script method above
   - Review results for any errors
   - Check admin dashboard to verify earnings updated

## Error Handling

### Common Errors

**"Video [id] not found"**
- Video ID doesn't exist in database
- Verify video was uploaded and is in the database
- Check video ID is correct UUID format

**"User [id] not found"**
- User ID doesn't exist in database
- User account may have been deleted
- Create user account if needed, or use correct ID

**"Already exists"**
- Payment with this orderId already recorded
- Check if payment was already processed
- Use different orderId if this is a duplicate

**"Missing required fields"**
- Check all fields are present: orderId, timestamp, amount, videoId, userId
- Ensure timestamp is valid ISO 8601 format
- Ensure amount is a number (not string)

## Verification

After recovery, verify payments were recorded:

1. **Check Admin Dashboard**
   - Navigate to Admin Panel
   - Verify total earnings increased
   - Check creator earnings breakdown

2. **Check Creator Dashboard**
   - Login as creator
   - Verify "Por Liquidar" (pending) amount reflects recovered payments
   - Check rental count matches

3. **Database Query** (if needed)
   ```sql
   SELECT COUNT(*) FROM rentals WHERE payment_id LIKE 'flow_%';
   SELECT SUM(total_paid) FROM rentals WHERE payment_id LIKE 'flow_%';
   ```

## Security Notes

- Only admin users can access the recovery endpoint
- All payments require valid user and video IDs (referential integrity)
- Revenue split is automatically calculated (90% creator, 10% platform)
- Each payment is timestamped and tracked with payment_id
- Payment records cannot be duplicated (payment_id is unique)

## Sample Data

A sample payment file is included: `sample_payment_orders.json`

```bash
# Use sample as template
cp sample_payment_orders.json my_payments.json
# Edit with your actual data
nano my_payments.json
# Submit
node recover_payments.js < my_payments.json
```

## Troubleshooting

**Script doesn't connect to database**
- Ensure `.env` file is configured with DATABASE_URL
- Check database file exists at `prisma/database.sqlite`
- Verify Prisma migrations are up to date: `npx prisma db push`

**API endpoint returns 403 Forbidden**
- Check JWT token is valid and belongs to admin user
- Verify Authorization header format: `Bearer YOUR_TOKEN`
- Admin user must have role='admin' or username='admin'

**Payment amounts don't match**
- Ensure amount field is a number, not a string
- Check payment has not been modified (amounts should match payment provider exactly)
- Verify no decimal values in CLP amounts (use integers)

## Future Enhancements

- Automatic webhook integration with payment providers
- Duplicate detection by comparing timestamps and amounts
- CSV import support
- Payment reconciliation report
- Admin UI for payment recovery

---

For support, contact: admin@yurbuster.com
