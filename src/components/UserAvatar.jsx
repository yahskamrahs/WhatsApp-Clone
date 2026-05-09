import { usePresence } from '@/hooks/usePresence';
import styles from './UserAvatar.module.css';

const UserAvatar = ({ user, size = 40, showPresence = false, className = '' }) => {
  const { isOnline } = usePresence(showPresence ? user?.uid : null);

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div
      className={`${styles.wrapper} ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {user?.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'User'}
          className={styles.img}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div className={styles.initials} style={{ fontSize: size * 0.35 }}>
          {initials}
        </div>
      )}
      {showPresence && (
        <span
          className={`${styles.dot} ${isOnline ? styles.online : styles.offline}`}
        />
      )}
    </div>
  );
};

export default UserAvatar;
