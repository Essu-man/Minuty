'use client';

import { AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function FirebaseError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Firebase Configuration Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Firebase environment variables are missing or invalid. Please configure your Firebase project to continue.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Setup:</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Create a <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded">.env.local</code> file in the root directory</li>
                <li>Add your Firebase configuration values:
                  <pre className="mt-2 p-3 bg-gray-900 dark:bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id`}
                  </pre>
                </li>
                <li>Get your Firebase config from{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00A878] hover:underline inline-flex items-center gap-1"
                  >
                    Firebase Console
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Restart the development server</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <Link
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold rounded-lg transition-colors"
              >
                Open Firebase Console
                <ExternalLink className="w-4 h-4" />
              </Link>
              <a
                href="/SETUP.md"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View Setup Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

