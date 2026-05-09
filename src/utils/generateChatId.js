/**
 * Generates a deterministic chat ID for a direct message between two users.
 * Sorting ensures uid1_uid2 === uid2_uid1.
 */
export const generateChatId = (uid1, uid2) => {
  return [uid1, uid2].sort().join('_');
};
