import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from './config';

export interface Document {
    id?: string;
    userId: string;
    fileName: string;
    name?: string; // Display name for the document
    url?: string; // URL to access the document
    originalUrl: string;
    finalUrl?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    status: 'draft' | 'final';
    annotations?: any[];
    signatures?: any[];
    // Approval signatures
    approvedBySignature?: string | null;
    issuedBySignature?: string | null;
    approvedBy?: string; // Name of approver
    issuedBy?: string; // Name of issuer
    approvedAt?: Timestamp | Date;
    issuedAt?: Timestamp | Date;
}

export const createDocument = async (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) {
        throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }
    const docRef = await addDoc(collection(db, 'documents'), {
        ...document,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
};

export const getUserDocuments = async (userId: string): Promise<Document[]> => {
    if (!db) {
        throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }
    const q = query(collection(db, 'documents'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Document[];
};

export const updateDocument = async (documentId: string, updates: Partial<Document>): Promise<void> => {
    if (!db) {
        throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
};

export const deleteDocument = async (documentId: string): Promise<void> => {
    if (!db) {
        throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
};

