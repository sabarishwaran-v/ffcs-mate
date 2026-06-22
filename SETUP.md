# Setup & Runbook (SETUP.md)

This runbook covers how to install, configure, and deploy FFCS MATE locally or to production.

## Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- A Firebase Project (with Firestore and Authentication enabled)
- A Vercel Account (for deployment)

## 1. Local Development

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/sabarishwaran-v/ffcs-mate.git
cd ffcs-mate
npm install
```

### Environment Variables
Create a `.env.local` file in the root directory. You will need to obtain these keys from your Firebase Console (Project Settings > General).

```env
# Client-side Firebase Keys
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_APP_VERSION="2.0.0"

# Server-side Firebase Admin Keys (Required for CRON cleanup)
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\n-----END PRIVATE KEY-----\n"

# Security Secret for CRON
CRON_SECRET="generate-a-random-secure-string"
```

### Running the App
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## 2. Production Deployment (Vercel)

FFCS MATE is optimized for Vercel.

1. Push your code to GitHub.
2. Import the project into Vercel.
3. In the Vercel dashboard, go to **Settings > Environment Variables** and paste all the keys from your `.env.local` file.
4. Click **Deploy**.

### Cron Jobs
Vercel will automatically detect the `vercel.json` file in the repository and configure the daily CRON job pointing to `/api/cron/cleanup`. Ensure you added the `CRON_SECRET` variable to Vercel so the endpoint accepts the automated requests.
