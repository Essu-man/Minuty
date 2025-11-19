'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getUserDocuments, Document } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { logout } from '@/lib/firebase/auth';
import { Pen, Upload, LogOut, FileText, Calendar, Bell, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        try {
          const docs = await getUserDocuments(user.uid);
          setDocuments(docs);
        } catch (error) {
          console.error('Error loading documents:', error);
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setLoading(false);
      }
    };

    loadDocuments().catch((error) => {
      console.error('Unhandled error in loadDocuments:', error);
      setLoading(false);
    });
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const formatDate = (date: Timestamp | Date) => {
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A878]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Pen className="w-6 h-6 text-[#00A878]" />
                <h1 className="text-xl font-bold text-gray-900">Minuty</h1>
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Documents
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/upload"
                className="px-4 py-2 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold rounded-lg transition-colors"
              >
                Upload
              </Link>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Documents</h2>
            <p className="text-gray-600">
              Manage and review your uploaded documents
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </Link>
        </div>

        {documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Get started by uploading your first document</p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Your First Document
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#00A878]/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#00A878]" />
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${doc.status === 'final'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                  {doc.fileName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(doc.createdAt)}
                </div>
                {(doc.approvedBySignature || doc.issuedBySignature) && (
                  <div className="flex items-center gap-2 text-xs text-green-600 mb-4">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {doc.approvedBySignature && doc.issuedBySignature
                        ? 'Approved & Issued'
                        : doc.approvedBySignature
                        ? 'Approved'
                        : 'Issued'}
                    </span>
                  </div>
                )}
                <Link
                  href={`/document/${doc.id}`}
                  className="block w-full text-center bg-[#00A878] hover:bg-[#008f65] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  Open
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
