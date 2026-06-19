import React, { useState, useMemo } from 'react';
import type { TechItem } from '../types';
import '../styles/SummaryCards.css';

interface SummaryCardsProps { items: TechItem[]; }

const SummaryCards: React.FC<SummaryCardsProps> = ({ items }) => {
  const [open, setOpen] = useState(false);

  const { consolidated, totalSolicitadas, totalAprobadas } = useMemo(() => {
    const map = new Map<string, { elemento: string; solicitadas: number; aprobadas: number; solicitudes: number }>();
    for (const item of items) {
      const entry = map.get(item.elemento) ?? { elemento: item.elemento, solicitadas: 0, aprobadas: 0, solicitudes: 0 };
      entry.solicitadas += item.cantidadSolicitada;
      entry.aprobadas   += item.cantidadAprobada;
      entry.solicitudes += 1;
      map.set(item.elemento, entry);
    }
    const sorted = Array.from(map.values()).sort((a, b) => a.elemento.localeCompare(b.elemento, 'es'));
    return {
      consolidated: sorted,
      totalSolicitadas: items.reduce((s, i) => s + i.cantidadSolicitada, 0),
      totalAprobadas:   items.reduce((s, i) => s + i.cantidadAprobada, 0),
    };
  }, [items]);

  const hasApprovals = totalAprobadas > 0;

  return (
    <section className="summary-section">
      <button className="summary-disclosure" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>
          <span className="summary-kicker">Contexto consolidado</span>
          <strong>Volumen general de la solicitud</strong>
          <small>
            {consolidated.length} elementos · {totalSolicitadas} unidades solicitadas
            {hasApprovals ? ` · ${totalAprobadas} aprobadas` : ''}
          </small>
        </span>
        <span className="summary-toggle">{open ? 'Ocultar' : 'Consultar'} <b>{open ? '−' : '+'}</b></span>
      </button>

      {open && (
        <div className="summary-body">
          <div className="cards-grid">
            {consolidated.map((entry) => {
              const pct = entry.solicitadas > 0 ? Math.round((entry.aprobadas / entry.solicitadas) * 100) : 0;
              const isApproved = entry.aprobadas > 0;
              return (
                <div key={entry.elemento} className={`summary-card ${isApproved ? 'has-approvals' : ''}`}>
                  <span className="card-element">{entry.elemento}</span>
                  <div className="card-qty-row">
                    <span className="card-qty-block">
                      <strong className="card-qty">{entry.solicitadas}</strong>
                      <span className="card-qty-label">solicitadas</span>
                    </span>
                    {isApproved && (
                      <span className="card-qty-block approved-block">
                        <strong className="card-qty-approved">{entry.aprobadas}</strong>
                        <span className="card-qty-label">aprobadas</span>
                      </span>
                    )}
                  </div>
                  {isApproved && (
                    <div className="card-mini-bar" title={`${pct}% aprobado`}>
                      <div className="card-mini-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <span className="card-requests-label">
                    {entry.solicitudes} {entry.solicitudes === 1 ? 'solicitud' : 'solicitudes'}
                  </span>
                </div>
              );
            })}
          </div>

          {hasApprovals && (
            <div className="summary-totals">
              <span className="totals-label">Total aprobado</span>
              <span className="totals-value">{totalAprobadas} <small>de {totalSolicitadas}</small></span>
              <span className="totals-pct">{Math.round((totalAprobadas / totalSolicitadas) * 100)}%</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default SummaryCards;
