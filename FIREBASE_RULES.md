# Firebase Security Rules Setup

## Important: Fix "Missing or insufficient permissions" Error

If you're getting a "Missing or insufficient permissions" error, you need to set up Firebase Security Rules. Follow these steps:

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **"Firestore Database"** in the left sidebar
4. Click on the **"Rules"** tab at the top

### Step 2: Update Firestore Rules

Copy and paste these rules into the Firestore Rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Documents collection
    match /documents/{documentId} {
      // Allow read if user is authenticated and owns the document
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Allow create if user is authenticated and sets their own userId
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      
      // Allow update if user is authenticated and owns the document
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Allow delete if user is authenticated and owns the document
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### Step 3: Update Storage Rules

1. Click on **"Storage"** in the left sidebar
2. Click on the **"Rules"** tab at the top
3. Copy and paste these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own files
    match /{userId}/{allPaths=**} {
      // Allow read if user is authenticated and accessing their own files
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow write if user is authenticated and writing to their own folder
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 4: Publish the Rules

1. Click **"Publish"** button after updating the rules
2. Wait a few seconds for the rules to propagate

### Step 5: Test

1. Refresh your application
2. Try uploading a document again
3. The error should be resolved

## Troubleshooting

### Still Getting Permission Errors?

1. **Check Authentication**: Make sure you're logged in
   - The rules require `request.auth != null` (user must be authenticated)

2. **Check User ID Match**: The rules check that `request.auth.uid == resource.data.userId`
   - Make sure when creating documents, you're setting `userId` to the current user's ID
   - Check the browser console for any errors

3. **Wait for Propagation**: Rules can take a few seconds to update
   - Wait 10-30 seconds after publishing rules before testing

4. **Check Rule Syntax**: Make sure there are no syntax errors
   - The Firebase Console will highlight any errors in red

### Development Mode (Less Secure - For Testing Only)

If you want to test without strict rules (NOT recommended for production):

**Firestore Rules (Development):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules (Development):**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Warning**: These development rules allow any authenticated user to read/write any data. Only use for testing!

## Production Best Practices

1. **Always use specific rules** that check user ownership
2. **Test rules thoroughly** before deploying
3. **Monitor Firebase Console** for any security alerts
4. **Review rules regularly** as your app grows

## Need Help?

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)

