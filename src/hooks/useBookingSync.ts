import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook để đồng bộ booking updates giữa các tab/window
 * Sử dụng BroadcastChannel API (hỗ trợ trên hầu hết các browser hiện đại)
 * Fallback sang localStorage events nếu BroadcastChannel không được hỗ trợ
 */

export interface BookingUpdateMessage {
  type: 'booking_created' | 'booking_cancelled' | 'booking_updated';
  fieldId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  bookingId?: number;
  timestamp: number;
}

export const useBookingSync = (
  onBookingUpdate: (message: BookingUpdateMessage) => void
) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const storageHandlerRef = useRef<((e: StorageEvent) => void) | null>(null);

  // Broadcast một booking update tới các tab khác
  const broadcastBookingUpdate = useCallback((message: BookingUpdateMessage) => {
    message.timestamp = Date.now();

    // Thử dùng BroadcastChannel trước
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(message);
        console.log('Broadcast booking update via BroadcastChannel:', message);
      } catch (error) {
        console.error('Error broadcasting via BroadcastChannel:', error);
      }
    } else {
      // Fallback sang localStorage
      try {
        const storageKey = 'booking_update';
        const storageValue = JSON.stringify(message);
        localStorage.setItem(storageKey, storageValue);
        // Clear ngay sau đó để trigger event
        setTimeout(() => localStorage.removeItem(storageKey), 100);
        console.log('Broadcast booking update via localStorage:', message);
      } catch (error) {
        console.error('Error broadcasting via localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Kiểm tra BroadcastChannel support
    const supportsBroadcastChannel = 'BroadcastChannel' in window;

    if (supportsBroadcastChannel) {
      // Sử dụng BroadcastChannel
      try {
        const channel = new BroadcastChannel('booking_updates');
        channelRef.current = channel;

        channel.onmessage = (event: MessageEvent<BookingUpdateMessage>) => {
          console.log('Received booking update via BroadcastChannel:', event.data);
          onBookingUpdate(event.data);
        };

        channel.onmessageerror = (error) => {
          console.error('BroadcastChannel message error:', error);
        };

        console.log('BroadcastChannel initialized');
      } catch (error) {
        console.error('Error initializing BroadcastChannel:', error);
      }
    } else {
      // Fallback sang localStorage events
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'booking_update' && e.newValue) {
          try {
            const message: BookingUpdateMessage = JSON.parse(e.newValue);
            console.log('Received booking update via localStorage:', message);
            onBookingUpdate(message);
          } catch (error) {
            console.error('Error parsing booking update from localStorage:', error);
          }
        }
      };

      storageHandlerRef.current = handleStorageChange;
      window.addEventListener('storage', handleStorageChange);
      console.log('localStorage event listener initialized');
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
        console.log('BroadcastChannel closed');
      }

      if (storageHandlerRef.current) {
        window.removeEventListener('storage', storageHandlerRef.current);
        storageHandlerRef.current = null;
        console.log('localStorage event listener removed');
      }
    };
  }, [onBookingUpdate]);

  return { broadcastBookingUpdate };
};
