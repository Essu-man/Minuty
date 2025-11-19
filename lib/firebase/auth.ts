import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './config';

export const signUp = async (email: string, password: string) => {
    if (!auth) {
        throw new Error('Firebase is not configured. Please check your environment variables.');
    }
    return await createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = async (email: string, password: string) => {
    if (!auth) {
        throw new Error('Firebase is not configured. Please check your environment variables.');
    }
    return await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
    if (!auth) {
        throw new Error('Firebase is not configured. Please check your environment variables.');
    }
    return await signOut(auth);
};

export const getCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !auth) {
            resolve(null);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

