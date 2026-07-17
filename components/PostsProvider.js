'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
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
  updatePost: async () => ({ error: null }),
  deletePost: async () => ({ error: null }),
  uploadPostImage: async () => ({ error: null }),
  uploadVoiceNote: async () => ({ error: null }),
  refreshPosts: async () => {},
  fetchComments: async () => ({ error: null, comments: [] }),
  addComment: async () => ({ error: null }),
  deleteComment: async () => ({ error: null }),
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
  const { user, profile } = useAuth();
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
    const commentCounts = {};
    const likersByPost = {};

    if (ids.length > 0) {
      const { data: likeRows } = await supabase
        .from('post_likes')
        .select('post_id, user_id, created_at, profiles!post_likes_user_id_fkey(username, avatar, avatar_url)')
        .in('post_id', ids)
        .order('created_at', { ascending: false });

      (likeRows || []).forEach((l) => {
        likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
        if (user && l.user_id === user.id) likedByMe[l.post_id] = true;
        // Most-recent-first (query is ordered), capped to 4 — that's all the
        // avatar stack ever shows, so no point keeping more per post.
        if (!likersByPost[l.post_id]) likersByPost[l.post_id] = [];
        if (likersByPost[l.post_id].length < 4 && l.profiles) {
          likersByPost[l.post_id].push({
            uid: l.user_id,
            name: l.profiles.username || 'Mtumiaji',
            avatar: l.profiles.avatar || '🐧',
            avatarUrl: l.profiles.avatar_url || null,
          });
        }
      });

      const { data: commentRows } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', ids);

      (commentRows || []).forEach((c) => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
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
        likers: likersByPost[r.id] || [],
        comments: commentCounts[r.id] || 0,
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

  const uploadPostImage = useCallback(
    async (file) => {
      if (!user) return { error: new Error('Ingia kwanza kupakia picha.') };

      let compressed;
      try {
        compressed = await compressToWebp(file, {
          maxBytes: 50 * 1024,
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
    },
    [user]
  );

  const uploadVoiceNote = useCallback(
    async (blob) => {
      if (!user) return { error: new Error('Ingia kwanza kupakia ujumbe wa sauti.') };

      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(path, blob, {
          upsert: false,
          cacheControl: '3600',
          contentType: blob.type || 'audio/webm',
        });
      if (uploadError) return { error: uploadError };

      const { data } = supabase.storage.from('voice-notes').getPublicUrl(path);
      return { error: null, url: data.publicUrl };
    },
    [user]
  );

  const addPost = useCallback(
    async (draft) => {
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
    },
    [user, loadPosts]
  );

  const updatePost = useCallback(
    async (id, updates) => {
      if (typeof id !== 'string' || !user) return { error: new Error('Haiwezekani kuhariri hii.') };

      const payload = {};
      if (updates.text !== undefined) payload.text = updates.text;
      if (updates.tag !== undefined) payload.tag = updates.tag;

      const { error } = await supabase.from('posts').update(payload).eq('id', id).eq('user_id', user.id);
      if (error) return { error };

      setRealPosts((p) => p.map((post) => (post.id === id ? { ...post, ...updates } : post)));
      return { error: null };
    },
    [user]
  );

  const deletePost = useCallback(
    async (id) => {
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
    },
    [user, realPosts]
  );

  const fetchComments = useCallback(async (postId) => {
    const { data, error } = await supabase
      .from('comments')
      .select(
        'id, post_id, parent_id, user_id, text, audio_url, audio_duration, created_at, profiles!comments_user_id_fkey(username, avatar, avatar_url)'
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to load comments:', error.message);
      return { error, comments: [] };
    }

    const mapRow = (c) => ({
      id: c.id,
      uid: c.user_id,
      parentId: c.parent_id,
      text: c.text,
      audioUrl: c.audio_url || null,
      audioDuration: c.audio_duration || null,
      time: relativeTime(c.created_at),
      author: c.profiles
        ? {
            name: c.profiles.username || 'Mtumiaji',
            avatar: c.profiles.avatar || '🐧',
            avatarUrl: c.profiles.avatar_url || null,
          }
        : null,
      replies: [],
    });

    const byId = {};
    (data || []).forEach((c) => {
      byId[c.id] = mapRow(c);
    });

    const roots = [];
    (data || []).forEach((c) => {
      const node = byId[c.id];
      if (c.parent_id && byId[c.parent_id]) {
        byId[c.parent_id].replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return { error: null, comments: roots };
  }, []);

  const addComment = useCallback(
    async (postId, text, parentId = null, audio = null) => {
      if (!user) return { error: new Error('Ingia kwanza kutoa maoni.') };
      const trimmed = (text || '').trim();
      if (!trimmed && !audio) return { error: new Error('Andika maoni kwanza.') };

      const payload = {
        post_id: postId,
        user_id: user.id,
        text: trimmed || null,
        parent_id: parentId || null,
        audio_url: audio?.url || null,
        audio_duration: audio?.duration || null,
      };
      let { data, error } = await supabase.from('comments').insert(payload).select().single();

      if (error && (error.code === '23503' || /foreign key/i.test(error.message || ''))) {
        await ensureProfileRow(user);
        ({ data, error } = await supabase.from('comments').insert(payload).select().single());
      }

      if (error) {
        console.warn('Failed to add comment:', error.message);
        return { error };
      }

      setRealPosts((p) =>
        p.map((post) => (post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post))
      );

      const comment = {
        id: data.id,
        uid: user.id,
        parentId: data.parent_id,
        text: data.text,
        audioUrl: data.audio_url || null,
        audioDuration: data.audio_duration || null,
        time: relativeTime(data.created_at),
        author: {
          name: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Wewe',
          avatar: profile?.avatar || '🐧',
          avatarUrl: profile?.avatar_url || null,
        },
        replies: [],
      };

      return { error: null, comment };
    },
    [user, profile]
  );

  const deleteComment = useCallback(
    async (commentId, postId, removedCount = 1) => {
      if (!user) return { error: new Error('Haiwezekani kufuta hii.') };

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) return { error };

      setRealPosts((p) =>
        p.map((post) =>
          post.id === postId
            ? { ...post, comments: Math.max(0, (post.comments || 0) - removedCount) }
            : post
        )
      );

      return { error: null };
    },
    [user]
  );

  const toggleLike = useCallback(
    async (id) => {
      const wasLiked = !!likes[id];
      setLikes((l) => ({ ...l, [id]: !wasLiked }));

      if (!user) return;

      const action = wasLiked
        ? supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id)
        : supabase.from('post_likes').insert({ post_id: id, user_id: user.id });

      const { error } = await action;
      if (error) setLikes((l) => ({ ...l, [id]: wasLiked })); // revert on failure
    },
    [likes, user]
  );

  const value = useMemo(
    () => ({
      posts,
      loading,
      error,
      likes,
      toggleLike,
      addPost,
      updatePost,
      deletePost,
      uploadPostImage,
      uploadVoiceNote,
      refreshPosts: loadPosts,
      fetchComments,
      addComment,
      deleteComment,
    }),
    [
      posts,
      loading,
      error,
      likes,
      toggleLike,
      addPost,
      updatePost,
      deletePost,
      uploadPostImage,
      uploadVoiceNote,
      loadPosts,
      fetchComments,
      addComment,
      deleteComment,
    ]
  );

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  return useContext(PostsContext);
}
