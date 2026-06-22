import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';
import '../styles/LoginPage.css';

const ROLES: { key: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    key: 'gerencia',
    label: 'Gerencia',
    desc: 'Aprobación',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'tecnologia',
    label: 'Tecnología',
    desc: 'Consulta y registro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [role, setRole] = useState<UserRole>('gerencia');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim()) { setError('Ingresa la contraseña.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await signIn(role, pwd);
    setLoading(false);
    if (err) {
      setError(err.message || 'Error al ingresar.');
      setShakeKey(k => k + 1);
      setPwd('');
    }
  };

  return (
    <div className="lp-login-wrap">
      {/* Fondo igual al landing */}
      <div className="lp-login-bg" aria-hidden="true">
        <div className="lp-login-blob lp-login-blob-1" />
        <div className="lp-login-blob lp-login-blob-2" />
        <div className="lp-login-grid" />
      </div>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease }}
      >
        {/* Logo */}
        <motion.div
          className="login-logo"
          initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
        >
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" width="32" height="32">
            <rect x="3" y="7" width="42" height="28" rx="5" />
            <path d="M15 43h18M24 35v8" />
            <path d="M12 19l6 5-6 5" />
            <path d="M23 24h13" />
          </svg>
        </motion.div>

        <motion.h1
          className="login-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55, ease }}
        >
          Viabilidad Tecnológica
        </motion.h1>
        <motion.p
          className="login-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Selecciona tu área e ingresa tu contraseña.
        </motion.p>

        <form onSubmit={e => void handleSubmit(e)} noValidate>
          {/* Selector de rol */}
          <motion.div
            className="role-selector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease }}
            role="group"
            aria-label="Área de acceso"
          >
            {ROLES.map(r => (
              <motion.button
                key={r.key}
                type="button"
                className={`role-btn${role === r.key ? ' active' : ''}`}
                onClick={() => { setRole(r.key); setError(''); setPwd(''); }}
                aria-pressed={role === r.key}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {role === r.key && (
                  <motion.div
                    className="role-active-bg"
                    layoutId="role-active"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="role-icon">{r.icon}</span>
                <span className="role-label">{r.label}</span>
                <span className="role-desc">{r.desc}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Campo contraseña */}
          <motion.div
            className="login-field"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease }}
          >
            <label htmlFor="lp-pwd">Contraseña</label>
            <motion.div
              className="login-input-wrap"
              key={shakeKey}
              animate={shakeKey > 0 ? { x: [0, -9, 9, -7, 7, -4, 4, 0] } : {}}
              transition={{ duration: 0.45 }}
            >
              <input
                id="lp-pwd"
                className={`login-input${error ? ' has-error' : ''}`}
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••••"
                value={pwd}
                onChange={e => { setPwd(e.target.value); setError(''); }}
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPwd ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p
                  className="login-error"
                  role="alert"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button
            className="login-btn"
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45, ease }}
            whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(37,99,168,.45)' }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="login-spinner" aria-hidden="true" />
            ) : (
              `Ingresar como ${ROLES.find(r => r.key === role)?.label}`
            )}
          </motion.button>
        </form>

        <motion.p
          className="login-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Sistema interno · Uso corporativo exclusivo
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
