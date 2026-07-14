'use client'
import { createContext, useContext, useState } from 'react'
import PostViewer from './PostViewer'

const PostViewerContext = createContext({
  openPost: () => {},
  closePost: () => {},
});

export default function PostViewerProvider({ children }) {
  const [post, setPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [onLike, setOnLike] = useState(null);

  function openPost(post, { liked, likeCount, onLike } = {}) {
    setPost(post);
    setLiked(!!liked);
    setLikeCount(likeCount ?? post.likes ?? 0);
    setOnLike(() => onLike || (() => {}));
  }
  function closePost() {
    setPost(null);
  }

  return (
    <PostViewerContext.Provider value={{ openPost, closePost }}>
      {children}
      {post && (
        <PostViewer
          post={post}
          liked={liked}
          likeCount={likeCount}
          onLike={onLike}
          onClose={closePost}
        />
      )}
    </PostViewerContext.Provider>
  );
}

export function usePostViewer() {
  return useContext(PostViewerContext);
}
