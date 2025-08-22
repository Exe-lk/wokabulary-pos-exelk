# SMS Setup Guide - Text.lk Integration

This guide will help you set up SMS functionality for the Wokabulary POS System using Text.lk SMS Gateway.

## Prerequisites

1. A Text.lk account (sign up at [https://text.lk/](https://text.lk/))
2. API token from Text.lk dashboard
3. Node.js and npm/yarn installed

## Step 1: Get Text.lk API Token

1. Visit [https://text.lk/](https://text.lk/)
2. Sign up for an account
3. Log in to your dashboard
4. Navigate to API settings
5. Copy your API token

## Step 2: Configure Environment Variables

1. Create or edit your `.env.local` file in the project root
2. Add the following variables:

```env
# Text.lk SMS Configuration
TEXTLK_API_TOKEN="your_actual_api_token_here"
TEXTLK_SENDER_ID="YourRestaurant"

# Email Configuration (required for bill sending)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Base URL for bill links
BASE_URL="http://localhost:3000"
```

**Important Notes:**
- Replace `your_actual_api_token_here` with your real Text.lk API token
- Set `TEXTLK_SENDER_ID` to your restaurant name (this appears as sender in SMS)
- Make sure `EMAIL_USER` and `EMAIL_PASS` are configured for email functionality

## Step 3: Install Dependencies

```bash
yarn install
```

## Step 4: Test SMS Functionality

Run the test script to verify your SMS configuration:

```bash
yarn test:sms
```

**Optional:** Set a test phone number in your `.env.local`:
```env
TEST_PHONE_NUMBER="94712345678"
```

## Step 5: How It Works

### Phone Number Formatting

The system automatically formats phone numbers for Sri Lanka:
- `0712345678` → `94712345678`
- `+94712345678` → `94712345678`
- `94712345678` → `94712345678` (unchanged)

### SMS Content

When a bill is sent, the SMS includes:
- Customer greeting
- Order number and bill number
- Total amount
- Table number
- Bill download link
- Restaurant branding

### Example SMS

```
Dear John Doe,

Your bill for Order #123 (Bill #BILL-20241201-0001) is ready!

Total Amount: $45.50
Table: 5

View your bill: http://localhost:3000/bill/123

Thank you for dining with us!

Best Regards,
Restaurant Team
```

## Step 6: Usage in the Application

1. **Waiter Interface**: When sending a bill, enter the customer's phone number
2. **Automatic SMS**: SMS is sent automatically if a phone number is provided
3. **Dual Notification**: Both email and SMS are sent simultaneously
4. **Status Tracking**: SMS success/failure is logged in the console

## Troubleshooting

### Common Issues

1. **"TEXTLK_API_TOKEN is not set"**
   - Check your `.env.local` file
   - Ensure the token is correctly copied from Text.lk dashboard

2. **"SMS failed to send"**
   - Verify your API token is valid
   - Check your Text.lk account balance
   - Ensure phone number format is correct

3. **"Invalid phone number"**
   - Use Sri Lankan phone number format
   - Supported formats: `0712345678`, `+94712345678`, `94712345678`

### Testing

1. Use the test script: `yarn test:sms`
2. Check console logs for detailed error messages
3. Verify your Text.lk dashboard for SMS delivery status

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API token secure
- The `.env.local` file is already in `.gitignore`

## Support

- Text.lk Documentation: [https://text.lk/](https://text.lk/)
- Package Documentation: [https://www.npmjs.com/package/textlk-nextjs](https://www.npmjs.com/package/textlk-nextjs)

## Cost

- Text.lk charges per SMS sent
- Check their pricing at [https://text.lk/](https://text.lk/)
- SMS costs are typically very low for Sri Lankan numbers
