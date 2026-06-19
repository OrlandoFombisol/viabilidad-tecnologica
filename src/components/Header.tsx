import React from 'react';
import type { ReportStatus } from '../types';
import '../styles/Header.css';

interface HeaderProps {
  reportStatus: ReportStatus;
  reportDate: string;
  userEmail?: string;
  userRole?: string;
  onSignOut?: () => void;
}

const statusConfig: Record<ReportStatus, { label: string; className: string }> = {
  'Pendiente de revisión': { label: 'Pendiente de revisión', className: 'status-pending' },
  'Aprobado parcialmente':  { label: 'Aprobado parcialmente', className: 'status-partial' },
  Aprobado:                 { label: 'Aprobado', className: 'status-approved' },
  Negado:                   { label: 'Negado', className: 'status-denied' },
};

const Header: React.FC<HeaderProps> = ({ reportStatus, reportDate, userEmail, userRole, onSignOut }) => {
  const { label, className } = statusConfig[reportStatus];

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <div className="header-titles">
          <h1 className="header-main-title">Solicitud de Viabilidad Tecnológica</h1>
          <p className="header-subtitle">
            Sugerido de adquisición basado en necesidades levantadas por las áreas
          </p>
        </div>
      </div>

      <div className="header-meta">
        <div className="header-meta-item">
          <span className="meta-label">Presentado por</span>
          <span className="meta-value">Jefatura de Tecnología de la Información</span>
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
    </header>
  );
};

export default Header;
