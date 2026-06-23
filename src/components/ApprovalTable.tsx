import React, { useMemo, useState } from 'react';
import type { ApprovalStatus, TechItem } from '../types';
import ItemFormModal from './ItemFormModal';
import GridView from './GridView';
import '../styles/ApprovalTable.css';

interface ApprovalTableProps {
  items: TechItem[];
  readOnly: boolean;
  onUpdateItem: (id: string, changes: Partial<TechItem>) => void;
  onAddItem:    (data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => void;
  onDeleteItem: (id: string) => void;
  onApproveAll: () => void;
  onResetAll:   () => void;
}

const statusLabel: Record<ApprovalStatus, string> = {
  Pendiente: 'Pendiente', Aprobado: 'Aprobada', 'Aprobado parcial': 'Parcial', Negado: 'Negada',
};

type ModalState =
  | { mode: 'add'; defaultArea?: string }
  | { mode: 'edit'; item: TechItem }
  | null;

const ApprovalTable: React.FC<ApprovalTableProps> = ({
  items, readOnly, onUpdateItem, onAddItem, onDeleteItem, onApproveAll, onResetAll,
}) => {
  const areas = useMemo(() => Array.from(new Set(items.map((item) => item.area))), [items]);
  const [openAreas, setOpenAreas]     = useState<Set<string>>(() => new Set(areas.slice(0, 1)));
  const [query, setQuery]             = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [modal, setModal]             = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode]       = useState<'lista' | 'cuadricula'>('cuadricula');

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const visibleAreas = areas.filter((area) => {
    if (!normalizedQuery) return true;
    return items.some((item) => item.area === area &&
      `${item.area} ${item.solicitante} ${item.elemento}`.toLocaleLowerCase('es').includes(normalizedQuery));
  });

  const toggleArea = (area: string) => setOpenAreas((current) => {
    const next = new Set(current);
    if (next.has(area)) next.delete(area);
    else next.add(area);
    return next;
  });

  const changeStatus = (item: TechItem, estado: ApprovalStatus) => {
    let cantidadAprobada = item.cantidadAprobada;
    if (estado === 'Aprobado') cantidadAprobada = item.cantidadSolicitada;
    if (estado === 'Negado' || estado === 'Pendiente') cantidadAprobada = 0;
    if (estado === 'Aprobado parcial' && cantidadAprobada === 0) cantidadAprobada = Math.min(1, item.cantidadSolicitada);
    onUpdateItem(item.id, { estado, cantidadAprobada });
  };

