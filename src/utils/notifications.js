const NOTIFICATION_EVENT = 'peezuhub:notifications-updated';

export function emitUnreadCountChange(unreadCount = 0) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: { unreadCount: Number(unreadCount) || 0 },
    })
  );
}

export function subscribeUnreadCountChange(callback) {
  if (typeof window === 'undefined') return () => {};

  const handler = (event) => {
    callback(Number(event?.detail?.unreadCount) || 0);
  };

  window.addEventListener(NOTIFICATION_EVENT, handler);
  return () => window.removeEventListener(NOTIFICATION_EVENT, handler);
}

export function getNotificationTarget(item, fallback = '/profile?tab=notifications') {
  if (item?.meta?.actionUrl) return item.meta.actionUrl;
  if (item?.meta?.listingId) return `/listings/${item.meta.listingId}`;
  return fallback;
}
