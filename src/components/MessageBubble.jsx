import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { editMessage, deleteMessage, addReaction, pinMessage } from '@/firebase/firestore';
import { formatTime } from '@/utils/formatTime';
import UserAvatar from './UserAvatar';
import ReactionPicker from './ReactionPicker';
import styles from './MessageBubble.module.css';

const MessageBubble = ({ message, chatId, senderUser, onReply }) => {
  const { currentUser } = useAuth();
  const isSent = message.senderId === currentUser?.uid;
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const editRef = useRef(null);

  const handleEdit = async () => {
    if (!editText.trim() || editText === message.text) { setEditing(false); return; }
    await editMessage(chatId, message.id, editText.trim());
    setEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      await deleteMessage(chatId, message.id);
    }
    setShowMenu(false);
  };

  const handleReact = async (emoji) => {
    await addReaction(chatId, message.id, currentUser.uid, emoji);
    setShowReactions(false);
  };

  const handlePin = async () => {
    await pinMessage(chatId, message.id, !message.isPinned);
    setShowMenu(false);
  };

  const timeStr = formatTime(message.createdAt);
  const seenCount = message.seenBy?.length || 0;
  const isDeleted = message.deleted;
  const reactionEntries = Object.entries(message.reactions || {}).filter(([, uids]) => uids.length > 0);

  return (
    <div
      className={`${styles.row} ${isSent ? styles.sent : styles.recv} animate-fadeIn`}
      onMouseEnter={() => setShowReactions(false)}
    >
      {!isSent && (
        <UserAvatar user={senderUser} size={32} showPresence={false} className={styles.avatar} />
      )}

      <div className={styles.group}>
        {!isSent && senderUser?.displayName && (
          <span className={styles.senderName}>{senderUser.displayName}</span>
        )}

        {/* Reply preview */}
        {message.replyTo && !isDeleted && (
          <div className={`${styles.replyPreview} ${isSent ? styles.sentReply : ''}`}>
            <span className={styles.replyLine} />
            <div className={styles.replyContent}>
              <span className={styles.replyName}>{message.replyTo.senderName || 'User'}</span>
              <span className={styles.replyText}>{message.replyTo.text || '📎 Attachment'}</span>
            </div>
          </div>
        )}

        {/* Main bubble */}
        <div
          className={`${styles.bubble} ${isSent ? styles.sentBubble : styles.recvBubble} ${message.isPinned ? styles.pinned : ''}`}
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => { setShowMenu(false); }}
        >
          {isDeleted ? (
            <span className={styles.deleted}>🚫 This message was deleted</span>
          ) : editing ? (
            <div className={styles.editArea}>
              <textarea
                ref={editRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className={styles.editInput}
                autoFocus
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                  if (e.key === 'Escape') setEditing(false);
                }}
              />
              <div className={styles.editActions}>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleEdit} style={{ padding: '4px 12px', fontSize: '12px' }}>Save</button>
              </div>
            </div>
          ) : (
            <>
              {message.imageUrl && (
                <img src={message.imageUrl} alt="attachment" className={styles.imgAttachment}
                  onClick={() => window.open(message.imageUrl, '_blank')} />
              )}
              {message.fileUrl && (
                <a href={message.fileUrl} target="_blank" rel="noreferrer" className={styles.fileLink}>
                  📎 {message.fileName || 'File'}
                </a>
              )}
              {message.text && <p className={styles.text}>{message.text}</p>}
            </>
          )}

          {/* Hover actions */}
          {showMenu && !isDeleted && !editing && (
            <div className={`${styles.actions} ${isSent ? styles.actionsLeft : styles.actionsRight}`}>
              <button className={styles.actionBtn} title="React" onClick={() => setShowReactions(v => !v)}>😊</button>
              <button className={styles.actionBtn} title="Reply" onClick={() => onReply?.(message)}>↩</button>
              {isSent && <button className={styles.actionBtn} title="Edit" onClick={() => { setEditing(true); setShowMenu(false); }}>✏️</button>}
              <button className={styles.actionBtn} title={message.isPinned ? 'Unpin' : 'Pin'} onClick={handlePin}>📌</button>
              {isSent && <button className={`${styles.actionBtn} ${styles.danger}`} title="Delete" onClick={handleDelete}>🗑</button>}
            </div>
          )}

          {/* Reaction picker */}
          {showReactions && (
            <ReactionPicker
              className={`${styles.reactionPicker} ${isSent ? styles.reactionLeft : ''}`}
              onSelect={handleReact}
            />
          )}
        </div>


        {/* Reactions display */}
        {reactionEntries.length > 0 && (
          <div className={`${styles.reactions} ${isSent ? styles.reactionsRight : ''}`}>
            {reactionEntries.map(([emoji, uids]) => (
              <button
                key={emoji}
                className={`${styles.reactionChip} ${uids.includes(currentUser?.uid) ? styles.myReaction : ''}`}
                onClick={() => handleReact(emoji)}
              >
                {emoji} <span>{uids.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp + seen */}
        <div className={`${styles.meta} ${isSent ? styles.metaRight : ''}`}>
          {message.editedAt && <span className={styles.edited}>edited</span>}
          {message.isPinned && <span className={styles.pinnedTag}>📌</span>}
          <span className={styles.time}>{timeStr}</span>
          {isSent && (
            <span className={styles.seen} title={`Seen by ${seenCount}`}>
              {seenCount > 1 ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
