import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPage.module.css';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>M</span>
          <div>
            <div className={styles.logoTitle}>Monogram Studio</div>
            <div className={styles.logoSub}>Resetează parola</div>
          </div>
        </div>

        {sent ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <p>Dacă adresa există, vei primi un email cu instrucțiuni.</p>
            <p style={{fontSize:11, color:'var(--text-muted)', marginTop:8}}>
              (Mock: tokenul e în consolă — F12 → Console)
            </p>
            <Link to="/login" className={styles.submitBtn} style={{display:'block', textAlign:'center', marginTop:16, textDecoration:'none'}}>
              Înapoi la login
            </Link>
          </div>
        ) : (
          <>
            {error && <div className={styles.alert}><AlertIcon />{error}</div>}
            <p className={styles.forgotDesc}>
              Introdu adresa de email și îți trimitem un link de resetare.
            </p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemplu.com" autoComplete="email" required />
              </div>
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? <Spinner light /> : 'Trimite link de resetare'}
              </button>
            </form>
            <p className={styles.switchText}>
              <Link to="/login" className={styles.switchLink}>← Înapoi la login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const AlertIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const Spinner = ({ light }) => <svg style={{animation:'spin 0.8s linear infinite'}} width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'} strokeWidth="2"/><path d="M12 2a10 10 0 0 1 10 10" stroke={light ? '#fff' : '#5c6ac4'} strokeWidth="2" strokeLinecap="round"/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>;