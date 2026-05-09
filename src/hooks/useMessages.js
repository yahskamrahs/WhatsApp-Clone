import { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { markSeen } from '@/firebase/firestore';
import { useAuth } from '@/context/AuthContext';

const MESSAGE_PAGE_SIZE = 50;

/**
 * Subscribes to messages for a chat in real-time.
 * Automatically marks the latest message as seen.
 */
export const useMessages = (chatId) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const latestMsgRef = useRef(null);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(MESSAGE_PAGE_SIZE)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setLoading(false);

      // Mark last message as seen
      const last = msgs[msgs.length - 1];
      if (
        last &&
        last.senderId !== currentUser?.uid &&
        !last.seenBy?.includes(currentUser?.uid)
      ) {
        markSeen(chatId, last.id, currentUser.uid).catch(() => {});
        latestMsgRef.current = last.id;
      }
    });

    return () => unsub();
  }, [chatId, currentUser]);

  return { messages, loading };
};
