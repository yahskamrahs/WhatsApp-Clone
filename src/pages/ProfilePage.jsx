import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/firebase/auth';
import { uploadAvatar } from '@/firebase/storage';
import UserAvatar from '@/components/UserAvatar';
import styles from './ProfilePage.module.css';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(userDoc?.displayName || currentUser?.displayName || '');
  const [statusText, setStatusText] = useState(userDoc?.statusText || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handlePhotoChange = (e) => {
    const f = e.target.files[0];
    if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
  };

  const handleSave = async () => {
    if (!displayName.trim()) { toast.error('Name cannot be empty'); return; }
    setLoading(true);
    try {
      let photoURL = userDoc?.photoURL || currentUser?.photoURL || '';
      if (photoFile) {
        photoURL = await uploadAvatar(photoFile);
      }
      await updateUserProfile(currentUser, { displayName: displayName.trim(), photoURL, statusText: statusText.trim() });
      toast.success('Profile updated!');
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const avatarUser = {
    displayName,
    photoURL: photoPreview || userDoc?.photoURL || currentUser?.photoURL,
    uid: currentUser?.uid,
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button className="btn btn-ghost" onClick={() => navigate('/chat')}>← Back</button>
          <h1 className={styles.title}>Profile Settings</h1>
        </div>

        {/* Avatar */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrap} onClick={() => fileRef.current?.click()}>
            <UserAvatar user={avatarUser} size={90} showPresence />
            <div className={styles.avatarOverlay}>📷</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          <p className={styles.avatarHint}>Click to change photo</p>
        </div>

        {/* Fields */}
        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>Display Name</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <input
              className="input"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input className="input" value={currentUser?.email || ''} readOnly style={{ opacity: 0.6 }} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Account Created</label>
            <input
              className="input"
              value={userDoc?.createdAt?.toDate ? userDoc.createdAt.toDate().toLocaleDateString() : 'N/A'}
              readOnly
              style={{ opacity: 0.6 }}
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
