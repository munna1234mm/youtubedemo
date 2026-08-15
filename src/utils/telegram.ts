import confetti from 'canvas-confetti';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          start_param?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        shareToStory?: (media_url: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
        sendData: (data: string) => void;
      };
    };
  }
}

export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection' = 'light') => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    try {
      if (type === 'success' || type === 'warning') {
        tg.HapticFeedback.notificationOccurred(type);
      } else if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch {
      // ignore
    }
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(type === 'heavy' ? 30 : 15);
    } catch {
      // ignore
    }
  }
};

export const shareToTelegram = (url: string, text: string) => {
  const tg = getTelegramWebApp();
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  if (tg) {
    try {
      tg.openTelegramLink(shareUrl);
      return;
    } catch {
      // fallback
    }
  }
  window.open(shareUrl, '_blank');
};

export const fireConfetti = (origin = { x: 0.5, y: 0.7 }) => {
  confetti({
    particleCount: 65,
    spread: 60,
    origin,
    colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#34d399'],
    zIndex: 9999,
  });
};
