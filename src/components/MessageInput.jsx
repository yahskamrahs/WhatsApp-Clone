import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/context/AuthContext';
import { sendMessage } from '@/firebase/firestore';
import { uploadImage, uploadFile } from '@/firebase/storage';
import { useTyping } from '@/hooks/useTyping';
import EmojiPicker from './EmojiPicker';
import styles from './MessageInput.module.css';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const MessageInput = ({ chatId, replyTo, onCancelReply }) => {
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef(null);
  const { setTyping } = useTyping(chatId);

  const handleTextChange = (e) => {
    setText(e.target.value);
    setTyping(e.target.value.length > 0);
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; }
  };

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !chatId || !currentUser) return;

    const payload = {
      senderId: currentUser.uid,
      text: trimmed,
      type: 'text',
      replyTo: replyTo
        ? { messageId: replyTo.id, text: replyTo.text, senderId: replyTo.senderId, senderName: replyTo.senderName }
        : null,
    };

    setText('');
    setTyping(false);
    onCancelReply?.();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await sendMessage(chatId, payload);
  }, [text, chatId, currentUser, replyTo, setTyping, onCancelReply]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const processFile = async (file) => {
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Max 25MB.'); return;
    }
    const isImage = file.type.startsWith('image/');
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = isImage
        ? await uploadImage(file, (p) => setUploadProgress(p))
        : await uploadFile(file, 'chat-files', (p) => setUploadProgress(p));

      await sendMessage(chatId, {
        senderId: currentUser.uid,
        text: '',
        type: isImage ? 'image' : 'file',
        imageUrl: isImage ? url : null,
        fileUrl: !isImage ? url : null,
        fileName: file.name,
        replyTo: null,
      });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files.forEach(processFile),
    noClick: true,
    accept: { 'image/*': [], 'application/pdf': [], 'application/zip': [], 'text/*': [] },
  });

  const fileInputRef = useRef(null);

  return (
    <div className={`${styles.container} ${isDragActive ? styles.dragOver : ''}`} {...getRootProps()}>
      <input {...getInputProps()} />
      <input ref={fileInputRef} type="file" hidden onChange={(e) => { if (e.target.files[0]) processFile(e.target.files[0]); }} />

      {replyTo && (
        <div className={styles.replyBanner}>
          <span className={styles.replyIcon}>↩</span>
          <div className={styles.replyInfo}>
            <span className={styles.replyUser}>{replyTo.senderName || 'User'}</span>
            <span className={styles.replyText}>{replyTo.text || '📎 Attachment'}</span>
          </div>
          <button className={styles.replyClose} onClick={onCancelReply}>✕</button>
        </div>
      )}

      {isDragActive && (
        <div className={styles.dropOverlay}>📁 Drop files to send</div>
      )}

      {uploading && (
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      <div className={styles.inputRow}>
        {/* Emoji */}
        <div className={styles.emojiWrap}>
          <button
            className={`${styles.iconBtn} ${showEmoji ? styles.active : ''}`}
            onClick={() => setShowEmoji((v) => !v)}
            title="Emoji"
          >😊</button>
          {showEmoji && (
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        {/* File attach */}
        <button className={styles.iconBtn} onClick={() => fileInputRef.current?.click()} title="Attach file" disabled={uploading}>
          📎
        </button>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? `Uploading… ${uploadProgress}%` : 'Type a message…'}
          className={styles.textarea}
          rows={1}
          disabled={uploading}
        />

        {/* Send */}
        <button
          className={`${styles.sendBtn} ${text.trim() || uploading ? styles.active : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || uploading}
          title="Send"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
