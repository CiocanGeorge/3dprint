import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const USERS_KEY   = 'ms_users';
const SESSION_KEY = 'ms_session';

const getUsers   = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; } };
const saveUsers  = u  => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
const saveSession = u => localStorage.setItem(SESSION_KEY, JSON.stringify(u));
const clearSession = () => localStorage.removeItem(SESSION_KEY);

function hash(pwd) {
  let h = 0;
  for (let i = 0; i < pwd.length; i++) h = Math.imul(31, h) + pwd.charCodeAt(i) | 0;
  return h.toString(36);
}
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function initials(name, email) {
  if (name?.trim()) return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (email || 'U')[0].toUpperCase();
}
function sanitize({ passwordHash, resetToken, resetExpiry, ...rest }) { return rest; }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (s) setUser(s);
    setLoading(false);
  }, []);

  const register = useCallback(async ({ email, password, name }) => {
    await wait(400);
    if (!name?.trim())       throw new Error('Numele este obligatoriu.');
    if (password.length < 6) throw new Error('Parola trebuie să aibă cel puțin 6 caractere.');
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error('Există deja un cont cu această adresă de email.');
    const nu = { id: uid(), email: email.toLowerCase().trim(), name: name.trim(),
      initials: initials(name, email), provider: 'email', createdAt: new Date().toISOString(),
      passwordHash: hash(password) };
    saveUsers([...users, nu]);
    const s = sanitize(nu); saveSession(s); setUser(s); return s;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    await wait(400);
    const found = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found || found.passwordHash !== hash(password))
      throw new Error('Email sau parolă incorectă.');
    const s = sanitize(found); saveSession(s); setUser(s); return s;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await wait(700);
    const mockEmail = 'demo.google@gmail.com';
    const mockName  = 'Demo Google';
    const users = getUsers();
    let found = users.find(u => u.email === mockEmail);
    if (!found) {
      found = { id: uid(), email: mockEmail, name: mockName,
        initials: initials(mockName, mockEmail), provider: 'google',
        createdAt: new Date().toISOString() };
      saveUsers([...users, found]);
    }
    const s = sanitize(found); saveSession(s); setUser(s); return s;
  }, []);

  const forgotPassword = useCallback(async ({ email }) => {
    await wait(500);
    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found) throw new Error('Nu există niciun cont cu această adresă.');
    const token = uid();
    saveUsers(users.map(u => u.id === found.id
      ? { ...u, resetToken: token, resetExpiry: Date.now() + 15 * 60 * 1000 } : u));
    console.info('[Mock] Token reset:', token);
    return true;
  }, []);

  const resetPassword = useCallback(async ({ token, password }) => {
    await wait(400);
    if (password.length < 6) throw new Error('Parola trebuie să aibă cel puțin 6 caractere.');
    const users = getUsers();
    const found = users.find(u => u.resetToken === token && u.resetExpiry > Date.now());
    if (!found) throw new Error('Link-ul a expirat sau este invalid.');
    saveUsers(users.map(u => u.id === found.id
      ? { ...u, passwordHash: hash(password), resetToken: null, resetExpiry: null } : u));
    return true;
  }, []);

  const updateProfile = useCallback(async ({ name, email }) => {
    await wait(300);
    if (!user) throw new Error('Nu ești autentificat.');
    const users = getUsers();
    if (email && email !== user.email && users.find(u => u.email === email && u.id !== user.id))
      throw new Error('Email-ul este deja folosit de alt cont.');
    const updated = users.map(u => u.id === user.id
      ? { ...u, name: name ?? u.name, email: email ?? u.email,
          initials: initials(name ?? u.name, email ?? u.email) } : u);
    saveUsers(updated);
    const s = sanitize(updated.find(u => u.id === user.id));
    saveSession(s); setUser(s); return s;
  }, [user]);

  const logout = useCallback(() => { clearSession(); setUser(null); }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: !!user,
      register, login, loginWithGoogle,
      forgotPassword, resetPassword, updateProfile, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth trebuie folosit în AuthProvider');
  return ctx;
}