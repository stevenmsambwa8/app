'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthProvider'

const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAllRead: async () => {},
  refresh: async () => {},
});

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    read: row.read,
    createdAt: row.created_at,
    postId: row.post_id,
    commentText: row.comment_text,
    actor: {
      id: row.actor_id,
      name: row.actor?.username || 'Mtumiaji',
      avatar: row.actor?.avatar || '🐧',
      avatarUrl: row.actor?.avatar_url || null,
    },
  };
}

export default function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, read, created_at, post_id, comment_text, actor_id, actor:profiles!notifications_actor_id_fkey(username, avatar, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setNotifications(data.map(mapRow));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: new notifications land instantly (bell badge + list)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const { data } = await supabase
            .from('profiles')
            .select('username, avatar, avatar_url')
            .eq('id', payload.new.actor_id)
            .maybeSingle();
          setNotifications((prev) => [mapRow({ ...payload.new, actor: data }), ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
  }, [user, notifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, markAllRead, refresh }),
    [notifications, unreadCount, loading, markAllRead, refresh]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
