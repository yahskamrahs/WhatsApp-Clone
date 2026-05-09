import { useState, useEffect, useCallback } from 'react';
import { searchUsers } from '@/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from './UserAvatar';
import styles from './Modal.module.css';

const SearchModal = ({ onSelect, onClose }) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const users = await searchUsers(q);
      setResults(users.filter((u) => u.uid !== currentUser?.uid));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} animate-scaleIn`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>New Message</h3>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className={styles.searchWrap}>
          <span>🔍</span>
          <input
            autoFocus
            className={styles.searchInput}
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.results}>
          {loading && <p className={styles.hint}>Searching…</p>}
          {!loading && query && !results.length && (
            <p className={styles.hint}>No users found</p>
          )}
          {!loading && !query && (
            <p className={styles.hint}>Type to search for users</p>
          )}
          {results.map((user) => (
            <div key={user.uid} className={styles.userRow} onClick={() => onSelect(user)}>
              <UserAvatar user={user} size={40} showPresence />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.displayName}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
