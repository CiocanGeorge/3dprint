// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

function initials(name, email) {
  if (name?.trim())
    return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (email || 'U')[0].toUpperCase();
}

function buildUser(session) {
  if (!session?.user) return null;
  const { user } = session;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
  return {
    id: user.id,
    email: user.email,
    name,
    initials: initials(name, user.email),
    provider: user.app_metadata?.provider || 'email',
    createdAt: user.created_at,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(buildUser(session));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(buildUser(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async ({ email, password, name }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw new Error(error.message);
  };

  const login = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, register, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);