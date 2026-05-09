import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { setTypingStatus } from '@/firebase/firestore';
import { useAuth } from '@/context/AuthContext';

const TYPING_TIMEOUT = 3000; // ms of inactivity before clearing typing

/**
 * Manages typing indicator for a chat.
 * @param {string} chatId
 * @returns {{ typingUsers: string[], setTyping: (boolean) => void }}
 */
export const useTyping = (chatId) => {
  const { currentUser } = useAuth();
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimer = useRef(null);
  const isCurrentlyTyping = useRef(false);

  // Subscribe to typing status
  useEffect(() => {
    if (!chatId) return;
    const ref = doc(db, 'typingStatus', chatId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const others = Object.entries(data)
        .filter(([uid, val]) => uid !== currentUser?.uid && val === true)
        .map(([uid]) => uid);
      setTypingUsers(others);
    });

    return () => unsub();
  }, [chatId, currentUser]);

  // Expose a debounced setter
  const setTyping = useCallback(
    (typing) => {
      if (!chatId || !currentUser) return;

      if (typing && !isCurrentlyTyping.current) {
        isCurrentlyTyping.current = true;
        setTypingStatus(chatId, currentUser.uid, true).catch(() => {});
      }

      // Reset the auto-clear timer on each keystroke
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        isCurrentlyTyping.current = false;
        setTypingStatus(chatId, currentUser.uid, false).catch(() => {});
      }, TYPING_TIMEOUT);

      if (!typing) {
        clearTimeout(typingTimer.current);
        isCurrentlyTyping.current = false;
        setTypingStatus(chatId, currentUser.uid, false).catch(() => {});
      }
    },
    [chatId, currentUser]
  );

  // Clear on unmount / chat change
  useEffect(() => {
    return () => {
      clearTimeout(typingTimer.current);
      if (chatId && currentUser && isCurrentlyTyping.current) {
        setTypingStatus(chatId, currentUser.uid, false).catch(() => {});
      }
    };
  }, [chatId, currentUser]);

  return { typingUsers, setTyping };
};
