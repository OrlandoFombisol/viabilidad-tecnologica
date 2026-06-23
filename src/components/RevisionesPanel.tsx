import React, { useState, useRef } from 'react';
import type { TechItem } from '../types';
import type { Revision } from '../hooks/useRevisiones';
import RevisionTableModal from './RevisionTableModal';
import '../styles/RevisionesPanel.css';

interface Props {
  revisiones: Revision[];
  currentItemCount: number;
  onCloseRevision: () => void;
  onUpdateRevision: (id: string, items: TechItem[]) => void;
}

const RevisionesPanel: React.FC<Props> = ({
  revisiones, currentItemCount, onCloseRevision, onUpdateRevision,
}) => {
  const [confirmClose, setConfirmClose] = useState(false);
  const [selected, setSelected] = useState<Revision | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCloseClick = () => {
    if (confirmClose) {
      onCloseRevision();
      setConfirmClose(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setConfirmClose(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setConfirmClose(false), 4500);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <aside className="rp-panel">
        {/* Cabecera */}
        <div className="rp-header">
          <span className="rp-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Revisiones
          </span>
        </div>

        {/* Acción: Cerrar revisión */}
        <div className="rp-close-section">
          <p className="rp-close-desc">
            Guarda una copia de la revisión actual y deja la tabla limpia para el próximo ciclo.
          </p>
          <button
            className={`rp-close-btn${confirmClose ? ' rp-confirming' : ''}${currentItemCount === 0 ? ' rp-disabled' : ''}`}
            onClick={handleCloseClick}
            disabled={currentItemCount === 0}
            title={currentItemCount === 0 ? 'No hay ítems en la tabla' : 'Cerrar revisión actual'}
          >
            {confirmClose ? (
              '¿Confirmar cierre?'
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Cerrar revisión
              </>
            )}
          </button>
          {confirmClose && (
            <p className="rp-confirm-hint">
              Clic de nuevo para confirmar — se guardará con la fecha actual
            </p>
          )}
        </div>

        {/* Historial */}
        <div className="rp-history">
          <span className="rp-history-label">Historial</span>

          {revisiones.length === 0 ? (
            <p className="rp-empty">No hay revisiones cerradas aún.</p>
          ) : (
            <ul className="rp-list">
              {revisiones.map(rev => {
                const aprobados = rev.items.filter(i => i.estado === 'Aprobado').length;
                const negados   = rev.items.filter(i => i.estado === 'Negado').length;
                const total     = rev.items.length;
                return (
                  <li key={rev.id} className="rp-card" onClick={() => setSelected(rev)} title="Abrir revisión">
                    <div className="rp-card-date">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {fmtDate(rev.fecha)}
                      <span className="rp-card-time">{fmtTime(rev.fecha)}</span>
                    </div>
                    <div className="rp-card-meta">
                      <span className="rp-card-total">{total} ítems</span>
                      {aprobados > 0 && <span className="rp-card-apr">{aprobados} apr.</span>}
                      {negados   > 0 && <span className="rp-card-neg">{negados} neg.</span>}
                    </div>
                    <span className="rp-card-arrow">›</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {selected && (
        <RevisionTableModal
          revision={selected}
          onSave={items => onUpdateRevision(selected.id, items)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};

export default RevisionesPanel;
