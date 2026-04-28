import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook tổng quát để đồng bộ real-time giữa các tab/window
 * Sử dụng BroadcastChannel API (hỗ trợ hầu hết browser hiện đại)
 * Fallback sang localStorage events nếu BroadcastChannel không được hỗ trợ
 * 
 * @example
 * // Lắng nghe updates
 * useRealtimeSync((message) => {
 *   if (message.type === 'booking_created') {
 *     reloadBookings();
 *   }
 * });
 * 
 * // Gửi update
 * const { broadcast } = useRealtimeSync(handleUpdate);
 * broadcast({
 *   type: 'booking_created',
 *   entityId: 123,
 *   entityType: 'booking',
 *   data: { fieldId: 5 }
 * });
 */

// ===== TYPE DEFINITIONS =====

export type SyncEventType = 
  // Booking events
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_updated'
  | 'booking_confirmed'
  
  // Payment events
  | 'payment_uploaded'
  | 'payment_confirmed'
  | 'payment_rejected'
  
  // Tournament events
  | 'tournament_registered'
  | 'tournament_updated'
  | 'tournament_published'
  
  // Match events
  | 'match_score_updated'
  | 'match_schedule_updated'
  
  // Field events
  | 'field_status_changed'
  | 'field_price_updated';

export interface SyncMessage {
  type: SyncEventType;
  entityId: number;              // ID của entity chính (booking_id, tournament_id, field_id...)
  entityType: string;            // 'booking' | 'tournament' | 'field' | 'payment' | 'match'
  relatedIds?: {                 // IDs liên quan để filter chính xác
    fieldId?: number;
    tournamentId?: number;
    userId?: number;
    bookingDate?: string;
  };
  data?: any;                    // Dữ liệu bổ sung
  timestamp: number;
  tabId?: string;                // ID của tab gửi message (để tránh self-trigger)
}

// ===== HOOK IMPLEMENTATION =====

export const useRealtimeSync = (
  onMessage?: (message: SyncMessage) => void,
  options?: {
    channel?: string;            // Tên channel (mặc định: 'app_sync')
    filter?: (message: SyncMessage) => boolean;  // Filter messages
  }
) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const storageHandlerRef = useRef<((e: StorageEvent) => void) | null>(null);
  const tabIdRef = useRef<string>(generateTabId());

  // Generate unique tab ID
  function generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Broadcast message tới các tab khác
  const broadcast = useCallback((message: Omit<SyncMessage, 'timestamp' | 'tabId'>) => {
    const fullMessage: SyncMessage = {
      ...message,
      timestamp: Date.now(),
      tabId: tabIdRef.current,
    };

    // Thử dùng BroadcastChannel trước
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(fullMessage);
        console.log(`📡 [Broadcast via BroadcastChannel] ${fullMessage.type}:`, fullMessage);
      } catch (error) {
        console.error('❌ Error broadcasting via BroadcastChannel:', error);
      }
    } else {
      // Fallback sang localStorage
      try {
        const storageKey = options?.channel || 'app_sync';
        const storageValue = JSON.stringify(fullMessage);
        localStorage.setItem(storageKey, storageValue);
        // Clear ngay sau đó để trigger event
        setTimeout(() => localStorage.removeItem(storageKey), 100);
        console.log(`📡 [Broadcast via localStorage] ${fullMessage.type}:`, fullMessage);
      } catch (error) {
        console.error('❌ Error broadcasting via localStorage:', error);
      }
    }
  }, [options?.channel]);

  useEffect(() => {
    const channelName = options?.channel || 'app_sync';
    const supportsBroadcastChannel = 'BroadcastChannel' in window;

    if (supportsBroadcastChannel) {
      // ===== BROADCAST CHANNEL MODE =====
      try {
        const channel = new BroadcastChannel(channelName);
        channelRef.current = channel;

        channel.onmessage = (event: MessageEvent<SyncMessage>) => {
          const message = event.data;
          
          // Bỏ qua message từ chính tab này
          if (message.tabId === tabIdRef.current) {
            return;
          }

          console.log(`📥 [Received via BroadcastChannel] ${message.type}:`, message);

          // Apply filter nếu có
          if (options?.filter && !options.filter(message)) {
            console.log('⏭️ Message filtered out');
            return;
          }

          // Trigger callback
          if (onMessage) {
            onMessage(message);
          }
        };

        channel.onmessageerror = (error) => {
          console.error('❌ BroadcastChannel message error:', error);
        };

        console.log(`✅ BroadcastChannel initialized: ${channelName}`);
      } catch (error) {
        console.error('❌ Error initializing BroadcastChannel:', error);
      }
    } else {
      // ===== LOCALSTORAGE FALLBACK MODE =====
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === channelName && e.newValue) {
          try {
            const message: SyncMessage = JSON.parse(e.newValue);
            
            // Bỏ qua message từ chính tab này
            if (message.tabId === tabIdRef.current) {
              return;
            }

            console.log(`📥 [Received via localStorage] ${message.type}:`, message);

            // Apply filter nếu có
            if (options?.filter && !options.filter(message)) {
              console.log('⏭️ Message filtered out');
              return;
            }

            // Trigger callback
            if (onMessage) {
              onMessage(message);
            }
          } catch (error) {
            console.error('❌ Error parsing message from localStorage:', error);
          }
        }
      };

      storageHandlerRef.current = handleStorageChange;
      window.addEventListener('storage', handleStorageChange);
      console.log(`✅ localStorage event listener initialized: ${channelName}`);
    }

    // ===== CLEANUP =====
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
        console.log(`🔌 BroadcastChannel closed: ${channelName}`);
      }

      if (storageHandlerRef.current) {
        window.removeEventListener('storage', storageHandlerRef.current);
        storageHandlerRef.current = null;
        console.log(`🔌 localStorage event listener removed: ${channelName}`);
      }
    };
  }, [onMessage, options?.channel, options?.filter]);

  return { 
    broadcast,
    tabId: tabIdRef.current 
  };
};

