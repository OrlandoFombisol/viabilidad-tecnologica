import React from 'react';
import type { SyncStatus } from '../hooks/useRequisicion';
import '../styles/SyncIndicator.css';

interface SyncIndicatorProps {
  status: SyncStatus;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status }) => {
  if (status === 'idle') return null;

  const config: Record<Exclude<SyncStatus, 'idle'>, { label: string; className: string; icon: React.ReactNode }> = {
    saving: {
      label: 'Guardando…',
      className: 'sync-saving',
      icon: <span className="sync-spinner" aria-hidden="true" />,
    },
    saved: {
      label: 'Guardado',
      className: 'sync-saved',
      icon: <span className="sync-dot" aria-hidden="true" />,
    },
    offline: {
      label: 'Sin conexión',
      className: 'sync-offline',
      icon: <span className="sync-dot" aria-hidden="true" />,
    },
    error: {
      label: 'Error de sincronización',
      className: 'sync-error',
      icon: <span className="sync-dot" aria-hidden="true" />,
    },
  };

  const { label, className, icon } = config[status];

  return (
    <span
      className={`sync-indicator ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {icon}
      {label}
    </span>
  );
};

export default SyncIndicator;
