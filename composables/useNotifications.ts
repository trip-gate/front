export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type AppNotification = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  timeoutMs: number;
};

let nextNotificationId = 1;

export function useNotifications() {
  const notifications = useState<AppNotification[]>('ui:notifications', () => []);

  function dismiss(id: number) {
    notifications.value = notifications.value.filter((item) => item.id !== id);
  }

  function push(input: {
    title: string;
    message: string;
    type?: NotificationType;
    timeoutMs?: number;
  }) {
    const notification: AppNotification = {
      id: nextNotificationId++,
      title: input.title,
      message: input.message,
      type: input.type ?? 'info',
      timeoutMs: input.timeoutMs ?? 3800,
    };

    notifications.value = [...notifications.value, notification];

    if (import.meta.client && notification.timeoutMs > 0) {
      window.setTimeout(() => dismiss(notification.id), notification.timeoutMs);
    }

    return notification.id;
  }

  function success(title: string, message: string, timeoutMs?: number) {
    return push({ title, message, timeoutMs, type: 'success' });
  }

  function error(title: string, message: string, timeoutMs?: number) {
    return push({ title, message, timeoutMs, type: 'error' });
  }

  function info(title: string, message: string, timeoutMs?: number) {
    return push({ title, message, timeoutMs, type: 'info' });
  }

  function warning(title: string, message: string, timeoutMs?: number) {
    return push({ title, message, timeoutMs, type: 'warning' });
  }

  return {
    notifications,
    push,
    dismiss,
    success,
    error,
    info,
    warning,
  };
}

