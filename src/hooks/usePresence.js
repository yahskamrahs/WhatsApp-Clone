import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '@/firebase/config';

/**
 * Subscribes to a user's online presence via Firebase Realtime Database.
 * @param {string} uid
 * @returns {{ isOnline: boolean, lastSeen: number | null }}
 */
export const usePresence = (uid) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const presenceRef = ref(rtdb, `presence/${uid}`);

    const unsub = onValue(presenceRef, (snap) => {
      const data = snap.val();
      if (data) {
        setIsOnline(data.isOnline === true);
        setLastSeen(data.lastSeen || null);
      } else {
        setIsOnline(false);
        setLastSeen(null);
      }
    });

    return () => unsub();
  }, [uid]);

  return { isOnline, lastSeen };
};
