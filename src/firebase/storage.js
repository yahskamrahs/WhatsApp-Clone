import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Firebase Storage.
 * @param {File} file
 * @param {string} folder  e.g. 'chat-images' | 'chat-files' | 'avatars'
 * @param {Function} onProgress  callback(percent: number)
 * @returns {Promise<string>} download URL
 */
export const uploadFile = (file, folder = 'chat-files', onProgress = null) => {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop();
    const storageRef = ref(storage, `${folder}/${uuidv4()}.${ext}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snap) => {
        if (onProgress) {
          const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
          onProgress(Math.round(pct));
        }
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
};

export const uploadImage = (file, onProgress) => uploadFile(file, 'chat-images', onProgress);
export const uploadAvatar = (file, onProgress) => uploadFile(file, 'avatars', onProgress);
