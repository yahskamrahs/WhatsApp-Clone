import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';
import { generateChatId } from '@/utils/generateChatId';

// ─── Users ────────────────────────────────────────────────────────────────────

export const getUserDoc = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const searchUsers = async (queryText) => {
  if (!queryText.trim()) return [];
  const lc = queryText.toLowerCase();

  const byName = query(
    collection(db, 'users'),
    where('displayName', '>=', queryText),
    where('displayName', '<=', queryText + '\uf8ff'),
    limit(15)
  );
  const byEmail = query(
    collection(db, 'users'),
    where('email', '>=', lc),
    where('email', '<=', lc + '\uf8ff'),
    limit(10)
  );

  const [nameSnap, emailSnap] = await Promise.all([getDocs(byName), getDocs(byEmail)]);
  const results = new Map();
  [...nameSnap.docs, ...emailSnap.docs].forEach((d) => results.set(d.id, { id: d.id, ...d.data() }));
  return [...results.values()];
};

// ─── Chats ────────────────────────────────────────────────────────────────────

export const createOrGetDirectChat = async (uid1, uid2) => {
  const chatId = generateChatId(uid1, uid2);
  const ref = doc(db, 'chats', chatId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      type: 'direct',
      members: [uid1, uid2],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: '',
    });
  }
  return { id: chatId, ...((snap.exists() && snap.data()) || {}) };
};

export const createGroupChat = async (name, memberUids, adminUid, photoURL = '') => {
  const ref = await addDoc(collection(db, 'chats'), {
    type: 'group',
    groupName: name,
    groupPhoto: photoURL,
    members: memberUids,
    admins: [adminUid],
    createdAt: serverTimestamp(),
    lastMessage: '',
    lastMessageTime: serverTimestamp(),
    lastMessageSenderId: '',
    createdBy: adminUid,
  });
  return ref.id;
};

export const updateGroupChat = async (chatId, updates) => {
  await updateDoc(doc(db, 'chats', chatId), updates);
};

export const addMemberToGroup = async (chatId, uid) => {
  await updateDoc(doc(db, 'chats', chatId), { members: arrayUnion(uid) });
};

export const removeMemberFromGroup = async (chatId, uid) => {
  await updateDoc(doc(db, 'chats', chatId), { members: arrayRemove(uid) });
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const sendMessage = async (chatId, payload) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const msgRef = await addDoc(messagesRef, {
    ...payload,
    createdAt: serverTimestamp(),
    editedAt: null,
    seenBy: [payload.senderId],
    reactions: {},
    isPinned: false,
    replyTo: payload.replyTo || null,
    type: payload.type || 'text',
  });

  // Update chat's lastMessage preview
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: payload.text || (payload.type === 'image' ? '📷 Image' : '📎 File'),
    lastMessageTime: serverTimestamp(),
    lastMessageSenderId: payload.senderId,
  });

  return msgRef.id;
};

export const editMessage = async (chatId, messageId, newText) => {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    text: newText,
    editedAt: serverTimestamp(),
  });
};

export const deleteMessage = async (chatId, messageId) => {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    text: '',
    deleted: true,
    imageUrl: null,
    fileUrl: null,
  });
};

export const markSeen = async (chatId, messageId, uid) => {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    seenBy: arrayUnion(uid),
  });
};

// ─── Reactions ────────────────────────────────────────────────────────────────

export const addReaction = async (chatId, messageId, uid, emoji) => {
  const ref = doc(db, 'chats', chatId, 'messages', messageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const reactions = snap.data().reactions || {};
  const users = reactions[emoji] || [];
  const alreadyReacted = users.includes(uid);

  await updateDoc(ref, {
    [`reactions.${emoji}`]: alreadyReacted ? arrayRemove(uid) : arrayUnion(uid),
  });
};

// ─── Pin ──────────────────────────────────────────────────────────────────────

export const pinMessage = async (chatId, messageId, pin = true) => {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    isPinned: pin,
  });
};

// ─── Typing Status ────────────────────────────────────────────────────────────

export const setTypingStatus = async (chatId, uid, isTyping) => {
  await setDoc(
    doc(db, 'typingStatus', chatId),
    { [uid]: isTyping },
    { merge: true }
  );
};
