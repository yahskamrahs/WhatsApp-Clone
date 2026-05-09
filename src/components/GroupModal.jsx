import { useState, useEffect, useCallback } from 'react';
import { searchUsers, createGroupChat } from '@/firebase/firestore';
import { uploadImage } from '@/firebase/storage';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import UserAvatar from './UserAvatar';
import styles from './Modal.module.css';
import toast from 'react-hot-toast';

const GroupModal = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { openChat } = useChat();
  const [step, setStep] = useState(1); // 1=details, 2=members
  const [groupName, setGroupName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const users = await searchUsers(q);
    setSearchResults(users.filter((u) => u.uid !== currentUser?.uid));
  }, [currentUser]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const handlePhotoChange = (e) => {
    const f = e.target.files[0];
    if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
  };

  const toggleSelect = (user) => {
    setSelected((prev) =>
      prev.find((u) => u.uid === user.uid)
        ? prev.filter((u) => u.uid !== user.uid)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { toast.error('Group name required'); return; }
    if (selected.length < 1) { toast.error('Add at least 1 member'); return; }
    setLoading(true);
    try {
      let photoURL = '';
      if (photoFile) {
        photoURL = await uploadImage(photoFile, (p) => {});
      }
      const memberUids = [currentUser.uid, ...selected.map((u) => u.uid)];
      const chatId = await createGroupChat(groupName.trim(), memberUids, currentUser.uid, photoURL);
      openChat({ id: chatId, type: 'group', groupName: groupName.trim(), groupPhoto: photoURL, members: memberUids, admins: [currentUser.uid] });
      toast.success('Group created!');
      onClose();
    } catch (e) {
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} animate-scaleIn`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>New Group</h3>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>

        {step === 1 ? (
          <div className={styles.body}>
            {/* Photo picker */}
            <label className={styles.photoPicker}>
              {photoPreview
                ? <img src={photoPreview} alt="group" className={styles.photoPreview} />
                : <span className={styles.photoPlaceholder}>📷</span>}
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>

            <input
              className="input"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={60}
            />
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => setStep(2)}
              disabled={!groupName.trim()}
            >
              Next →
            </button>
          </div>
        ) : (
          <div className={styles.body}>
            {selected.length > 0 && (
              <div className={styles.selectedWrap}>
                {selected.map((u) => (
                  <div key={u.uid} className={styles.selectedChip}>
                    <UserAvatar user={u} size={24} />
                    <span>{u.displayName}</span>
                    <button onClick={() => toggleSelect(u)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.searchWrap}>
              <span>🔍</span>
              <input
                autoFocus
                className={styles.searchInput}
                placeholder="Add members…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className={styles.results}>
              {searchResults.map((user) => {
                const isSelected = !!selected.find((u) => u.uid === user.uid);
                return (
                  <div
                    key={user.uid}
                    className={`${styles.userRow} ${isSelected ? styles.selectedRow : ''}`}
                    onClick={() => toggleSelect(user)}
                  >
                    <UserAvatar user={user} size={40} />
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{user.displayName}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    {isSelected && <span className={styles.checkmark}>✓</span>}
                  </div>
                );
              })}
              {!query && <p className={styles.hint}>Search for people to add</p>}
            </div>

            <div className={styles.footer}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !selected.length}>
                {loading ? 'Creating…' : `Create Group (${selected.length + 1})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupModal;
