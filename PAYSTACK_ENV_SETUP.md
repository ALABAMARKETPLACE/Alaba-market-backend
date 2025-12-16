# Paystack Environment Variables Setup

## Required Environment Variables

Add these environment variables to your `.env` file for Paystack integration:

### Test Environment
```bash
# Paystack Test Configuration
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key_here
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application URLs for callbacks
HOSTED_URL=http://localhost:3000
WEB_URL=http://localhost:3001
```

### Production Environment
```bash
# Paystack Live Configuration
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key_here
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key_here
PAYSTACK_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here

# Application URLs for callbacks
HOSTED_URL=https://your-backend-domain.com
WEB_URL=https://your-frontend-domain.com
```

## How to Get Paystack Keys

1. **Sign up for Paystack**: Go to [https://paystack.com](https://paystack.com) and create an account
2. **Get API Keys**: 
   - Log into your Paystack dashboard
   - Navigate to Settings > API Keys & Webhooks
   - Copy your Public Key and Secret Key
3. **Set up Webhooks** (Optional but recommended):
   - In the same section, add your webhook URL: `https://your-backend-domain.com/paystack/webhook`
   - Copy the webhook secret

## Environment Variable Descriptions

| Variable | Description | Required |
|----------|-------------|----------|
| `PAYSTACK_PUBLIC_KEY` | Public key for frontend Paystack integration | Yes |
| `PAYSTACK_SECRET_KEY` | Secret key for backend API calls | Yes |
| `PAYSTACK_WEBHOOK_SECRET` | Secret for verifying webhook signatures | No (but recommended) |
| `HOSTED_URL` | Backend server URL for API calls | Yes |
| `WEB_URL` | Frontend application URL for redirects | Yes |

## Security Notes

1. **Never expose secret keys** in your frontend code or public repositories
2. **Use different keys** for test and production environments
3. **Rotate keys periodically** for security
4. **Keep webhook secrets secure** to prevent unauthorized webhook calls
5. **Use HTTPS** in production for all URLs

## Testing with Test Keys

Paystack provides test keys that allow you to test payments without real money:

- Test cards will work with test keys
- No real money will be charged
- All test transactions are clearly marked in the dashboard
- Perfect for development and staging environments

## API Endpoints Available

Once configured, these endpoints will be available:

- `POST /paystack/initialize` - Initialize payment
- `GET|POST /paystack/verify` - Verify payment
- `POST /paystack/refund` - Process refund
- `POST /paystack/webhook` - Handle webhooks
- `GET /paystack/public-key` - Get public key for frontend
- `GET /paystack/success` - Payment success callback
- `GET /paystack/cancel` - Payment cancellation callback
- `GET /paystack/failed` - Payment failure callback

## Frontend Integration

Use the public key in your frontend to initialize Paystack:

```javascript
// Get public key from your backend
const response = await fetch('/paystack/public-key');
const { publicKey } = await response.json();

// Use with Paystack's JavaScript library
const handler = PaystackPop.setup({
  key: publicKey,
  email: 'customer@email.com',
  amount: 10000, // Amount in kobo
  callback: function(response) {
    // Verify payment on your backend
    verifyPayment(response.reference);
  }
});
```

## Troubleshooting

### Common Issues:

1. **"Paystack secret key not configured"**
   - Ensure `PAYSTACK_SECRET_KEY` is set in your environment
   - Check for typos in the environment variable name

2. **"Invalid key" errors**
   - Verify you're using the correct key for your environment (test vs live)
   - Ensure the key is copied completely without extra spaces

3. **Webhook verification failed**
   - Check that `PAYSTACK_WEBHOOK_SECRET` matches the one in your Paystack dashboard
   - Ensure the webhook URL is correctly configured in Paystack

4. **CORS issues in frontend**
   - Ensure your backend URL is correctly set in `HOSTED_URL`
   - Check that your frontend can reach the backend endpoints

For more detailed integration examples, refer to the main `PAYSTACK_INTEGRATION_GUIDE.md` file.