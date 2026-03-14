import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from './useNotificationSound';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
}

export const usePushNotifications = () => {
  const { adminProfile } = useAuth();
  const { playSound } = useNotificationSound();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const hasRequestedPermission = useRef(false);

  // Check support and current permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Auto-request permission on user interaction (only once)
  useEffect(() => {
    if (!isSupported || hasRequestedPermission.current || permission !== 'default') return;

    const handleInteraction = () => {
      if (hasRequestedPermission.current) return;
      hasRequestedPermission.current = true;
      
      try {
        Notification.requestPermission().then(result => {
          setPermission(result);
          console.log('Notification permission:', result);
        }).catch(err => {
          console.warn('Notification permission request failed:', err);
        });
      } catch (err) {
        // Safari fallback - callback-based API
        try {
          Notification.requestPermission((result) => {
            setPermission(result);
          });
        } catch (e) {
          console.warn('Notification not available:', e);
        }
      }
    };

    // Use multiple interaction events for better coverage
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(evt => window.addEventListener(evt, handleInteraction, { once: true, passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleInteraction));
    };
  }, [isSupported, permission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((options: PushNotificationOptions) => {
    // Always play sound
    try { playSound(); } catch (e) { /* ignore */ }
    
    if (!isSupported) return null;

    // Update permission state in case it changed
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const createNotification = (opts: PushNotificationOptions) => {
      try {
        const notification = new Notification(opts.title, {
          body: opts.body,
          icon: opts.icon || '/newlogo.png',
          badge: opts.badge || '/newlogo.png',
          tag: opts.tag || `notification-${Date.now()}`,
          requireInteraction: opts.requireInteraction ?? false,
          silent: false,
        });

        const closeTimeout = opts.requireInteraction ? 30000 : 10000;
        setTimeout(() => {
          try { notification.close(); } catch (e) { /* ignore */ }
        }, closeTimeout);

        notification.onclick = (event) => {
          event.preventDefault();
          try { notification.close(); } catch (e) { /* ignore */ }
          window.focus();
        };
        
        return notification;
      } catch (error) {
        console.warn('Notification creation failed:', error);
        return null;
      }
    };
    
    const currentPermission = Notification.permission;
    
    if (currentPermission === 'granted') {
      return createNotification(options);
    }
    
    if (currentPermission === 'default') {
      Notification.requestPermission().then(result => {
        setPermission(result);
        if (result === 'granted') {
          createNotification(options);
        }
      }).catch(() => {});
    }

    return null;
  }, [isSupported, playSound]);

  // Subscribe to admin notifications in real-time
  useEffect(() => {
    if (!adminProfile || !isSupported) return;

    const channel = supabase
      .channel('push-notifications-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        async (payload) => {
          const notification = payload.new as any;
          
          const isForMe = notification.recipient_type === 'all' || 
            (notification.recipients && notification.recipients.includes(adminProfile.id));
          
          const isFromMe = notification.sender_id === adminProfile.id;
          
          if (isForMe && !isFromMe) {
            // Play sound
            try { playSound(); } catch (e) { /* ignore */ }
            
            let priorityText = '';
            if (notification.priority === 'urgent') priorityText = '🚨 URGENT: ';
            else if (notification.priority === 'high') priorityText = '⚠️ ';
            
            showNotification({
              title: `${priorityText}${notification.title}`,
              body: notification.message,
              tag: `notification-${notification.id}`,
              requireInteraction: notification.priority === 'urgent' || notification.priority === 'high',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Push notification subscription:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile, isSupported, showNotification, playSound]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
};

export default usePushNotifications;