// ===== UTILITY HOOKS =====

/**
 * Hook chuyên cho Booking sync
 */
export const useBookingRealtimeSync = (
  onBookingUpdate: (message: SyncMessage) => void,
  fieldId?: number
) => {
  return useRealtimeSync(onBookingUpdate, {
    channel: 'app_sync',
    filter: (msg) => {
      // Chỉ nhận booking events
      const isBookingEvent = msg.type.startsWith('booking_');
      if (!isBookingEvent) return false;

      // Nếu có fieldId, chỉ nhận messages liên quan đến field đó
      if (fieldId && msg.relatedIds?.fieldId !== fieldId) return false;

      return true;
    }
  });
};

/**
 * Hook chuyên cho Tournament sync
 */
export const useTournamentRealtimeSync = (
  onTournamentUpdate: (message: SyncMessage) => void,
  tournamentId?: number
) => {
  return useRealtimeSync(onTournamentUpdate, {
    channel: 'app_sync',
    filter: (msg) => {
      // Nhận tournament events và payment events
      const isTournamentEvent = msg.type.startsWith('tournament_') || msg.type.startsWith('payment_');
      if (!isTournamentEvent) return false;

      // Nếu có tournamentId, chỉ nhận messages liên quan đến tournament đó
      if (tournamentId && msg.relatedIds?.tournamentId !== tournamentId) return false;

      return true;
    }
  });
};

/**
 * Hook chuyên cho Match sync
 */
export const useMatchRealtimeSync = (
  onMatchUpdate: (message: SyncMessage) => void,
  tournamentId?: number
) => {
  return useRealtimeSync(onMatchUpdate, {
    channel: 'app_sync',
    filter: (msg) => {
      const isMatchEvent = msg.type.startsWith('match_');
      if (!isMatchEvent) return false;

      if (tournamentId && msg.relatedIds?.tournamentId !== tournamentId) return false;

      return true;
    }
  });
};
