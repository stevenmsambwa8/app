'use client'
import { createContext, useContext, useState } from 'react'
import AuthModal from './AuthModal'

const AuthModalContext = createContext({
  openAuth: () => {},
  closeAuth: () => {},
});

export default function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('signin');

  function openAuth(initialMode = 'signin') {
    setMode(initialMode);
    setOpen(true);
  }
  function closeAuth() {
    setOpen(false);
  }

  return (
    <AuthModalContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      {open && <AuthModal mode={mode} setMode={setMode} onClose={closeAuth} />}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
