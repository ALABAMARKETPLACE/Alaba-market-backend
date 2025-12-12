# Backend Deployment Guide - Render

## Prerequisites

- GitHub account
- Render account (free tier available at https://render.com)
- Backend code pushed to GitHub repository

## Step 1: Push Backend to GitHub

```bash
cd /Users/macbook/Desktop/delivery-app/new-alaba-marketplace

# Initialize git if not already done
git init
git add .
git commit -m "Prepare backend for production deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/alaba-marketplace-backend.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Render

### Option A: Using render.yaml (Blueprint)

1. Go to https://render.com and sign in
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and set up:
   - Web Service (API)
   - PostgreSQL Database
5. Click **"Apply"**

### Option B: Manual Setup

#### Create Database:

1. Dashboard → **"New"** → **"PostgreSQL"**
2. Name: `alaba-marketplace-db`
3. Database: `alaba_marketplace`
4. Region: Choose closest to your users
5. Plan: **Free**
6. Click **"Create Database"**
7. Copy the **Internal Database URL**

#### Create Web Service:

1. Dashboard → **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `alaba-marketplace-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or specify if backend is in subdirectory)
   - **Runtime**: **Node**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: **Free**

4. Add Environment Variables:

   ```
   NODE_ENV=production
   PORT=3002
   DATABASE_URL=[Paste Internal Database URL from Step 1]
   JWT_SECRET=[Generate strong random string]
   JWT_REFRESH_SECRET=[Generate another strong random string]
   JWT_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   FRONTEND_URL=*
   DELIVERY_COMPANY_SUBSCRIPTION_AMOUNT=10000
   DELIVERY_COMPANY_FREE_MONTHS=2
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ```

5. Click **"Create Web Service"**

## Step 3: Wait for Deployment

- Render will:
  1. Pull your code from GitHub
  2. Install dependencies
  3. Build the application
  4. Start the server
- First deployment takes 5-10 minutes
- Watch the logs for any errors

## Step 4: Verify Deployment

Once deployed, you'll get a URL like: `https://alaba-marketplace-api.onrender.com`

Test endpoints:

```bash
# Health check
curl https://YOUR_APP_URL.onrender.com/api/v1/health

# Swagger docs
Open: https://YOUR_APP_URL.onrender.com/api/docs
```

## Step 5: Run Database Migrations (If needed)

If you have migrations to run:

1. Go to your Web Service dashboard
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run migration:run
   ```

Or use Render's "Run Command" feature:

- Command: `npm run migration:run`

## Step 6: Optional - Set up Custom Domain

1. In your Web Service settings
2. Go to **"Settings"** → **"Custom Domain"**
3. Add your domain and follow DNS instructions

## Your Production API URL

After deployment, your backend will be available at:

```
https://alaba-marketplace-api.onrender.com/api/v1
```

## Important Notes

### Free Tier Limitations:

- ✅ 512 MB RAM
- ✅ Shared CPU
- ✅ 750 hours/month
- ⚠️ **Spins down after 15 minutes of inactivity** (takes 30-60 seconds to wake up)
- ✅ Free PostgreSQL database (1GB storage)

### Environment Variables to Add Later:

When you configure these services, add:

**Email (for password reset):**

```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@alabamarketplace.com
```

**Paystack (for payments):**

```
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=...
```

**AWS S3 (for file uploads):**

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=alaba-marketplace-uploads
```

## Troubleshooting

### Build fails:

- Check logs in Render dashboard
- Ensure all dependencies in `package.json`
- Verify Node version compatibility

### Database connection fails:

- Verify DATABASE_URL is set correctly
- Check database is in same region
- Ensure SSL is enabled (already configured)

### App crashes on startup:

- Check environment variables are set
- Review startup logs
- Verify `start:prod` script works locally

## Auto-Deploy

Render automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push
```

## Monitor Your App

- View logs: Dashboard → Your Service → **"Logs"** tab
- Check metrics: **"Metrics"** tab
- Set up alerts: **"Settings"** → **"Alerts"**

---

**Next Step:** Update your React Native app with the production backend URL!
