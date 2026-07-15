'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { compressToWebp } from '../lib/compressImage'
import { useAuth } from './AuthProvider'
import { POSTS as SEED_POSTS } from '../lib/mockData'

const PostsContext = createContext({
  posts: SEED_POSTS,
  loading: true,
  likes: {},
  toggleLike: () => {},
  addPost: async () => ({ error: null }),
  deletePost: async () => ({ error: null }),
  uploadPostImage: async () => ({ error: null }),
  refreshPosts: async () => {},
});

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'sasa hivi';
  if (mins < 60) return `dakika ${mins}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `saa ${hrs}`;
  const days = Math.floor(hrs / 24);
  return `siku ${days}`;
}

// Extracts the storage object path from a public URL, e.g.
// https://.../storage/v1/object/public/post-images/<uid>/<file>.webp -> <uid>/<file>.webp
function pathFromPublicUrl(url, bucket) {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export default function PostsProvider({ children }) {
  const { user } = useAuth();
  const [realPosts, setRealPosts] = useState([]);
  const [likes, setLikes] = useState({}); // { [postId]: liked-by-me } — shared by real & mock posts
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from('posts')
      .select('id, user_id, text, tag, images, cta, created_at, profiles(username, avatar, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !rows) {
      setLoading(false);
      return;
    }

    const ids = rows.map((r) => r.id);
    const likeCounts = {};
    const likedByMe = {};

    if (ids.length > 0) {
      const { data: likeRows } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', ids);

      (likeRows || []).forEach((l) => {
        likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
        if (user && l.user_id === user.id) likedByMe[l.post_id] = true;
      });
    }

    const mapped = rows.map((r) => {
      const total = likeCounts[r.id] || 0;
      const myLike = !!likedByMe[r.id];
      const hasImages = r.images && r.images.length > 0;
      return {
        id: r.id,
        uid: r.user_id,
        kind: 'post',
        text: r.text,
        tag: r.tag,
        images: hasImages ? r.images : undefined,
        gradient: hasImages ? undefined : null,
        cta: r.cta || undefined,
        // base count excludes my own like — the shared `likes[id]` toggle adds
        // it back, same convention the mock feed already uses everywhere.
        likes: total - (myLike ? 1 : 0),
        comments: 0,
        time: relativeTime(r.created_at),
        author: r.profiles
          ? {
              name: r.profiles.username || 'Mtumiaji',
              handle: `@${r.profiles.username || 'mtumiaji'}`,
              avatar: r.profiles.avatar || '🐧',
              avatarUrl: r.profiles.avatar_url || null,
              badge: null,
            }
          : null,
      };
    });

    setRealPosts(mapped);
    setLikes((prev) => ({ ...prev, ...likedByMe }));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const posts = [...realPosts, ...SEED_POSTS];

  async function uploadPostImage(file) {
    if (!user) return { error: new Error('Ingia kwanza kupakia picha.') };

    let compressed;
    try {
      compressed = await compressToWebp(file, {
        maxBytes: 20 * 1024,
        startDimension: 720,
        minDimension: 240,
      });
    } catch (compressError) {
      return { error: compressError };
    }

    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, compressed, {
        upsert: false,
        cacheControl: '3600',
        contentType: 'image/webp',
      });
    if (uploadError) return { error: uploadError };

    const { data } = supabase.storage.from('post-images').getPublicUrl(path);
    return { error: null, url: data.publicUrl };
  }

  async function addPost(draft) {
    if (!user) return { error: new Error('Ingia kwanza kuchapisha.') };

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      text: draft.text,
      tag: draft.tag,
      images: draft.images && draft.images.length ? draft.images : [],
      cta: draft.cta || null,
    });
    if (error) return { error };

    await loadPosts();
    return { error: null };
  }

  async function deletePost(id) {
    if (typeof id !== 'string' || !user) return { error: new Error('Haiwezekani kufuta hii.') };

    const target = realPosts.find((p) => p.id === id);

    const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id);
    if (error) return { error };

    // Best-effort: clean up this post's uploaded images too.
    if (target?.images?.length) {
      const paths = target.images
        .map((url) => pathFromPublicUrl(url, 'post-images'))
        .filter(Boolean);
      if (paths.length) {
        supabase.storage.from('post-images').remove(paths).catch(() => {});
      }
    }

    setRealPosts((p) => p.filter((post) => post.id !== id));
    return { error: null };
  }

  async function toggleLike(id) {
    const isReal = typeof id === 'string';
    const wasLiked = !!likes[id];
    setLikes((l) => ({ ...l, [id]: !wasLiked }));

    if (!isReal || !user) return; // mock posts: local-only toggle, same as before

    const action = wasLiked
      ? supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id)
      : supabase.from('post_likes').insert({ post_id: id, user_id: user.id });

    const { error } = await action;
    if (error) setLikes((l) => ({ ...l, [id]: wasLiked })); // revert on failure
  }

  return (
    <PostsContext.Provider
      value={{
        posts,
        loading,
        likes,
        toggleLike,
        addPost,
        deletePost,
        uploadPostImage,
        refreshPosts: loadPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
