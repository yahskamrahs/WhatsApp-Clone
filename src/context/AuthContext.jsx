import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, onDisconnect, set, onValue } from 'firebase/database';
import { auth, db, rtdb } from '@/firebase/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Subscribe to user's Firestore doc for live profile updates
        const userRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) setUserDoc({ id: snap.id, ...snap.data() });
        });

        // ── Realtime DB presence ──────────────────────────────────────────
        const presenceRef = ref(rtdb, `presence/${user.uid}`);
        const connectedRef = ref(rtdb, '.info/connected');

        onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
            // Mark online in RTDB
            set(presenceRef, { isOnline: true, lastSeen: Date.now() });

            // Mark offline on disconnect
            onDisconnect(presenceRef).set({
              isOnline: false,
              lastSeen: Date.now(),
            });

            // Also update Firestore
            updateDoc(userRef, { isOnline: true }).catch(() => {});
          }
        });

        // Mark offline in Firestore when window is closed (best-effort)
        const handleUnload = () => {
          updateDoc(userRef, {
            isOnline: false,
            lastSeen: serverTimestamp(),
          }).catch(() => {});
        };
        window.addEventListener('beforeunload', handleUnload);

        setLoading(false);

        return () => {
          unsubUser();
          window.removeEventListener('beforeunload', handleUnload);
        };
      } else {
        setUserDoc(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userDoc, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
