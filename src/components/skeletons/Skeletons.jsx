import styles from './Skeletons.module.css';

export const SidebarSkeleton = () => (
  <div className={styles.sidebarList}>
    {[...Array(6)].map((_, i) => (
      <div key={i} className={styles.sidebarItem}>
        <div className={`skeleton ${styles.avatar}`} />
        <div className={styles.info}>
          <div className={`skeleton ${styles.name}`} style={{ width: `${55 + i * 8}%` }} />
          <div className={`skeleton ${styles.preview}`} style={{ width: `${40 + i * 5}%` }} />
        </div>
      </div>
    ))}
  </div>
);

export const MessageSkeleton = () => (
  <div className={styles.messageList}>
    {[false, true, false, false, true, false].map((sent, i) => (
      <div key={i} className={`${styles.msgRow} ${sent ? styles.sent : ''}`}>
        {!sent && <div className={`skeleton ${styles.msgAvatar}`} />}
        <div className={`skeleton ${styles.bubble}`} style={{ width: `${120 + i * 30}px` }} />
      </div>
    ))}
  </div>
);
