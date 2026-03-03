import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPage.module.css';

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Parolele nu coincid.'); return; }
    setLoading(true);
    try {
      await register({ email, password, name });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setGLoading(true);
    try { await loginWithGoogle(); navigate('/'); }
    catch (err) { setError(err.message); }
    finally { setGLoading(false); }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Slabă', 'Medie', 'Puternică'];
  const strengthColor = ['', '#e05555', '#f0a500', '#22c55e'];

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>M</span>
          <div>
            <div className={styles.logoTitle}>Monogram Studio</div>
            <div className={styles.logoSub}>Creează cont</div>
          </div>
        </div>

        {error && <div className={styles.alert}><AlertIcon />{error}</div>}

        <button className={styles.googleBtn} onClick={handleGoogle} disabled={gLoading}>
          {gLoading ? <Spinner /> : <><GoogleIcon />Continuă cu Google</>}
        </button>

        <div className={styles.divider}><span>sau</span></div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nume complet</label>
            <input className={styles.input} type="text" value={name}
              onChange={e => setName(e.target.value)} placeholder="Ion Popescu"
              autoComplete="name" required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="email@exemplu.com"
              autoComplete="email" required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Parolă</label>
            <div className={styles.inputWrap}>
              <input className={styles.input} type={showPwd ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Minim 6 caractere" autoComplete="new-password" required />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(s => !s)}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {password.length > 0 && (
              <div className={styles.strengthBar}>
                {[1,2,3].map(i => (
                  <div key={i} className={styles.strengthSegment}
                    style={{ background: i <= strength ? strengthColor[strength] : 'var(--border)' }} />
                ))}
                <span style={{ color: strengthColor[strength], fontSize: 10 }}>{strengthLabel[strength]}</span>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirmă parola</label>
            <input className={styles.input}
              type={showPwd ? 'text' : 'password'}
              value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repetă parola" autoComplete="new-password" required />
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? <Spinner light /> : 'Creează cont'}
          </button>
        </form>

        <p className={styles.switchText}>
          Ai deja cont?{' '}
          <Link to="/login" className={styles.switchLink}>Intră în cont</Link>
        </p>
      </div>
    </div>
  );
}

const AlertIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const GoogleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
const Spinner = ({ light }) => <svg style={{animation:'spin 0.8s linear infinite'}} width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'} strokeWidth="2"/><path d="M12 2a10 10 0 0 1 10 10" stroke={light ? '#fff' : '#5c6ac4'} strokeWidth="2" strokeLinecap="round"/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>;