import React from 'react';
import type { TechItem } from '../types';
import '../styles/ProgressSummary.css';

interface ProgressSummaryProps { items: TechItem[]; }

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ items }) => {
  const approved = items.filter((item) => item.estado === 'Aprobado').length;
  const partial  = items.filter((item) => item.estado === 'Aprobado parcial').length;
  const denied   = items.filter((item) => item.estado === 'Negado').length;
  const pending  = items.filter((item) => item.estado === 'Pendiente').length;
  const reviewed = approved + partial + denied;
  const progress = items.length ? Math.round((reviewed / items.length) * 100) : 0;
  const isComplete = pending === 0 && items.length > 0;

  return (
    <section className={`progress-section ${isComplete ? 'is-complete' : ''}`} aria-label="Avance de la decisión gerencial">
      {isComplete && (
        <div className="completion-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Revisión completa — todas las solicitudes han recibido una decisión
        </div>
      )}

      <div className="progress-heading">
        <div>
          <span className="progress-eyebrow">Estado de la revisión</span>
          <h2 className="section-title">Decisiones de Gerencia</h2>
        </div>
        <strong className={`progress-pct ${isComplete ? 'pct-complete' : ''}`}>{progress}% revisado</strong>
      </div>

      <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${progress}% de las solicitudes revisadas`}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="decision-counts">
        <span className="count-item"><strong>{pending}</strong> pendientes</span>
        <span className="count-item decision-approved"><strong>{approved}</strong> aprobadas</span>
        <span className="count-item decision-partial"><strong>{partial}</strong> parciales</span>
        <span className="count-item decision-denied"><strong>{denied}</strong> negadas</span>
      </div>
    </section>
  );
};

export default ProgressSummary;
