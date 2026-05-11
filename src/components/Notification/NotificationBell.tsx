import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, Notification } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell, Check, CheckCheck, Trash2, Trophy, Users,
  AlertCircle, Loader2, X as XIcon, Megaphone,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const POLL_INTERVAL = 30_000; // 30 giây

const getNotificationIcon = (type: string) => {
  if (type.includes('registration') || type.includes('team')) return <Users className="w-4 h-4 text-blue-500" />;
  if (type.includes('tournament')) return <Trophy className="w-4 h-4 text-primary" />;
  if (type.includes('approve')) return <Check className="w-4 h-4 text-green-500" />;
  if (type.includes('reject')) return <XIcon className="w-4 h-4 text-red-500" />;
  if (type.includes('publish')) return <Megaphone className="w-4 h-4 text-orange-500" />;
  return <Bell className="w-4 h-4 text-muted-foreground" />;
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
      const unread = data.filter(n => !n.read_at).length;
      setUnreadCount(unread);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll unread count
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Fetch full list khi mở popover
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.read_at) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* silent */ }
    }

    // Navigate dựa theo loại thông báo
    const tournamentId = notification.data?.tournament_id;
    const bookingId = notification.data?.booking_id;
    const isBookingNotification =
      bookingId != null ||
      notification.type.toLowerCase().includes('book') ||
      notification.title.toLowerCase().includes('đặt sân') ||
      notification.title.toLowerCase().includes('booking') ||
      notification.message.toLowerCase().includes('đặt sân');

    if (isBookingNotification) {
      setOpen(false);
      // role_id: 1=Admin, 2=Owner, 3=Staff, 4=Member
      if (user?.role_id === 2) {
        navigate('/owner/bookings');
      } else if (user?.role_id === 3) {
        navigate('/staff/bookings');
      } else {
        navigate('/my-bookings');
      }
    } else if (tournamentId) {
      setOpen(false);
      navigate(`/tournament/${tournamentId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await notificationService.delete(id);
      const removed = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (removed && !removed.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { /* silent */ }
    setDeletingId(null);
  };

  const handleDeleteAllRead = async () => {
    try {
      await notificationService.deleteAllRead();
      setNotifications(prev => prev.filter(n => !n.read_at));
    } catch { /* silent */ }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Thông báo</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleMarkAllRead}>
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc hết
              </Button>
            )}
            {notifications.some(n => n.read_at) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={handleDeleteAllRead}>
                <Trash2 className="w-3.5 h-3.5" />
                Dọn
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Không có thông báo nào</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, idx) => (
                <div key={notification.id}>
                  <div
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.read_at ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!notification.read_at ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        {!notification.read_at && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, notification.id)}
                      disabled={deletingId === notification.id}
                    >
                      {deletingId === notification.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  {idx < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
