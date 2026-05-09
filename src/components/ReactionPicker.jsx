import styles from './ReactionPicker.module.css';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

const ReactionPicker = ({ onSelect, className = '' }) => {
  return (
    <div className={`${styles.picker} ${className} animate-scaleIn`}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          className={styles.emojiBtn}
          onClick={() => onSelect(emoji)}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
