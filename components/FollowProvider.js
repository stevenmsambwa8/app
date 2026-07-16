'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthProvider'

const FollowContext = createContext({
  followingIds: new Set(),
  isFollowing: () => false,
  toggleFollow: async () => ({ error: null }),
  pending: {},
  getCounts: async () => ({ followers: 0, following: 0 }),
  countsCache: {},
  fetchFollowers: async () => [],
  fetchFollowing: async () => [],
});

function mapProfileRow(id, p) {
  return {
    id,
    name: p?.username || 'Mtumiaji',
    handle: `@${p?.username || 'mtumiaji'}`,
    avatar: p?.avatar || '🐧',
    avatarUrl: p?.avatar_url || null,
  };
}

export default function FollowProvider({ children }) {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState(new Set());
  const [pending, setPending] = useState({}); // { [uid]: true } while a toggle is in flight
  const [countsCache, setCountsCache] = useState({}); // { [uid]: { followers, following } }

  // Load the current user's full following list once on login so isFollowing()
  // is instant everywhere (post cards, comments, people list) without N queries.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setFollowingIds(new Set());
      return;
    }
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setFollowingIds(new Set((data || []).map((r) => r.following_id)));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isFollowing = useCallback((uid) => followingIds.has(uid), [followingIds]);

  const toggleFollow = useCallback(
    async (uid) => {
      if (!user) return { error: new Error('Ingia kwanza kufuata.') };
      if (uid === user.id) return { error: new Error('Huwezi kujifuata mwenyewe.') };

      const wasFollowing = followingIds.has(uid);
      setPending((p) => ({ ...p, [uid]: true }));

      // Optimistic update
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.delete(uid);
        else next.add(uid);
        return next;
      });
      setCountsCache((prev) => {
        const cur = prev[uid] || { followers: 0, following: 0 };
        return {
          ...prev,
          [uid]: { ...cur, followers: Math.max(0, cur.followers + (wasFollowing ? -1 : 1)) },
        };
      });

      const action = wasFollowing
        ? supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', uid)
        : supabase.from('follows').insert({ follower_id: user.id, following_id: uid });

      const { error } = await action;

      setPending((p) => {
        const next = { ...p };
        delete next[uid];
        return next;
      });

      if (error) {
        // revert on failure
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (wasFollowing) next.add(uid);
          else next.delete(uid);
          return next;
        });
        setCountsCache((prev) => {
          const cur = prev[uid] || { followers: 0, following: 0 };
          return {
            ...prev,
            [uid]: { ...cur, followers: Math.max(0, cur.followers + (wasFollowing ? 1 : -1)) },
          };
        });
        return { error };
      }

      return { error: null };
    },
    [user, followingIds]
  );

  const getCounts = useCallback(async (uid) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', uid),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', uid),
    ]);
    const result = { followers: followers || 0, following: following || 0 };
    setCountsCache((prev) => ({ ...prev, [uid]: result }));
    return result;
  }, []);

  const fetchFollowers = useCallback(async (uid) => {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(username, avatar, avatar_url)')
      .eq('following_id', uid)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((r) => mapProfileRow(r.follower_id, r.profiles));
  }, []);

  const fetchFollowing = useCallback(async (uid) => {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(username, avatar, avatar_url)')
      .eq('follower_id', uid)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((r) => mapProfileRow(r.following_id, r.profiles));
  }, []);

  const value = useMemo(
    () => ({
      followingIds,
      isFollowing,
      toggleFollow,
      pending,
      getCounts,
      countsCache,
      fetchFollowers,
      fetchFollowing,
    }),
    [followingIds, isFollowing, toggleFollow, pending, getCounts, countsCache, fetchFollowers, fetchFollowing]
  );

  return <FollowContext.Provider value={value}>{children}</FollowContext.Provider>;
}

export function useFollow() {
  return useContext(FollowContext);
}
