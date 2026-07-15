'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { compressToWebp } from '../lib/compressImage'
import { useAuth } from './AuthProvider'

const PostsContext = createContext({
  posts: [],
  loading: true,
  error: '',
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

// Ensures a profiles row exists for this user before we try to insert a post
// that has a foreign key pointing at it (posts.user_id -> profiles.id).
// Cheap no-op if the row is already there.
async function ensureProfileRow(authUser) {
  if (!authUser) return;
  const { data } = await supabase.from('profiles').select('id').eq('id', authUser.id).maybeSingle();
  if (data) return;

  const fallbackUsername =
    authUser.user_metadata?.username ||
    authUser.email?.split('@')[0] ||
    `user_${authUser.id.slice(0, 6)}`;

  await supabase.from('profiles').upsert({ id: authUser.id, username: fallbackUsername }, { onConflict: 'id' });
}

export default function PostsProvider({ children }) {
  const { user } = useAuth();
  const [realPosts, setRealPosts] = useState([]);
  const [likes, setLikes] = useState({}); // { [postId]: liked-by-me }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    setError('');
    const { data: rows, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id, text, tag, images, cta, created_at, profiles!posts_user_id_fkey(username, avatar, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.warn('Failed to load posts:', fetchError.message);
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    if (!rows) {
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
        // it back in, same display convention used everywhere else.
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

  const posts = realPosts;

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

    const payload = {
      user_id: user.id,
      text: draft.text,
      tag: draft.tag,
      images: draft.images && draft.images.length ? draft.images : [],
      cta: draft.cta || null,
    };

    let { error } = await supabase.from('posts').insert(payload);

    // Most common real-world failure: the profiles row (posts.user_id's FK
    // target) doesn't exist yet — self-heal it and retry once.
    if (error && (error.code === '23503' || /foreign key/i.test(error.message || ''))) {
      await ensureProfileRow(user);
      ({ error } = await supabase.from('posts').insert(payload));
    }

    if (error) {
      console.warn('Failed to create post:', error.message);
      return { error };
    }

    await loadPosts();
    return { error: null };
  }

  async function deletePost(id) {
    if (typeof id !== 'string' || !user) return { error: new Error('Haiwezekani kufuta hii.') };

    const target = realPosts.find((p) => p.id === id);

    const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id);
    if (error) return { error };

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
    const wasLiked = !!likes[id];
    setLikes((l) => ({ ...l, [id]: !wasLiked }));

    if (!user) return;

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
        error,
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
