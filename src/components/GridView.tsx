import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { ApprovalStatus, TechItem } from '../types';
import ItemFormModal from './ItemFormModal';
import '../styles/GridView.css';

const SHORT: Record<string, string> = {
  'Teclado': 'Teclado',
  'Base para portátil': 'Base portátil',
  'Mouse': 'Mouse',
  'Mousepad': 'Mousepad',
  'PC / Laptop': 'PC/Laptop',
  'Pantalla': 'Pantalla',
  'PC All in One': 'All-in-One',
};

function shorten(el: string) {
  return SHORT[el] ?? el.slice(0, 12);
}

const ESTADO_CLASS: Record<ApprovalStatus, string> = {
  Pendiente: 'gv-pendiente',
  Aprobado: 'gv-aprobado',
  'Aprobado parcial': 'gv-parcial',
  Negado: 'gv-negado',
};

interface GridViewProps {
  items: TechItem[];
  canApprove: boolean;
  onUpdateItem: (id: string, changes: Partial<TechItem>) => void;
  onAddItem: (data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => void;
  onDeleteItem: (id: string) => void;
  onRenameArea: (oldArea: string, newArea: string) => void;
  onRenameSolicitante: (area: string, oldName: string, newName: string) => void;
  onOpenEditModal: (item: TechItem) => void;
  existingAreas: string[];
}

interface PopupPos { itemId: string; top: number; left: number; }

interface AreaGroup {
  area: string;
  userRows: Array<{ solicitante: string; byEl: Map<string, TechItem> }>;
}

const GridView: React.FC<GridViewProps> = ({
  items, canApprove, onUpdateItem, onAddItem, onDeleteItem,
  onRenameArea, onRenameSolicitante, onOpenEditModal, existingAreas,
}) => {
  const [popup, setPopup]           = useState<PopupPos | null>(null);
  const [localComment, setLocalComment] = useState('');
  const [addModal, setAddModal]     = useState<{ area: string; solicitante: string; elemento: string } | null>(null);
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(
    () => new Set(items.map(i => i.area))
  );
  const [pendingDelete, setPendingDelete] = useState<Set<string>>(new Set());
  const [editingArea,   setEditingArea]   = useState<{ area: string; value: string } | null>(null);
  const [editingPerson, setEditingPerson] = useState<{ area: string; person: string; value: string } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const { elementos, areaGroups, totalsSolicitado, totalsAprobado } = useMemo(() => {
    const elementoSet = new Set<string>();
    items.forEach(i => elementoSet.add(i.elemento));
    const elementos = Array.from(elementoSet);

    const areaMap = new Map<string, Map<string, Map<string, TechItem>>>();
    items.forEach(item => {
      if (!areaMap.has(item.area)) areaMap.set(item.area, new Map());
      const userMap = areaMap.get(item.area)!;
      if (!userMap.has(item.solicitante)) userMap.set(item.solicitante, new Map());
      userMap.get(item.solicitante)!.set(item.elemento, item);
    });

    const areaGroups: AreaGroup[] = Array.from(areaMap.entries()).map(([area, userMap]) => ({
      area,
      userRows: Array.from(userMap.entries()).map(([solicitante, byEl]) => ({ solicitante, byEl })),
    }));

    const totalsSolicitado = elementos.map(el =>
      items.filter(i => i.elemento === el).reduce((s, i) => s + i.cantidadSolicitada, 0)
    );
    const totalsAprobado = elementos.map(el =>
      items.filter(i => i.elemento === el).reduce((s, i) => s + (i.cantidadAprobada ?? 0), 0)
    );

    return { elementos, areaGroups, totalsSolicitado, totalsAprobado };
  }, [items]);

  const activeItem = popup ? items.find(i => i.id === popup.itemId) ?? null : null;

  const toggleArea = (area: string) => {
    if (editingArea?.area === area) return;
    setCollapsedAreas(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  /* ── Rename area ── */
  const startEditArea = (area: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArea({ area, value: area });
  };
  const commitAreaRename = (oldArea: string) => {
    if (!editingArea) return;
    onRenameArea(oldArea, editingArea.value);
    setEditingArea(null);
  };

  /* ── Rename person ── */
  const startEditPerson = (area: string, person: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPerson({ area, person, value: person });
  };
  const commitPersonRename = (area: string, oldPerson: string) => {
    if (!editingPerson) return;
    onRenameSolicitante(area, oldPerson, editingPerson.value);
    setEditingPerson(null);
  };

  /* ── Delete cell ── */
  const handleCellDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  /* ── Popup (aprobación) ── */
  const openPopup = (item: TechItem, e: React.MouseEvent<HTMLTableCellElement>) => {
    if (!canApprove) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const popupW = 265;
    const popupEstH = 230;
    const top  = rect.bottom + 4 + popupEstH > window.innerHeight
      ? Math.max(8, rect.top - popupEstH - 4)
      : rect.bottom + 4;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupW - 10));
    setPopup({ itemId: item.id, top, left });
    setLocalComment(item.comentarioGerencia ?? '');
  };

  const closePopup = () => {
    if (popup && activeItem) {
      if (localComment !== (activeItem.comentarioGerencia ?? ''))
        onUpdateItem(popup.itemId, { comentarioGerencia: localComment });
    }
    setPopup(null);
  };

  const applyStatus = (estado: ApprovalStatus) => {
    if (!activeItem) return;
    let cantidadAprobada = activeItem.cantidadAprobada;
    if (estado === 'Aprobado') cantidadAprobada = activeItem.cantidadSolicitada;
    if (estado === 'Negado') cantidadAprobada = 0;
    if (estado === 'Aprobado parcial' && cantidadAprobada === 0)
      cantidadAprobada = Math.min(1, activeItem.cantidadSolicitada);
    onUpdateItem(activeItem.id, { estado, cantidadAprobada, comentarioGerencia: localComment });
  };

  const changeQty = (rawValue: string) => {
    if (!activeItem) return;
    const value = Math.max(0, Math.min(Number(rawValue) || 0, activeItem.cantidadSolicitada));
    const estado: ApprovalStatus =
      value === activeItem.cantidadSolicitada ? 'Aprobado' : value > 0 ? 'Aprobado parcial' : 'Negado';
    onUpdateItem(activeItem.id, { cantidadAprobada: value, estado });
  };

  useEffect(() => {
    if (!popup) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) closePopup();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  });

