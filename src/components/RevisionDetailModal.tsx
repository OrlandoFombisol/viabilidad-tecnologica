import React from 'react';
import type { TechItem } from '../types';
import type { Revision } from '../hooks/useRevisiones';
import '../styles/RevisionDetailModal.css';

const STATUS_LABEL: Record<string, string> = {
  Pendiente: 'Pendiente', Aprobado: 'Aprobado',
  'Aprobado parcial': 'Parcial', Negado: 'Negado',
};
const STATUS_CLS: Record<string, string> = {
  Pendiente: 'rdm-pend', Aprobado: 'rdm-apr',
  'Aprobado parcial': 'rdm-parc', Negado: 'rdm-neg',
};

interface Props { revision: Revision; onClose: () => void; }

const RevisionDetailModal: React.FC<Props> = ({ revision, onClose }) => {
  const fecha = new Date(revision.fecha).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const hora = new Date(revision.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const { items } = revision;
  const total      = items.length;
  const aprobados  = items.filter(i => i.estado === 'Aprobado').length;
  const parciales  = items.filter(i => i.estado === 'Aprobado parcial').length;
  const negados    = items.filter(i => i.estado === 'Negado').length;
  const pendientes = items.filter(i => i.estado === 'Pendiente').length;

  const areaMap = new Map<string, TechItem[]>();
  items.forEach(item => {
    if (!areaMap.has(item.area)) areaMap.set(item.area, []);
    areaMap.get(item.area)!.push(item);
  });

  return (
    <div className="modal-overlay rdm-overlay" onClick={onClose}>
      <div className="modal-box rdm-box" onClick={e => e.stopPropagation()} role="dialog" aria-label="Detalle de revisión">
        <div className="rdm-header">
          <div>
            <span className="rdm-kicker">Revisión cerrada · {hora}</span>
            <h2 className="rdm-title">{fecha.charAt(0).toUpperCase() + fecha.slice(1)}</h2>
            <div className="rdm-stats">
              {aprobados  > 0 && <span className="rdm-stat rdm-badge-apr">{aprobados} aprobados</span>}
              {parciales  > 0 && <span className="rdm-stat rdm-badge-parc">{parciales} parciales</span>}
              {negados    > 0 && <span className="rdm-stat rdm-badge-neg">{negados} negados</span>}
              {pendientes > 0 && <span className="rdm-stat rdm-badge-pend">{pendientes} pendientes</span>}
              <span className="rdm-stat rdm-badge-total">{total} total</span>
            </div>
          </div>
          <button className="rdm-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="rdm-body">
          {Array.from(areaMap.entries()).map(([area, areaItems]) => (
            <div key={area} className="rdm-area-group">
              <h3 className="rdm-area-name">{area}</h3>
              <div className="rdm-scroll">
                <table className="rdm-table">
                  <thead>
                    <tr>
                      <th>Solicitante</th>
                      <th>Elemento</th>
                      <th>Solicitado</th>
                      <th>Aprobado</th>
                      <th>Estado</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areaItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.solicitante}</td>
                        <td>{item.elemento}</td>
                        <td className="rdm-num">{item.cantidadSolicitada}</td>
                        <td className="rdm-num">{item.cantidadAprobada ?? 0}</td>
                        <td>
                          <span className={`rdm-badge ${STATUS_CLS[item.estado]}`}>
                            {STATUS_LABEL[item.estado]}
                          </span>
                        </td>
                        <td className="rdm-obs">{item.comentarioGerencia || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevisionDetailModal;
