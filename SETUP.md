# Minuty Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Set up Firebase Storage
   - Copy your Firebase config values

3. **Configure Environment Variables**
   - Create a `.env.local` file in the root directory
   - Add your Firebase configuration:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. **Set Up Firebase Security Rules** ⚠️ **REQUIRED - Fixes "Missing or insufficient permissions" error**

   **IMPORTANT**: You MUST set up security rules or you'll get permission errors when uploading/reading documents.
   
   See **FIREBASE_RULES.md** for detailed step-by-step instructions, or follow these quick steps:

   **Firestore Rules:**
   1. Go to Firebase Console → Firestore Database → Rules tab
   2. Copy and paste:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /documents/{documentId} {
         allow read: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
         allow update: if request.auth != null && request.auth.uid == resource.data.userId;
         allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```
   3. Click "Publish"

   **Storage Rules:**
   1. Go to Firebase Console → Storage → Rules tab
   2. Copy and paste:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   3. Click "Publish"

5. **Run the Development Server**
   ```bash
   npm run dev
   ```

6. **Open the Application**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up for an account
   - Start uploading and annotating documents!

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add your environment variables in the Vercel dashboard
   - Deploy!

## Notes

- **PDF Support**: The app uses PDF.js for viewing PDF documents. PDF viewing is fully supported.
- **DOCX Support**: DOCX files can be uploaded and stored, but viewing requires additional libraries. For production, consider using libraries like `mammoth` or `docx-preview` for DOCX rendering.
- **Annotations**: Currently, annotations are stored as metadata. For production, you may want to merge annotations directly into the PDF using libraries like `pdf-lib`.
- **CORS**: Make sure your Firebase Storage bucket allows CORS requests if you're accessing files from a different domain.

## Troubleshooting

### PDF.js Worker Error
If you see PDF.js worker errors, make sure the worker is properly loaded. The app uses a CDN for the worker. If you need to use a local worker, update `lib/pdfjs-config.ts`.

### Firebase Connection Issues
- Verify all environment variables are set correctly
- Check Firebase console for any service issues
- Ensure your Firebase project has the required services enabled

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