  useEffect(() => {
    if (!popup) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  const colSpan = 2 + elementos.length;

  return (
    <div className="grid-view-wrap">
      <div className="grid-view-scroll">
        <table className="grid-table">
          <thead>
            <tr>
              <th className="gv-th gv-col-area">Área</th>
              <th className="gv-th gv-col-user">Usuarios</th>
              {elementos.map(el => (
                <th key={el} className="gv-th gv-col-item" title={el}>{shorten(el)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areaGroups.map(({ area, userRows }) => {
              const isCollapsed = collapsedAreas.has(area);
              const areaItems   = items.filter(i => i.area === area);
              const reviewed    = areaItems.filter(i => i.estado !== 'Pendiente').length;
              const aprobados   = areaItems.filter(i => i.estado === 'Aprobado').length;
              const parciales   = areaItems.filter(i => i.estado === 'Aprobado parcial').length;
              const negados     = areaItems.filter(i => i.estado === 'Negado').length;

              return (
                <React.Fragment key={area}>
                  {/* Cabecera de área */}
                  <tr className="gv-area-group-row">
                    <td colSpan={colSpan} className="gv-area-group-cell">
                      <button
                        className="gv-area-toggle"
                        onClick={() => toggleArea(area)}
                        aria-expanded={!isCollapsed}
                      >
                        <span className={`gv-area-chevron${isCollapsed ? ' collapsed' : ''}`}>▼</span>

                        {editingArea?.area === area ? (
                          <input
                            className="gv-area-rename-input"
                            value={editingArea.value}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setEditingArea(prev => prev ? { ...prev, value: e.target.value } : null)}
                            onBlur={() => commitAreaRename(area)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { commitAreaRename(area); }
                              if (e.key === 'Escape') setEditingArea(null);
                              e.stopPropagation();
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="gv-area-label-row">
                            <strong>{area}</strong>
                            <button
                              className="gv-rename-btn"
                              onClick={e => startEditArea(area, e)}
                              title="Renombrar área"
                              aria-label={`Renombrar ${area}`}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          </span>
                        )}

                        <span className="gv-area-meta">
                          {userRows.length} {userRows.length === 1 ? 'usuario' : 'usuarios'} · {areaItems.length} ítems
                        </span>
                        {reviewed > 0 && (
                          <span className="gv-area-badges">
                            {aprobados > 0 && <span className="gv-badge gv-badge-apr">{aprobados} apr.</span>}
                            {parciales > 0 && <span className="gv-badge gv-badge-parc">{parciales} parc.</span>}
                            {negados   > 0 && <span className="gv-badge gv-badge-neg">{negados} neg.</span>}
                          </span>
                        )}
                        <span className={`gv-area-progress${reviewed === areaItems.length ? ' complete' : ''}`}>
                          {reviewed}/{areaItems.length}
                        </span>
                      </button>
                    </td>
                  </tr>

                  {/* Filas de usuarios */}
                  {!isCollapsed && userRows.map(({ solicitante, byEl }) => (
                    <tr key={`${area}|||${solicitante}`}>
                      <td className="gv-td gv-cell-area">{area}</td>
                      <td className="gv-td gv-cell-user">
                        {editingPerson?.area === area && editingPerson.person === solicitante ? (
                          <input
                            className="gv-person-rename-input"
                            value={editingPerson.value}
                            onChange={e => setEditingPerson(prev => prev ? { ...prev, value: e.target.value } : null)}
                            onBlur={() => commitPersonRename(area, solicitante)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitPersonRename(area, solicitante);
                              if (e.key === 'Escape') setEditingPerson(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="gv-user-label-row">
                            <span className="gv-user-name">{solicitante}</span>
                            <button
                              className="gv-rename-btn gv-person-rename-btn"
                              onClick={e => startEditPerson(area, solicitante, e)}
                              title="Renombrar persona"
                              aria-label={`Renombrar ${solicitante}`}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="gv-edit-item-btn"
                              onClick={() => {
                                const firstItem = Array.from(byEl.values())[0];
                                if (firstItem) onOpenEditModal(firstItem);
                              }}
                              title="Editar solicitud"
                              aria-label={`Editar solicitud de ${solicitante}`}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                              </svg>
                            </button>
                          </span>
                        )}
                      </td>
                      {elementos.map(el => {
                        const item = byEl.get(el);
                        if (!item) {
                          return (
                            <td
                              key={el}
                              className="gv-td gv-cell-val gv-empty gv-clickable"
                              title={`Agregar ${el} para ${solicitante}`}
                              onClick={() => setAddModal({ area, solicitante, elemento: el })}
                            >
                              <span className="gv-empty-add">+</span>
                            </td>
                          );
                        }
                        const isActive    = popup?.itemId === item.id;
                        const isPendingDel = pendingDelete.has(item.id);
                        return (
                          <td
                            key={el}
                            className={`gv-td gv-cell-val gv-has-item gv-has-delete ${ESTADO_CLASS[item.estado]}${canApprove ? ' gv-clickable' : ''}${isActive ? ' gv-active-cell' : ''}`}
                            title={canApprove ? `${item.elemento} · ${item.estado} — clic para revisar` : item.estado}
                            onClick={canApprove ? e => openPopup(item, e) : undefined}
                          >
                            <span className="gv-qty">{item.cantidadSolicitada}</span>
                            {item.estado !== 'Pendiente' && (
                              <span className="gv-status-icon">
                                {item.estado === 'Aprobado' ? '✓' : item.estado === 'Negado' ? '✗' : '½'}
                              </span>
                            )}
                            <button
                              className={`gv-cell-delete-btn${isPendingDel ? ' gv-delete-pending' : ''}`}
                              onClick={e => handleCellDelete(item.id, e)}
                              title={isPendingDel ? 'Confirmar eliminación' : 'Eliminar registro'}
                              aria-label={`Eliminar ${item.elemento}`}
                            >
                              {isPendingDel ? '?' : '×'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="gv-total-row">
              <td className="gv-td gv-total-label" colSpan={2}>Total</td>
              {elementos.map((_, i) => (
                <td key={i} className="gv-td gv-cell-total">
                  <span className="gv-tot-apr">{totalsAprobado[i]}</span>
                  <span className="gv-tot-sep">/</span>
                  <span className="gv-tot-sol">{totalsSolicitado[i]}</span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Popup de decisión */}
      {popup && activeItem && (
        <div
          ref={popupRef}
          className="gv-popup"
          style={{ top: popup.top, left: popup.left }}
          role="dialog"
          aria-label={`Decisión: ${activeItem.elemento}`}
        >
          <div className="gv-popup-header">
            <span>
              <strong>{activeItem.elemento}</strong>
              <small>{activeItem.solicitante} · Solicita: <b>{activeItem.cantidadSolicitada}</b></small>
            </span>
            <button className="gv-popup-close" onClick={closePopup} aria-label="Cerrar">✕</button>
          </div>

          <div className="gv-popup-btns">
            {(['Aprobado', 'Aprobado parcial', 'Negado'] as ApprovalStatus[]).map(status => (
              <button
                key={status}
                className={`gv-popup-btn gv-pbtn-${status.replace(' ', '-').toLowerCase()}${activeItem.estado === status ? ' active' : ''}`}
                onClick={() => applyStatus(status)}
              >
                {status === 'Aprobado' ? 'Aprobada' : status === 'Aprobado parcial' ? 'Parcial' : 'Negada'}
              </button>
            ))}
          </div>

          {activeItem.estado === 'Aprobado parcial' && (
            <label className="gv-popup-qty">
              <span>Cantidad aprobada</span>
              <input
                type="number"
                min={0}
                max={activeItem.cantidadSolicitada}
                value={activeItem.cantidadAprobada}
                onChange={e => changeQty(e.target.value)}
              />
            </label>
          )}

          <label className="gv-popup-obs">
            <span>Observación</span>
            <textarea
              value={localComment}
              onChange={e => setLocalComment(e.target.value)}
              onBlur={() => onUpdateItem(activeItem.id, { comentarioGerencia: localComment })}
              placeholder="Comentario opcional…"
              rows={2}
            />
          </label>
        </div>
      )}

      {/* Modal agregar desde celda vacía */}
      {addModal && (
        <ItemFormModal
          mode="add"
          existingAreas={existingAreas}
          defaultArea={addModal.area}
          defaultSolicitante={addModal.solicitante}
          defaultElemento={addModal.elemento}
          onSubmit={data => { onAddItem(data); setAddModal(null); }}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
};

export default GridView;
