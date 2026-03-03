import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName]       = useState(user?.name || '');
  const [email, setEmail]     = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(false); setLoading(true);
    try {
      await updateProfile({ name, email });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Înapoi
        </button>
        <span className={styles.navTitle}>Profilul meu</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>Deconectare</button>
      </nav>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>{user?.initials}</div>
            <div>
              <div className={styles.avatarName}>{user?.name}</div>
              <div className={styles.avatarMeta}>
                {user?.provider === 'google' ? '🔗 Cont Google' : '📧 Cont Email'} · Membru din {new Date(user?.createdAt).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {error   && <div className={styles.alert}>{error}</div>}
          {success && <div className={styles.success}>✓ Profilul a fost actualizat</div>}

          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Nume complet</label>
              <input className={styles.input} type="text" value={name}
                onChange={e => setName(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={user?.provider === 'google'} required />
              {user?.provider === 'google' && (
                <span className={styles.fieldNote}>Email-ul contului Google nu poate fi modificat</span>
              )}
            </div>
            <button className={styles.saveBtn} type="submit" disabled={loading}>
              {loading ? 'Se salvează...' : 'Salvează modificările'}
            </button>
          </form>
        </div>

        <div className={styles.dangerCard}>
          <h3 className={styles.dangerTitle}>Zona periculoasă</h3>
          <button className={styles.logoutBtnFull} onClick={handleLogout}>
            Deconectare din cont
          </button>
        </div>
      </div>
    </div>
  );
}