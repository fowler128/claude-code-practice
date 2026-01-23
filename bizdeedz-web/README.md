# BizDeedz Filing Tracker - Web App

A modern web application for legal professionals to track court filings and document submissions across Texas counties.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel (Free)

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/bizdeedz-web)

### Option 2: Manual Deploy

1. Push this code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repo
5. Add environment variables (see below)
6. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`

## Environment Variables

Create a `.env.local` file (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Then add your Firebase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "BizDeedz"
3. Add a Web app
4. Copy the config values to your `.env.local`
5. Enable Firestore Database
6. Enable Authentication (Email/Password)

## Features

- **Dashboard**: Track all filings with status cards and governance score
- **Filing Management**: Create, view, and delete filings
- **Overdue Alerts**: Automatic alerts for filings pending > 48 hours
- **Texas Counties**: All major Texas counties supported
- **2026 Court Holidays**: Built-in holiday detection
- **Mobile Responsive**: Works on phones, tablets, and desktops

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore + Auth)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Project Structure

```
bizdeedz-web/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard
│   ├── filings/            # Filings list & management
│   ├── settings/           # User settings
│   └── terms/              # Terms of Service
├── components/             # Reusable components
│   └── layout/             # Layout components (Sidebar)
├── lib/                    # Utilities & services
│   ├── firebase.ts         # Firebase configuration
│   ├── filings.ts          # Filing operations
│   └── utils.ts            # Helper functions
├── types/                  # TypeScript types
│   └── filing.ts           # Filing models
└── public/                 # Static assets
```

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Trial | Free (7 days) | Full access |
| Solo Paralegal | $29/mo | Single user |
| Law Firm | $199/mo | Up to 10 users |
| Enterprise | Custom | Unlimited users |

## License

Copyright 2026 BizDeedz, Inc. All rights reserved.
