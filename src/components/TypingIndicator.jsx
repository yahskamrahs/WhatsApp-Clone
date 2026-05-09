import styles from './TypingIndicator.module.css';

const TypingIndicator = ({ names = [] }) => {
  if (!names.length) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.slice(0, 2).join(', ')} are typing`;

  return (
    <div className={`${styles.wrapper} animate-fadeIn`}>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <span className={styles.label}>{label}…</span>
    </div>
  );
};

export default TypingIndicator;
