import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { createOrGetDirectChat } from '@/firebase/firestore';
import { signOutUser } from '@/firebase/auth';
import { formatShortTime } from '@/utils/formatTime';
import UserAvatar from './UserAvatar';
import SearchModal from './SearchModal';
import GroupModal from './GroupModal';
import { SidebarSkeleton } from './skeletons/Skeletons';
import styles from './Sidebar.module.css';
import toast from 'react-hot-toast';

const Sidebar = ({ darkMode, onToggleDark }) => {
  const { currentUser, userDoc } = useAuth();
  const { chatList, chatListLoading, activeChat, openChat } = useChat();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    try { await signOutUser(); navigate('/login'); }
    catch (e) { toast.error('Logout failed'); }
  };

  const handleUserSelect = useCallback(async (user) => {
    setShowSearch(false);
    if (!currentUser) return;
    const chat = await createOrGetDirectChat(currentUser.uid, user.uid);
    openChat({ ...chat, id: chat.id || `${currentUser.uid}_${user.uid}` });
  }, [currentUser, openChat]);

  // Get other user's info for DM chats
  const getChatMeta = (chat) => {
    if (chat.type === 'group') {
      return { name: chat.groupName, photo: chat.groupPhoto || '', uid: null };
    }
    const otherUid = chat.members?.find((uid) => uid !== currentUser?.uid);
    return { name: `User (${otherUid?.slice(0, 6)})`, photo: '', uid: otherUid };
  };

  const getUnreadCount = (chat) => {
    // Simple heuristic: if lastMessage exists and I'm not the sender, check seen
    if (!chat.lastMessageSenderId || chat.lastMessageSenderId === currentUser?.uid) return 0;
    return 1; // Real count needs a separate query; simplified for demo
  };

  const filtered = chatList.filter((c) => {
    const meta = getChatMeta(c);
    return !search || meta.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>💬</span>
          <span className={styles.appName}>Chatter</span>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-ghost" onClick={onToggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-ghost" onClick={() => setShowGroup(true)} title="New group">
            👥
          </button>
          <button className="btn btn-ghost" onClick={() => setShowSearch(true)} title="New chat">
            ✏️
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.searchInput}
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Chat List */}
      <div className={styles.list}>
        {chatListLoading ? (
          <SidebarSkeleton />
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💬</span>
            <p>No conversations yet</p>
            <p className={styles.emptyHint}>Click ✏️ to start chatting</p>
          </div>
        ) : (
          filtered.map((chat) => {
            const meta = getChatMeta(chat);
            const isActive = activeChat?.id === chat.id;
            const unread = getUnreadCount(chat);

            return (
              <div
                key={chat.id}
                className={`${styles.chatItem} ${isActive ? styles.active : ''}`}
                onClick={() => openChat(chat)}
              >
                <UserAvatar
                  user={{ displayName: meta.name, photoURL: meta.photo, uid: meta.uid }}
                  size={46}
                  showPresence={!!meta.uid}
                />
                <div className={styles.chatInfo}>
                  <div className={styles.chatTop}>
                    <span className={styles.chatName}>{meta.name}</span>
                    {chat.lastMessageTime && (
                      <span className={styles.chatTime}>{formatShortTime(chat.lastMessageTime)}</span>
                    )}
                  </div>
                  <div className={styles.chatBottom}>
                    <span className={styles.lastMsg}>
                      {chat.lastMessageSenderId === currentUser?.uid && '✓ '}
                      {chat.lastMessage || 'No messages yet'}
                    </span>
                    {unread > 0 && <span className={styles.badge}>{unread}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Profile Footer */}
      <div className={styles.footer}>
        <div className={styles.profile} onClick={() => navigate('/profile')} role="button">
          <UserAvatar user={userDoc || currentUser} size={38} showPresence />
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{userDoc?.displayName || currentUser?.displayName || 'You'}</span>
            <span className={styles.profileStatus}>{userDoc?.statusText || '🟢 Online'}</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout} title="Logout">⏏</button>
      </div>

      {/* Modals */}
      {showSearch && <SearchModal onSelect={handleUserSelect} onClose={() => setShowSearch(false)} />}
      {showGroup && <GroupModal onClose={() => setShowGroup(false)} />}
    </aside>
  );
};

export default Sidebar;
