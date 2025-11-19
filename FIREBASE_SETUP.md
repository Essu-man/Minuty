# Firebase Authentication Setup Guide

## Enable Authentication in Firebase Console

The error "auth/configuration not found" means Authentication hasn't been enabled in your Firebase project yet. Follow these steps:

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project

### Step 2: Enable Authentication
1. In the left sidebar, click on **"Authentication"** (or "Build" → "Authentication")
2. Click **"Get started"** if you see this button
3. You'll be taken to the Authentication dashboard

### Step 3: Enable Email/Password Sign-in
1. Click on the **"Sign-in method"** tab (at the top)
2. You'll see a list of sign-in providers
3. Click on **"Email/Password"**
4. Toggle **"Enable"** to ON
5. Click **"Save"**

### Step 4: Verify Your Environment Variables
Make sure your `.env.local` file has all the correct values:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step 5: Restart Your Development Server
After enabling Authentication:
1. Stop your development server (Ctrl+C)
2. Restart it: `npm run dev`

### Additional Setup (Recommended)

#### Enable Firestore Database
1. Go to **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Start in **"Test mode"** (you can update security rules later)
4. Choose a location for your database
5. Click **"Enable"**

#### Enable Firebase Storage
1. Go to **"Storage"** in the left sidebar
2. Click **"Get started"**
3. Start in **"Test mode"** (you can update security rules later)
4. Choose a location (same as Firestore is recommended)
5. Click **"Done"**

### Security Rules

After enabling, update your security rules:

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{documentId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

- **Still getting the error?** Make sure you've restarted your dev server after enabling Authentication
- **Can't find Authentication?** Make sure you're using the correct Firebase project
- **Environment variables not working?** Make sure your `.env.local` file is in the root directory and restart the server

