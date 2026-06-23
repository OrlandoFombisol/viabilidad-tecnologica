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
  const [expanded,     setExpanded]     = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [selected,     setSelected]     = useState<Revision | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      <section className="rp-footer">
        {/* Lista expandible */}
        {expanded && (
          <div className="rp-list-panel">
            {revisiones.length === 0 ? (
              <p className="rp-no-items">
                Aún no se ha cerrado ninguna revisión. Haz clic en
                <strong> Cerrar revisión</strong> para guardar el estado actual y comenzar un nuevo ciclo.
              </p>
            ) : (
              <div className="rp-cards-grid">
                {revisiones.map(rev => {
                  const aprobados  = rev.items.filter(i => i.estado === 'Aprobado').length;
                  const parciales  = rev.items.filter(i => i.estado === 'Aprobado parcial').length;
                  const negados    = rev.items.filter(i => i.estado === 'Negado').length;
                  const pendientes = rev.items.filter(i => i.estado === 'Pendiente').length;
                  const total      = rev.items.length;
                  const pct        = total > 0 ? Math.round(((aprobados + parciales) / total) * 100) : 0;
                  return (
                    <button key={rev.id} className="rp-card" onClick={() => setSelected(rev)}>
                      <div className="rp-card-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>{fmtDate(rev.fecha)}</span>
                        <span className="rp-card-time">{fmtTime(rev.fecha)}</span>
                      </div>
                      <div className="rp-card-progress">
                        <div className="rp-card-bar">
                          <div className="rp-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="rp-card-pct">{pct}%</span>
                      </div>
                      <div className="rp-card-badges">
                        {aprobados  > 0 && <span className="rp-b rp-b-apr">{aprobados} apr.</span>}
                        {parciales  > 0 && <span className="rp-b rp-b-parc">{parciales} parc.</span>}
                        {negados    > 0 && <span className="rp-b rp-b-neg">{negados} neg.</span>}
                        {pendientes > 0 && <span className="rp-b rp-b-pend">{pendientes} pend.</span>}
                        <span className="rp-b rp-b-total">{total} ítems</span>
                      </div>
                      <span className="rp-card-cta">Abrir revisión →</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Barra inferior siempre visible */}
        <div className="rp-bar" onClick={() => setExpanded(e => !e)} role="button" tabIndex={0}
          aria-expanded={expanded} onKeyDown={e => e.key === 'Enter' && setExpanded(x => !x)}>
          <div className="rp-bar-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span className="rp-bar-title">Revisiones</span>
            {revisiones.length > 0 && (
              <span className="rp-bar-count">{revisiones.length} ciclo{revisiones.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="rp-bar-right">
            {confirmClose && (
              <span className="rp-confirm-label">¿Confirmar? —</span>
            )}
            <button
              className={`rp-close-btn${confirmClose ? ' rp-confirming' : ''}${currentItemCount === 0 ? ' rp-disabled' : ''}`}
              onClick={handleCloseClick}
              disabled={currentItemCount === 0}
              title={currentItemCount === 0 ? 'No hay ítems en la tabla' : 'Guardar revisión actual y reiniciar tabla'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {confirmClose ? '¡Confirmar cierre!' : 'Cerrar revisión'}
            </button>

            <svg
              className={`rp-chevron${expanded ? ' rp-chevron-up' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"
              aria-hidden="true">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </div>
        </div>
      </section>

      {selected && (
        <RevisionTableModal
          revision={selected}
          onSave={items => { onUpdateRevision(selected.id, items); setSelected(null); }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};

export default RevisionesPanel;
