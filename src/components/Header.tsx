import React, { useState } from 'react';
import type { ReportStatus } from '../types';
import '../styles/Header.css';

interface HeaderProps {
  reportStatus: ReportStatus;
  reportDate: string;
  userEmail?: string;
  userRole?: string;
  onSignOut?: () => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

const statusConfig: Record<ReportStatus, { label: string; className: string }> = {
  'Pendiente de revisión': { label: 'Pendiente de revisión', className: 'status-pending' },
  'Aprobado parcialmente':  { label: 'Aprobado parcialmente', className: 'status-partial' },
  Aprobado:                 { label: 'Aprobado', className: 'status-approved' },
  Negado:                   { label: 'Negado', className: 'status-denied' },
};

const Header: React.FC<HeaderProps> = ({ reportStatus, reportDate, userEmail, userRole, onSignOut, darkMode, onToggleDark }) => {
  const { label, className } = statusConfig[reportStatus];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <header className={`app-header${collapsed ? ' app-header--collapsed' : ''}`}>
      <div className="header-brand">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <div className="header-titles">
          <h1 className="header-main-title">Solicitud de Viabilidad Tecnológica</h1>
          {!collapsed && (
            <p className="header-subtitle">
              Sugerido de adquisición basado en necesidades levantadas por las áreas
            </p>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="header-meta">
          <div className="header-meta-item">
            <span className="meta-label">Presentado por</span>
            <span className="meta-value">Departamento de Tecnología de la Información</span>
          </div>
          <div className="header-meta-item">
            <span className="meta-label">Fecha del informe</span>
            <span className="meta-value">{reportDate}</span>
          </div>
          <div className="header-meta-item">
            <span className="meta-label">Estado del informe</span>
            <span className={`report-status-badge ${className}`}>{label}</span>
          </div>
          {userEmail && (
            <div className="header-meta-item header-user">
              <span className="meta-label">
                {userRole === 'gerencia' ? 'Gerencia' : 'Tecnología'}
              </span>
              <span className="meta-value user-email">{userEmail}</span>
              {onSignOut && (
                <button className="signout-btn" onClick={onSignOut} title="Cerrar sesión">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Salir
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="header-controls">
        {onToggleDark && (
          <button
            className="header-theme-btn"
            onClick={onToggleDark}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? (
              /* Sol */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Luna */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}
        <button
          className="header-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir encabezado' : 'Contraer encabezado'}
          aria-label={collapsed ? 'Expandir encabezado' : 'Contraer encabezado'}
          aria-expanded={!collapsed}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
