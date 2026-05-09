import { useEffect, useRef } from 'react';
import EmojiPickerLib from 'emoji-picker-react';
import styles from './EmojiPicker.module.css';

const EmojiPicker = ({ onEmojiClick, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className={`${styles.wrapper} animate-scaleIn`}>
      <EmojiPickerLib
        onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)}
        theme="dark"
        searchPlaceholder="Search emoji…"
        height={380}
        width={320}
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
      />
    </div>
  );
};

export default EmojiPicker;
