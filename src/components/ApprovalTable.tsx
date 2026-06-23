import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const AREA_ACCENTS = ['blue', 'emerald', 'violet', 'amber', 'cyan'] as const;

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const ApprovalTable: React.FC<ApprovalTableProps> = ({
  items, readOnly, onUpdateItem, onAddItem, onDeleteItem, onApproveAll, onResetAll,
}) => {
  const areas = useMemo(() => Array.from(new Set(items.map((item) => item.area))), [items]);
  const [openAreas, setOpenAreas]       = useState<Set<string>>(() => new Set(areas.slice(0, 1)));
  const [query, setQuery]               = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [modal, setModal]               = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode]         = useState<'lista' | 'cuadricula'>('cuadricula');

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const visibleAreas = areas.filter((area) => {
    if (!normalizedQuery) return true;
    return items.some((item) => item.area === area &&
      `${item.area} ${item.solicitante} ${item.elemento}`.toLocaleLowerCase('es').includes(normalizedQuery));
  });

  const toggleArea = (area: string) => setOpenAreas((curr) => {
    const next = new Set(curr);
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

      {/* ── Hero header ── */}
      <div className="approval-hero">
        <div className="approval-hero-text">
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

      {/* ── Glass toolbar ── */}
      <div className="review-toolbar">
        <label className="search-box" htmlFor="approval-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="approval-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

      {/* ── Grid view ── */}
      {viewMode === 'cuadricula' && (
        <GridView items={items} readOnly={readOnly} onUpdateItem={onUpdateItem} />
      )}

      {/* ── Lista view with Framer Motion ── */}
      <motion.div
        className="area-list"
        style={{ display: viewMode === 'lista' ? undefined : 'none' }}
        variants={listVariants}
        initial="hidden"
        animate={viewMode === 'lista' ? 'visible' : 'hidden'}
      >
        {visibleAreas.map((area, areaIdx) => {
          const accent    = AREA_ACCENTS[areaIdx % AREA_ACCENTS.length];
          const areaItems = items.filter((item) => item.area === area && (!normalizedQuery ||
            `${item.area} ${item.solicitante} ${item.elemento}`.toLocaleLowerCase('es').includes(normalizedQuery)));
          const isOpen        = openAreas.has(area) || Boolean(normalizedQuery);
          const reviewed      = areaItems.filter((i) => i.estado !== 'Pendiente').length;
          const approvedCount = areaItems.filter((i) => i.estado === 'Aprobado').length;
          const partialCount  = areaItems.filter((i) => i.estado === 'Aprobado parcial').length;
          const deniedCount   = areaItems.filter((i) => i.estado === 'Negado').length;
          const progressPct   = areaItems.length > 0 ? Math.round((reviewed / areaItems.length) * 100) : 0;
          const isComplete    = reviewed === areaItems.length && areaItems.length > 0;
          const circumference = 2 * Math.PI * 11;

          const peopleGroups = Array.from(
            areaItems.reduce((map, item) => {
              const list = map.get(item.solicitante) ?? [];
              list.push(item);
              map.set(item.solicitante, list);
              return map;
            }, new Map<string, TechItem[]>()).entries()
          );
          const people = peopleGroups.length;

          return (
            <motion.article
              className={`area-panel area-accent-${accent}`}
              key={area}
              variants={panelVariants}
              layout
            >
              <button
                className="area-heading"
                onClick={() => toggleArea(area)}
                aria-expanded={isOpen}
              >
                <span className={`area-chevron${isOpen ? ' open' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                    <path d={isOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                  </svg>
                </span>

                <span className="area-name">
                  <strong>{area}</strong>
                  <small>
                    {people} {people === 1 ? 'solicitante' : 'solicitantes'} ·{' '}
                    {areaItems.length} {areaItems.length === 1 ? 'ítem' : 'ítems'}
                  </small>
                </span>

                <span className="area-right-meta">
                  {reviewed > 0 && (
                    <span className="area-mini-stats">
                      {approvedCount > 0 && <span className="mini-stat mini-aprobado">{approvedCount} apr.</span>}
                      {partialCount  > 0 && <span className="mini-stat mini-parcial">{partialCount} parc.</span>}
                      {deniedCount   > 0 && <span className="mini-stat mini-negado">{deniedCount} neg.</span>}
                    </span>
                  )}
                  <span className={`area-progress${isComplete ? ' complete' : ''}`}>
                    <span className="area-progress-ring">
                      <svg width="30" height="30" viewBox="0 0 30 30" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="15" cy="15" r="11" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.15" />
                        <circle
                          cx="15" cy="15" r="11"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference * (1 - progressPct / 100)}
                          style={{ transition: 'stroke-dashoffset 0.55s cubic-bezier(0.34,1.56,0.64,1)' }}
                        />
                      </svg>
                      <span className="area-progress-label">{progressPct}%</span>
                    </span>
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="request-list"
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    {peopleGroups.map(([person, personItems], pi) => {
                      const personReviewed = personItems.filter((i) => i.estado !== 'Pendiente').length;
                      return (
                        <motion.div
                          className="person-group"
                          key={person}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: pi * 0.06, duration: 0.3, ease: 'easeOut' }}
                        >
                          <div className="request-person">
                            <span className="person-avatar">{person.charAt(0)}</span>
                            <span>
                              <strong>{person}</strong>
                              <small>{personReviewed} de {personItems.length} decisiones registradas</small>
                            </span>
                          </div>

                          <div className="person-items">
                            {personItems.map((item, itemIdx) => (
                              <motion.div
                                className={`item-decision status-${item.estado.replace(' ', '-').toLowerCase()}`}
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: pi * 0.06 + itemIdx * 0.045, duration: 0.28 }}
                                whileHover={{ y: -2, transition: { duration: 0.14 } }}
                              >
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
                                    <span className="requested-qty">
                                      <small>Solicita</small>
                                      <strong>{item.cantidadSolicitada}</strong>
                                    </span>
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
                                  <div className="decision-buttons" aria-label={`Decisión para ${item.elemento}`}>
                                    {(['Aprobado', 'Aprobado parcial', 'Negado'] as ApprovalStatus[]).map((status) => (
                                      <motion.button
                                        key={status}
                                        className={`decision-btn decision-${status.replace(' ', '-').toLowerCase()} ${item.estado === status ? 'active' : ''}`}
                                        onClick={() => changeStatus(item, status)}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.94 }}
                                      >
                                        {statusLabel[status]}
                                      </motion.button>
                                    ))}
                                  </div>
                                )}

                                <div className="item-decision-detail">
                                  <label className="approved-qty">
                                    <span>Cant. aprobada</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={item.cantidadSolicitada}
                                      value={item.cantidadAprobada}
                                      disabled={readOnly || item.estado === 'Pendiente' || item.estado === 'Negado'}
                                      onChange={(e) => changeQuantity(item, e.target.value)}
                                    />
                                  </label>
                                  <input
                                    className="comment-input"
                                    value={item.comentarioGerencia}
                                    onChange={(e) => onUpdateItem(item.id, { comentarioGerencia: e.target.value })}
                                    placeholder={readOnly ? '(sin comentario)' : 'Comentario opcional'}
                                    disabled={readOnly}
                                    aria-label={`Comentario para ${item.elemento}`}
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}

                    <button
                      className="add-item-in-area"
                      onClick={() => setModal({ mode: 'add', defaultArea: area })}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Agregar ítem en {area}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}

        {visibleAreas.length === 0 && (
          <div className="empty-search">No hay solicitudes que coincidan con la búsqueda.</div>
        )}
      </motion.div>

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
