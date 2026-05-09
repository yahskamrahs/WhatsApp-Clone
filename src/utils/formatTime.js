import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  differenceInMinutes,
  differenceInSeconds,
} from 'date-fns';

/**
 * Converts a Firestore Timestamp or JS Date to a human-readable string.
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return '';

  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const secondsDiff = differenceInSeconds(now, date);
  const minutesDiff = differenceInMinutes(now, date);

  if (secondsDiff < 30) return 'just now';
  if (minutesDiff < 60) return `${minutesDiff}m ago`;
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'dd MMM, HH:mm');
};

/**
 * Returns a shorter timestamp for sidebar previews.
 */
export const formatShortTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const minutesDiff = differenceInMinutes(now, date);

  if (minutesDiff < 1) return 'now';
  if (minutesDiff < 60) return `${minutesDiff}m`;
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd/MM/yy');
};

/**
 * Full date label for message groups.
 */
export const formatDateLabel = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};
