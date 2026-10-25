import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/fdr';
import { DEMO_USERS } from '../data/mockData';
import {
  auth,
  isFirebaseConfigured,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
} from '../services/firebase';

interface AuthContextType {
  currentUser: UserProfile;
  firebaseUser: User | null;
  isLiveFirebase: boolean;
  isLoading: boolean;
  error: string | null;
  setRole: (role: UserRole) => void;
  switchDemoUser: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: UserRole, instId?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ACTIVE_ROLE = 'aicte_active_demo_role_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [activeDemoRole, setActiveDemoRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ROLE) as UserRole | null;
    return saved && DEMO_USERS[saved] ? saved : 'institution';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS[activeDemoRole]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveFirebase, setIsLiveFirebase] = useState<boolean>(isFirebaseConfigured());

  // Listen to Firebase Auth state if configured
  useEffect(() => {
    if (isFirebaseConfigured() && auth) {
      setIsLiveFirebase(true);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        if (user) {
          // Derive profile or match with stored role
          setCurrentUser({
            uid: user.uid,
            email: user.email || 'user@aicte-india.org',
            displayName: user.displayName || user.email?.split('@')[0] || 'AICTE User',
            role: activeDemoRole, // Can be assigned in DB or toggled
            institutionId: activeDemoRole === 'institution' ? '1-49281039' : undefined,
            institutionName: activeDemoRole === 'institution' ? 'Delhi Institute of Engineering & Technology' : undefined,
            region: 'North-West',
          });
        } else {
          // Fall back to current demo user
          setCurrentUser(DEMO_USERS[activeDemoRole]);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLiveFirebase(false);
      setCurrentUser(DEMO_USERS[activeDemoRole]);
      setIsLoading(false);
    }
  }, [activeDemoRole]);

  const switchDemoUser = (role: UserRole) => {
    setActiveDemoRole(role);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ROLE, role);
    setCurrentUser(DEMO_USERS[role]);
    setError(null);
  };

  const setRole = (role: UserRole) => {
    switchDemoUser(role);
  };

  const signInWithGoogle = async () => {
    setError(null);
    if (!isFirebaseConfigured() || !auth) {
      setError('Firebase is not yet configured with valid environment variables. Use Demo Mode or configure credentials in .env.');
      return;
    }
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConfigured() || !auth) {
      setError('Firebase is not yet configured. Please configure Firebase in .env to use live email login.');
      return;
    }
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    instId?: string
  ) => {
    setError(null);
    if (!isFirebaseConfigured() || !auth) {
      setError('Firebase is not configured. Use Demo Mode to explore all roles.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        setActiveDemoRole(role);
        setCurrentUser({
          uid: res.user.uid,
          email: res.user.email || email,
          displayName: name,
          role,
          institutionId: instId,
          region: 'North-West',
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    if (isFirebaseConfigured() && auth && firebaseUser) {
      await fbSignOut(auth);
    }
    setFirebaseUser(null);
    setCurrentUser(DEMO_USERS[activeDemoRole]);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isLiveFirebase,
        isLoading,
        error,
        setRole,
        switchDemoUser,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
