'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import FirebaseError from '@/components/FirebaseError';

export default function Home() {
  const router = useRouter();
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setFirebaseError(true);
      return;
    }

    getCurrentUser()
      .then((user) => {
        if (user) {
          router.push('/dashboard');
        } else {
          router.push('/auth/login');
        }
      })
      .catch((error) => {
        console.error('Firebase error:', error);
        // Check if it's a configuration error
        if (error.code === 'auth/invalid-api-key' || error.message?.includes('API key')) {
          setFirebaseError(true);
        }
      });
  }, [router]);

  if (firebaseError) {
    return <FirebaseError />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A878]"></div>
    </div>
  );
}
