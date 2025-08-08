import { useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  persistent?: boolean;
  onClick?: () => void;
}

interface UseNotificationReturn {
  showNotification: (options: NotificationOptions) => void;
  requestPermission: () => Promise<NotificationPermission>;
  isSupported: boolean;
  permission: NotificationPermission;
}

export const useNotification = (): UseNotificationReturn => {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permission = isSupported ? Notification.permission : 'denied';

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    if (permission === 'granted') {
      return 'granted';
    }

    try {
      const result = await Notification.requestPermission();
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported, permission]);

  const showBrowserNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'stackpro-notification',
      requireInteraction: options.persistent || false,
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };

    // Auto-close after duration (default 5 seconds)
    if (!options.persistent) {
      const duration = options.duration || 5000;
      setTimeout(() => {
        notification.close();
      }, duration);
    }
  }, [isSupported, permission]);

  const showInAppNotification = useCallback((options: NotificationOptions) => {
    // Create in-app notification element
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 max-w-sm w-full bg-white border border-gray-200 rounded-lg shadow-lg
      transform transition-transform duration-300 ease-in-out translate-x-full
    `;

    // Set notification style based on type
    const typeStyles = {
      info: 'border-l-4 border-l-blue-500',
      success: 'border-l-4 border-l-green-500',
      warning: 'border-l-4 border-l-yellow-500',
      error: 'border-l-4 border-l-red-500'
    };

    notification.className += ` ${typeStyles[options.type || 'info']}`;

    // Set notification content
    notification.innerHTML = `
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-gray-900">${options.title}</h4>
            <p class="text-sm text-gray-600 mt-1">${options.body}</p>
          </div>
          <button class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add click handler
    if (options.onClick) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          options.onClick?.();
        }
      });
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });

    // Auto-remove after duration
    if (!options.persistent) {
      const duration = options.duration || 5000;
      setTimeout(() => {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, duration);
    }
  }, []);

  const showNotification = useCallback((options: NotificationOptions) => {
    // Try browser notification first, fallback to in-app
    if (isSupported && permission === 'granted') {
      showBrowserNotification(options);
    } else {
      showInAppNotification(options);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Notification] ${options.title}: ${options.body}`);
    }
  }, [isSupported, permission, showBrowserNotification, showInAppNotification]);

  return {
    showNotification,
    requestPermission,
    isSupported,
    permission
  };
};

export default useNotification;
