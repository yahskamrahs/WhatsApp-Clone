import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

// ─── Upsert user doc ─────────────────────────────────────────────────────────
const upsertUserDoc = async (user) => {
  const ref = doc(db, 'users', user.uid);
  await setDoc(
    ref,
    {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      email: user.email,
      photoURL: user.photoURL || '',
      isOnline: true,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      statusText: '',
    },
    { merge: true }
  );
};

// ─── Google Sign-In ───────────────────────────────────────────────────────────
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await upsertUserDoc(result.user);
  return result.user;
};

// ─── Email Sign-Up ────────────────────────────────────────────────────────────
export const signUpWithEmail = async (email, password, displayName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, {
    displayName,
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
  });
  await upsertUserDoc({ ...result.user, displayName });
  return result.user;
};

// ─── Email Sign-In ────────────────────────────────────────────────────────────
export const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await upsertUserDoc(result.user);
  return result.user;
};

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export const signOutUser = async () => {
  await signOut(auth);
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateUserProfile = async (user, { displayName, photoURL, statusText }) => {
  if (displayName || photoURL) {
    await updateProfile(user, { displayName, photoURL });
  }
  const ref = doc(db, 'users', user.uid);
  await setDoc(ref, { displayName, photoURL, statusText }, { merge: true });
};
