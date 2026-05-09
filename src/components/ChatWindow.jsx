import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useTyping } from '@/hooks/useTyping';
import { usePresence } from '@/hooks/usePresence';
import { getUserDoc } from '@/firebase/firestore';
import { formatDateLabel } from '@/utils/formatTime';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import UserAvatar from './UserAvatar';
import { MessageSkeleton } from './skeletons/Skeletons';
import styles from './ChatWindow.module.css';

const ChatWindow = ({ chat, onBack }) => {
  const { currentUser } = useAuth();
  const { messages, loading } = useMessages(chat.id);
  const { typingUsers } = useTyping(chat.id);
  const [replyTo, setReplyTo] = useState(null);
  const [senderCache, setSenderCache] = useState({});
  const [typingNames, setTypingNames] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const [pinned, setPinned] = useState([]);

  // Determine who to show in header
  const otherUid = chat.type === 'direct'
    ? chat.members?.find((uid) => uid !== currentUser?.uid)
    : null;
  const { isOnline } = usePresence(otherUid);

  const headerName = chat.type === 'group'
    ? chat.groupName
    : (senderCache[otherUid]?.displayName || 'Loading…');

  const headerPhoto = chat.type === 'group' ? chat.groupPhoto : senderCache[otherUid]?.photoURL;
  const headerUser = { displayName: headerName, photoURL: headerPhoto, uid: otherUid };

  // Fetch senders we haven't cached yet
  useEffect(() => {
    const uids = [...new Set(messages.map((m) => m.senderId))];
    const missing = uids.filter((uid) => !senderCache[uid]);
    if (!missing.length) return;
    Promise.all(missing.map((uid) => getUserDoc(uid))).then((docs) => {
      const map = {};
      docs.forEach((d) => { if (d) map[d.id] = d; });
      setSenderCache((prev) => ({ ...prev, ...map }));
    });
  }, [messages]);

  // Resolve typing user names
  useEffect(() => {
    if (!typingUsers.length) { setTypingNames([]); return; }
    Promise.all(typingUsers.map((uid) => senderCache[uid] ? Promise.resolve(senderCache[uid]) : getUserDoc(uid)))
      .then((docs) => setTypingNames(docs.map((d) => d?.displayName || 'Someone').filter(Boolean)));
  }, [typingUsers, senderCache]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingNames.length]);

  // Collect pinned messages
  useEffect(() => {
    setPinned(messages.filter((m) => m.isPinned && !m.deleted));
  }, [messages]);

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const dateLabel = formatDateLabel(msg.createdAt);
    if (dateLabel !== lastDate) {
      grouped.push({ type: 'date', label: dateLabel, key: `date-${dateLabel}` });
      lastDate = dateLabel;
    }
    grouped.push({ type: 'message', msg, key: msg.id });
  });

  const handleReply = useCallback((msg) => {
    const sender = senderCache[msg.senderId];
    setReplyTo({ ...msg, senderName: sender?.displayName || 'User' });
  }, [senderCache]);

  const memberCount = chat.members?.length || 0;

  return (
    <div className={styles.window}>
      {/* Header */}
      <div className={styles.header}>
        {onBack && (
          <button className="btn btn-ghost" onClick={onBack}>←</button>
        )}
        <UserAvatar user={headerUser} size={40} showPresence={!!otherUid} />
        <div className={styles.headerInfo}>
          <h2 className={styles.headerName}>{headerName}</h2>
          <span className={styles.headerSub}>
            {chat.type === 'group'
              ? `${memberCount} member${memberCount !== 1 ? 's' : ''}`
              : isOnline ? '🟢 Online' : '⚫ Offline'}
          </span>
        </div>
        <div className={styles.headerActions}>
          {pinned.length > 0 && (
            <button className="btn btn-ghost" onClick={() => setShowPinned((v) => !v)} title="Pinned messages">
              📌 {pinned.length}
            </button>
          )}
        </div>
      </div>

      {/* Pinned messages panel */}
      {showPinned && pinned.length > 0 && (
        <div className={`${styles.pinnedPanel} animate-fadeIn`}>
          <span className={styles.pinnedTitle}>📌 Pinned Messages</span>
          {pinned.map((m) => (
            <div key={m.id} className={styles.pinnedItem}>
              <span className={styles.pinnedText}>{m.text || '📎 Attachment'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={listRef} className={styles.messages}>
        {loading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>👋</span>
            <p>Say hello!</p>
            <p className={styles.emptyHint}>This is the start of your conversation.</p>
          </div>
        ) : (
          grouped.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className={styles.dateSep}>
                  <span>{item.label}</span>
                </div>
              );
            }
            const { msg } = item;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                chatId={chat.id}
                senderUser={senderCache[msg.senderId]}
                onReply={handleReply}
              />
            );
          })
        )}

        {typingNames.length > 0 && (
          <div className={styles.typing}>
            <TypingIndicator names={typingNames} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        chatId={chat.id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default ChatWindow;
