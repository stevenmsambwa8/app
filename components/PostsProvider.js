'use client'
import { createContext, useContext, useState } from 'react'
import { POSTS as SEED_POSTS } from '../lib/mockData'

const PostsContext = createContext({
  posts: SEED_POSTS,
  addPost: () => {},
});

let nextId = Math.max(...SEED_POSTS.map((p) => p.id)) + 1;

export default function PostsProvider({ children }) {
  const [posts, setPosts] = useState(SEED_POSTS);

  function addPost(draft) {
    const post = {
      id: nextId++,
      uid: 0,
      kind: 'post',
      time: 'sasa hivi',
      likes: 0,
      comments: 0,
      ...draft,
    };
    setPosts((p) => [post, ...p]);
    return post;
  }

  return (
    <PostsContext.Provider value={{ posts, addPost }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
