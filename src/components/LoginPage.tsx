import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';
import '../styles/LoginPage.css';

const ROLE_META: Record<UserRole, { label: string; desc: string; icon: React.ReactNode }> = {
  gerencia: {
    label: 'Gerencia',
    desc: 'Aprobación',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  tecnologia: {
    label: 'Tecnología',
    desc: 'Consulta',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
};

const LoginPage: React.FC = () => {
  const { signIn, signOut, user, role } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('gerencia');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Usuario autenticado pero sin perfil asignado
  if (user && role === null) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <h1 className="login-title">Acceso no configurado</h1>
          <div className="login-no-access">
            <p>
              La cuenta <strong>{user.email}</strong> no tiene un perfil asignado.
              Contacta al administrador del sistema.
            </p>
            <button className="login-btn" style={{ marginTop: 8 }} onClick={() => void signOut()}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setErrorMsg('Ingresa la contraseña.'); return; }
    setErrorMsg('');
    setLoading(true);
    const { error } = await signIn(selectedRole, password);
    setLoading(false);
    if (error) {
      const msg = error.message ?? '';
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed') || msg.includes('NetworkError')) {
        setErrorMsg('Sin conexión con el servidor. Verifica las credenciales de Supabase.');
      } else if (msg.includes('Invalid login') || msg.includes('invalid') || msg.includes('credentials')) {
        setErrorMsg('Contraseña incorrecta. Intenta de nuevo.');
      } else {
        setErrorMsg(`Error: ${msg || 'Intenta de nuevo.'}`);
      }
      setPassword('');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
        </div>

        <h1 className="login-title">Viabilidad Tecnológica</h1>
        <p className="login-subtitle">Selecciona tu área e ingresa tu contraseña.</p>

        <form onSubmit={e => void handleSubmit(e)} noValidate>
          {/* Selector de rol */}
          <div className="role-selector" role="group" aria-label="Área de acceso">
            {(Object.keys(ROLE_META) as UserRole[]).map(r => (
              <button
                key={r}
                type="button"
                className={`role-btn${selectedRole === r ? ' active' : ''}`}
                onClick={() => { setSelectedRole(r); setErrorMsg(''); setPassword(''); }}
                aria-pressed={selectedRole === r}
              >
                <span className="role-icon">{ROLE_META[r].icon}</span>
                <span className="role-label">{ROLE_META[r].label}</span>
                <span className="role-desc">{ROLE_META[r].desc}</span>
              </button>
            ))}
          </div>

          {/* Contraseña */}
          <div className="login-field">
            <label htmlFor="lp-pwd">Contraseña</label>
            <div className="login-input-wrap">
              <input
                id="lp-pwd"
                className={`login-input${errorMsg ? ' has-error' : ''}`}
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
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
            </div>
            {errorMsg && (
              <p className="login-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errorMsg}
              </p>
            )}
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Verificando…' : `Ingresar como ${ROLE_META[selectedRole].label}`}
          </button>
        </form>

        <p className="login-footer">Sistema interno · Uso corporativo exclusivo</p>
      </div>
    </div>
  );
};

export default LoginPage;
