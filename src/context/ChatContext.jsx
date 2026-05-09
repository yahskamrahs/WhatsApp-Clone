import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeChat, setActiveChat] = useState(null); // { id, ...chatData }
  const [chatList, setChatList] = useState([]);
  const [chatListLoading, setChatListLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setChatList([]);
      setChatListLoading(false);
      return;
    }

    setChatListLoading(true);
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChatList(chats);
      setChatListLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const openChat = useCallback((chat) => {
    setActiveChat(chat);
  }, []);

  const closeChat = useCallback(() => {
    setActiveChat(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{ activeChat, chatList, chatListLoading, openChat, closeChat }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
