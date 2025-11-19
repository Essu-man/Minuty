# Minuty - Digital Document Minuting & Signing Platform

A professional full-stack web application for uploading, viewing, annotating, minuting, and signing PDF and DOCX documents digitally.

## Features

✅ **User Authentication** - Sign up, login, and logout via Firebase Auth
✅ **Dashboard** - View all uploaded documents in a clean card grid layout
✅ **Document Upload** - Drag-and-drop interface for uploading PDF and DOCX files
✅ **Document Viewer** - View documents with PDF.js integration
✅ **Minuting Tools** - Add comments, highlights, underlines, and pen annotations
✅ **Digital Signatures** - Create signatures by drawing or typing, place them anywhere on documents
✅ **Save & Download** - Save final versions and download documents
✅ **Dark/Light Mode** - Toggle between themes
✅ **Modern UI** - Clean, minimal interface with Framer Motion animations

## Tech Stack

- **Next.js 16** (App Router)
- **Firebase** (Authentication, Firestore, Storage)
- **TailwindCSS** (Styling)
- **PDF.js** (PDF viewing)
- **React Signature Canvas** (Digital signatures)
- **Framer Motion** (Animations)
- **Lucide React** (Icons)
- **Next Themes** (Theme management)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project set up
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd minuty
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration values:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`

4. Set up Firebase:
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Set up Firebase Storage with appropriate security rules

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Firebase Security Rules

### Firestore Rules
```javascript
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

### Storage Rules
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

## Project Structure

```
minuty/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/
│   ├── document/
│   │   └── [id]/
│   ├── upload/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── AnnotationTools.tsx
│   ├── AuthGuard.tsx
│   ├── DocumentViewer.tsx
│   ├── SignatureModal.tsx
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
├── lib/
│   └── firebase/
│       ├── auth.ts
│       ├── config.ts
│       ├── firestore.ts
│       └── storage.ts
└── public/
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

The app will be automatically deployed and available at your Vercel URL.

## Usage

1. **Sign Up/Login**: Create an account or sign in
2. **Upload Documents**: Go to the upload page and drag-and-drop or select PDF/DOCX files
3. **View Documents**: Click "Open" on any document from the dashboard
4. **Annotate**: Use the minuting tools sidebar to add comments, highlights, underlines, or draw
5. **Sign**: Click "Add Signature" to create and place signatures on the document
6. **Save**: Click "Save Final Version" to save your annotated document
7. **Download**: Download the document using the download button

## Notes

- Email functionality is not included - users will share documents externally
- DOCX viewing requires additional libraries (currently PDF.js handles PDFs)
- For production, consider implementing proper PDF rendering with annotations merged into the PDF

## License

MIT