  const changeQuantity = (item: TechItem, rawValue: string) => {
    const value = Math.max(0, Math.min(Number(rawValue) || 0, item.cantidadSolicitada));
    const estado: ApprovalStatus = value === item.cantidadSolicitada ? 'Aprobado' : value > 0 ? 'Aprobado parcial' : 'Negado';
    onUpdateItem(item.id, { cantidadAprobada: value, estado });
  };

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    onResetAll();
    setConfirmReset(false);
  };

  const handleDeleteClick = (id: string) => {
    if (pendingDelete.has(id)) {
      onDeleteItem(id);
      setPendingDelete(prev => { const next = new Set(prev); next.delete(id); return next; });
    } else {
      setPendingDelete(prev => new Set(prev).add(id));
      window.setTimeout(() => {
        setPendingDelete(prev => { const next = new Set(prev); next.delete(id); return next; });
      }, 3500);
    }
  };

  const handleModalSubmit = (data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => {
    if (!modal) return;
    if (modal.mode === 'add') {
      onAddItem(data);
    } else {
      const newCant = Math.min(modal.item.cantidadAprobada, data.cantidadSolicitada);
      onUpdateItem(modal.item.id, { ...data, cantidadAprobada: newCant });
    }
    setModal(null);
  };

  return (
    <section className="approval-section">
      <div className="table-header-bar">
        <div>
          <span className="section-eyebrow">Detalle proveniente del levantamiento</span>
          <h2 className="section-title">Revisión de viabilidad por área y solicitante</h2>
          <p className="section-subtitle">Abra un área y registre la decisión para cada necesidad evaluada por Tecnología.</p>
        </div>
        <div className="table-actions">
          {!readOnly && (
            <>
              <button className="btn btn-secondary" onClick={reset}>
                {confirmReset ? 'Confirmar limpieza' : 'Limpiar revisión'}
              </button>
              <button className="btn btn-success" onClick={onApproveAll}>Aprobar todas</button>
            </>
          )}
          <button className="btn btn-add" onClick={() => setModal({ mode: 'add' })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva solicitud
          </button>
        </div>
      </div>

      <div className="review-toolbar">
        <label className="search-box" htmlFor="approval-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="approval-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por persona, área o elemento…"
            aria-label="Buscar solicitudes"
          />
        </label>
        <div className="toolbar-right">
          <span className="area-count">{areas.length} áreas · {items.length} decisiones</span>
          <div className="view-toggle" role="group" aria-label="Modo de vista">
            <button
              className={`view-toggle-btn${viewMode === 'cuadricula' ? ' active' : ''}`}
              onClick={() => setViewMode('cuadricula')}
              title="Vista cuadrícula"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
              Vista 1
            </button>
            <button
              className={`view-toggle-btn${viewMode === 'lista' ? ' active' : ''}`}
              onClick={() => setViewMode('lista')}
              title="Vista lista"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Vista 2
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'cuadricula' && (
        <GridView items={items} readOnly={readOnly} onUpdateItem={onUpdateItem} />
      )}

      <div className="area-list" style={{ display: viewMode === 'lista' ? undefined : 'none' }}>
        {visibleAreas.map((area) => {
          const areaItems = items.filter((item) => item.area === area && (!normalizedQuery ||
            `${item.area} ${item.solicitante} ${item.elemento}`.toLocaleLowerCase('es').includes(normalizedQuery)));
          const isOpen      = openAreas.has(area) || Boolean(normalizedQuery);
          const reviewed    = areaItems.filter((item) => item.estado !== 'Pendiente').length;
          const approvedCount = areaItems.filter((item) => item.estado === 'Aprobado').length;
          const partialCount  = areaItems.filter((item) => item.estado === 'Aprobado parcial').length;
          const deniedCount   = areaItems.filter((item) => item.estado === 'Negado').length;
          const peopleGroups  = Array.from(
            areaItems.reduce((groups, item) => {
              const personItems = groups.get(item.solicitante) ?? [];
              personItems.push(item);
              groups.set(item.solicitante, personItems);
              return groups;
            }, new Map<string, TechItem[]>()).entries()
          );
          const people = peopleGroups.length;

          return (
            <article className="area-panel" key={area}>
              <button className="area-heading" onClick={() => toggleArea(area)} aria-expanded={isOpen}>
                <span className="area-chevron">{isOpen ? '−' : '+'}</span>
                <span className="area-name">
                  <strong>{area}</strong>
                  <small>{people} {people === 1 ? 'solicitante' : 'solicitantes'} · {areaItems.length} {areaItems.length === 1 ? 'ítem' : 'ítems'}</small>
                </span>
                <span className="area-right-meta">
                  {reviewed > 0 && (
                    <span className="area-mini-stats">
                      {approvedCount > 0 && <span className="mini-stat mini-aprobado">{approvedCount} apr.</span>}
                      {partialCount  > 0 && <span className="mini-stat mini-parcial">{partialCount} parc.</span>}
                      {deniedCount   > 0 && <span className="mini-stat mini-negado">{deniedCount} neg.</span>}
                    </span>
                  )}
                  <span className={`area-progress ${reviewed === areaItems.length ? 'complete' : ''}`}>
                    {reviewed} / {areaItems.length}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="request-list">
                  {peopleGroups.map(([person, personItems]) => {
                    const personReviewed = personItems.filter((item) => item.estado !== 'Pendiente').length;
                    return (
                      <div className="person-group" key={person}>
                        <div className="request-person">
                          <span className="person-avatar">{person.charAt(0)}</span>
                          <span>
                            <strong>{person}</strong>
                            <small>{personReviewed} de {personItems.length} decisiones registradas</small>
                          </span>
                        </div>
                        <div className="person-items">
                          {personItems.map((item) => (
                            <div className={`item-decision status-${item.estado.replace(' ', '-').toLowerCase()}`} key={item.id}>
                              <div className="item-decision-heading">
                                <span className="item-meta">
                                  <span className="item-element-row">
                                    <strong>{item.elemento}</strong>
                                    <span className={`priority-badge priority-${item.prioridad.toLowerCase()}`}>{item.prioridad}</span>
                                  </span>
                                  <small className="item-categoria">{item.categoria}</small>
                                  <small className="item-justificacion">{item.justificacion}</small>
                                </span>
                                <span className="item-heading-right">
                                  <span className="requested-qty"><small>Solicita</small><strong>{item.cantidadSolicitada}</strong></span>
                                  {!readOnly && (
                                    <span className="item-tools">
                                      <button
                                        className="item-tool-btn edit-tool"
                                        onClick={() => setModal({ mode: 'edit', item })}
                                        title="Editar solicitud"
                                        aria-label={`Editar ${item.elemento}`}
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                      </button>
                                      <button
                                        className={`item-tool-btn delete-tool ${pendingDelete.has(item.id) ? 'pending' : ''}`}
                                        onClick={() => handleDeleteClick(item.id)}
                                        title={pendingDelete.has(item.id) ? 'Confirmar eliminación' : 'Eliminar solicitud'}
                                        aria-label={`Eliminar ${item.elemento}`}
                                      >
                                        {pendingDelete.has(item.id) ? '?' : (
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                          </svg>
                                        )}
                                      </button>
                                    </span>
                                  )}
                                </span>
                              </div>
                              {!readOnly && (
                                <div className="decision-buttons" aria-label={`Decisión para ${item.elemento} de ${item.solicitante}`}>
                                  {(['Aprobado', 'Aprobado parcial', 'Negado'] as ApprovalStatus[]).map((status) => (
                                    <button
                                      key={status}
                                      className={`decision-btn decision-${status.replace(' ', '-').toLowerCase()} ${item.estado === status ? 'active' : ''}`}
                                      onClick={() => changeStatus(item, status)}
                                    >
                                      {statusLabel[status]}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="item-decision-detail">
                                <label className="approved-qty">
                                  <span>Cant. aprobada</span>
                                  <input
                                    type="number" min={0} max={item.cantidadSolicitada}
                                    value={item.cantidadAprobada}
                                    disabled={readOnly || item.estado === 'Pendiente' || item.estado === 'Negado'}
                                    onChange={(event) => changeQuantity(item, event.target.value)}
                                  />
                                </label>
                                <input
                                  className="comment-input"
                                  value={item.comentarioGerencia}
                                  onChange={(event) => onUpdateItem(item.id, { comentarioGerencia: event.target.value })}
                                  placeholder={readOnly ? '(sin comentario)' : 'Comentario opcional'}
                                  disabled={readOnly}
                                  aria-label={`Comentario para ${item.elemento}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    className="add-item-in-area"
                    onClick={() => { setModal({ mode: 'add', defaultArea: area }); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Agregar ítem en {area}
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {visibleAreas.length === 0 && (
          <div className="empty-search">No hay solicitudes que coincidan con la búsqueda.</div>
        )}
      </div>

      {modal && (
        <ItemFormModal
          mode={modal.mode}
          item={modal.mode === 'edit' ? modal.item : undefined}
          existingAreas={areas}
          defaultArea={modal.mode === 'add' ? modal.defaultArea : undefined}
          onSubmit={handleModalSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
};

export default ApprovalTable;
