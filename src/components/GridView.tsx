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
function shorten(el: string) { return SHORT[el] ?? el.slice(0, 12); }

const ESTADO_CLASS: Record<ApprovalStatus, string> = {
  Pendiente: 'gv-pendiente', Aprobado: 'gv-aprobado',
  'Aprobado parcial': 'gv-parcial', Negado: 'gv-negado',
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
interface AreaGroup { area: string; userRows: Array<{ solicitante: string; byEl: Map<string, TechItem> }>; }

function loadOrder(key: string): string[] {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) as string[] : []; } catch { return []; }
}
function saveOrder(key: string, order: string[]) {
  try { localStorage.setItem(key, JSON.stringify(order)); } catch { /* ignore */ }
}

const COL_ORDER_KEY  = 'vt_col_order';
const AREA_ORDER_KEY = 'vt_area_order';

const GridView: React.FC<GridViewProps> = ({
  items, canApprove, onUpdateItem, onAddItem, onDeleteItem,
  onRenameArea, onRenameSolicitante, onOpenEditModal, existingAreas,
}) => {
  // ── Ordering (persisted) ──
  const [columnOrder, setColumnOrder] = useState<string[]>(() => loadOrder(COL_ORDER_KEY));
  const [areaOrder,   setAreaOrder]   = useState<string[]>(() => loadOrder(AREA_ORDER_KEY));

  // ── Drag state — columns ──
  const [dragCol,     setDragCol]     = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // ── Drag state — area rows ──
  const [dragArea,     setDragArea]     = useState<string | null>(null);
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);

  // ── Other UI state ──
  const [popup,         setPopup]         = useState<PopupPos | null>(null);
  const [localComment,  setLocalComment]  = useState('');
  const [addModal,      setAddModal]      = useState<{ area: string; solicitante: string; elemento: string } | null>(null);
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(() => new Set(items.map(i => i.area)));
  const [pendingDelete,  setPendingDelete]  = useState<Set<string>>(new Set());
  const [editingArea,    setEditingArea]    = useState<{ area: string; value: string } | null>(null);
  const [editingPerson,  setEditingPerson]  = useState<{ area: string; person: string; value: string } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // ── Derived data with applied ordering ──
  const { elementos, areaGroups, totalsSolicitado, totalsAprobado } = useMemo(() => {
    const elementoSet = new Set<string>();
    items.forEach(i => elementoSet.add(i.elemento));
    const allEls = Array.from(elementoSet);
    const savedEls = columnOrder.filter(c => allEls.includes(c));
    const newEls   = allEls.filter(el => !columnOrder.includes(el));
    const elementos = [...savedEls, ...newEls];

    const areaMap = new Map<string, Map<string, Map<string, TechItem>>>();
    items.forEach(item => {
      if (!areaMap.has(item.area)) areaMap.set(item.area, new Map());
      const um = areaMap.get(item.area)!;
      if (!um.has(item.solicitante)) um.set(item.solicitante, new Map());
      um.get(item.solicitante)!.set(item.elemento, item);
    });
    const allGroups: AreaGroup[] = Array.from(areaMap.entries()).map(([area, um]) => ({
      area,
      userRows: Array.from(um.entries()).map(([solicitante, byEl]) => ({ solicitante, byEl })),
    }));
    const groupMap  = new Map(allGroups.map(g => [g.area, g]));
    const savedAreas = areaOrder.filter(a => groupMap.has(a));
    const newAreas   = allGroups.filter(g => !areaOrder.includes(g.area)).map(g => g.area);
    const areaGroups = [...savedAreas, ...newAreas].map(a => groupMap.get(a)!).filter(Boolean);

    const totalsSolicitado = elementos.map(el =>
      items.filter(i => i.elemento === el).reduce((s, i) => s + i.cantidadSolicitada, 0));
    const totalsAprobado = elementos.map(el =>
      items.filter(i => i.elemento === el).reduce((s, i) => s + (i.cantidadAprobada ?? 0), 0));

    return { elementos, areaGroups, totalsSolicitado, totalsAprobado };
  }, [items, columnOrder, areaOrder]);

  const activeItem = popup ? items.find(i => i.id === popup.itemId) ?? null : null;

  // ── Column drag handlers ──
  const onColDragStart = (el: string) => setDragCol(el);
  const onColDragOver  = (el: string, e: React.DragEvent) => { e.preventDefault(); if (el !== dragCol) setDragOverCol(el); };
  const onColDrop      = (targetEl: string) => {
    if (!dragCol || dragCol === targetEl) { setDragCol(null); setDragOverCol(null); return; }
    const next = [...elementos];
    const fi = next.indexOf(dragCol), ti = next.indexOf(targetEl);
    next.splice(fi, 1); next.splice(ti, 0, dragCol);
    setColumnOrder(next); saveOrder(COL_ORDER_KEY, next);
    setDragCol(null); setDragOverCol(null);
  };
  const onColDragEnd = () => { setDragCol(null); setDragOverCol(null); };

  // ── Area row drag handlers ──
  const onAreaDragStart = (area: string, e: React.DragEvent) => { e.stopPropagation(); setDragArea(area); };
  const onAreaDragOver  = (area: string, e: React.DragEvent) => { e.preventDefault(); if (area !== dragArea) setDragOverArea(area); };
  const onAreaDrop      = (targetArea: string) => {
    if (!dragArea || dragArea === targetArea) { setDragArea(null); setDragOverArea(null); return; }
    const names = areaGroups.map(g => g.area);
    const fi = names.indexOf(dragArea), ti = names.indexOf(targetArea);
    names.splice(fi, 1); names.splice(ti, 0, dragArea);
    setAreaOrder(names); saveOrder(AREA_ORDER_KEY, names);
    setDragArea(null); setDragOverArea(null);
  };
  const onAreaDragEnd = () => { setDragArea(null); setDragOverArea(null); };

  // ── Rename ──
  const startEditArea   = (area: string, e: React.MouseEvent) => { e.stopPropagation(); setEditingArea({ area, value: area }); };
  const commitAreaRename = (oldArea: string) => { if (!editingArea) return; onRenameArea(oldArea, editingArea.value); setEditingArea(null); };
  const startEditPerson = (area: string, person: string, e: React.MouseEvent) => { e.stopPropagation(); setEditingPerson({ area, person, value: person }); };
  const commitPersonRename = (area: string, oldPerson: string) => { if (!editingPerson) return; onRenameSolicitante(area, oldPerson, editingPerson.value); setEditingPerson(null); };

  // ── Delete cell ──
  const handleCellDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingDelete.has(id)) {
      onDeleteItem(id);
      setPendingDelete(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      setPendingDelete(prev => new Set(prev).add(id));
      window.setTimeout(() => setPendingDelete(prev => { const n = new Set(prev); n.delete(id); return n; }), 3500);
    }
  };

  // ── Toggle area ──
  const toggleArea = (area: string) => {
    if (editingArea?.area === area) return;
    setCollapsedAreas(prev => { const n = new Set(prev); n.has(area) ? n.delete(area) : n.add(area); return n; });
  };

  // ── Popup (aprobación) ──
  const openPopup = (item: TechItem, e: React.MouseEvent<HTMLTableCellElement>) => {
    if (!canApprove) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const popupEstH = 230, popupW = 265;
    const top  = rect.bottom + 4 + popupEstH > window.innerHeight ? Math.max(8, rect.top - popupEstH - 4) : rect.bottom + 4;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupW - 10));
    setPopup({ itemId: item.id, top, left });
    setLocalComment(item.comentarioGerencia ?? '');
  };
  const closePopup = () => {
    if (popup && activeItem && localComment !== (activeItem.comentarioGerencia ?? ''))
      onUpdateItem(popup.itemId, { comentarioGerencia: localComment });
    setPopup(null);
  };
  const applyStatus = (estado: ApprovalStatus) => {
    if (!activeItem) return;
    let cantidadAprobada = activeItem.cantidadAprobada;
    if (estado === 'Aprobado') cantidadAprobada = activeItem.cantidadSolicitada;
    if (estado === 'Negado')   cantidadAprobada = 0;
    if (estado === 'Aprobado parcial' && cantidadAprobada === 0) cantidadAprobada = Math.min(1, activeItem.cantidadSolicitada);
    onUpdateItem(activeItem.id, { estado, cantidadAprobada, comentarioGerencia: localComment });
  };
  const changeQty = (rawValue: string) => {
    if (!activeItem) return;
    const value = Math.max(0, Math.min(Number(rawValue) || 0, activeItem.cantidadSolicitada));
    const estado: ApprovalStatus = value === activeItem.cantidadSolicitada ? 'Aprobado' : value > 0 ? 'Aprobado parcial' : 'Negado';
    onUpdateItem(activeItem.id, { cantidadAprobada: value, estado });
  };

  useEffect(() => {
    if (!popup) return;
    const h = (e: MouseEvent) => { if (popupRef.current && !popupRef.current.contains(e.target as Node)) closePopup(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  });
  useEffect(() => {
    if (!popup) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  });

  const colSpan = 2 + elementos.length;

  return (
    <div className="grid-view-wrap">
      <p className="gv-drag-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" style={{verticalAlign:'middle',marginRight:4}}>
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
        </svg>
        Arrastra las cabeceras de columna o las filas de área para cambiar su orden.
      </p>
      <div className="grid-view-scroll">
        <table className="grid-table">
          <thead>
            <tr>
              <th className="gv-th gv-col-area">Área</th>
              <th className="gv-th gv-col-user">Usuarios</th>
              {elementos.map(el => (
                <th
                  key={el}
                  className={`gv-th gv-col-item gv-th-draggable${dragCol === el ? ' gv-col-dragging' : ''}${dragOverCol === el && dragCol !== el ? ' gv-col-drag-over' : ''}`}
                  title={`${el} — arrastra para cambiar posición`}
                  draggable
                  onDragStart={() => onColDragStart(el)}
                  onDragOver={e => onColDragOver(el, e)}
                  onDrop={() => onColDrop(el)}
                  onDragEnd={onColDragEnd}
                >
                  <span className="gv-th-grip" aria-hidden="true">⠿</span>
                  {shorten(el)}
                </th>
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
                  <tr
                    className={`gv-area-group-row${dragArea === area ? ' gv-row-dragging' : ''}${dragOverArea === area && dragArea !== area ? ' gv-row-drag-over' : ''}`}
                    draggable
                    onDragStart={e => onAreaDragStart(area, e)}
                    onDragOver={e => onAreaDragOver(area, e)}
                    onDrop={() => onAreaDrop(area)}
                    onDragEnd={onAreaDragEnd}
                  >
                    <td colSpan={colSpan} className="gv-area-group-cell">
                      <button className="gv-area-toggle" onClick={() => toggleArea(area)} aria-expanded={!isCollapsed}>
                        <span className="gv-area-drag-grip" aria-hidden="true">⠿</span>
                        <span className={`gv-area-chevron${isCollapsed ? ' collapsed' : ''}`}>▼</span>

                        {editingArea?.area === area ? (
                          <input
                            className="gv-area-rename-input"
                            value={editingArea.value}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setEditingArea(prev => prev ? { ...prev, value: e.target.value } : null)}
                            onBlur={() => commitAreaRename(area)}
                            onKeyDown={e => { if (e.key === 'Enter') commitAreaRename(area); if (e.key === 'Escape') setEditingArea(null); e.stopPropagation(); }}
                            autoFocus
                          />
                        ) : (
                          <span className="gv-area-label-row">
                            <strong>{area}</strong>
                            <button className="gv-rename-btn" onClick={e => startEditArea(area, e)} title="Renombrar área">
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
                            onKeyDown={e => { if (e.key === 'Enter') commitPersonRename(area, solicitante); if (e.key === 'Escape') setEditingPerson(null); }}
                            autoFocus
                          />
                        ) : (
                          <span className="gv-user-label-row">
                            <span className="gv-user-name">{solicitante}</span>
                            <button className="gv-rename-btn gv-person-rename-btn" onClick={e => startEditPerson(area, solicitante, e)} title="Renombrar">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button className="gv-edit-item-btn" onClick={() => { const first = Array.from(byEl.values())[0]; if (first) onOpenEditModal(first); }} title="Editar solicitud">
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
                            <td key={el} className="gv-td gv-cell-val gv-empty gv-clickable"
                              title={`Agregar ${el} para ${solicitante}`}
                              onClick={() => setAddModal({ area, solicitante, elemento: el })}>
                              <span className="gv-empty-add">+</span>
                            </td>
                          );
                        }
                        const isPendingDel = pendingDelete.has(item.id);
                        return (
                          <td key={el}
                            className={`gv-td gv-cell-val gv-has-item gv-has-delete ${ESTADO_CLASS[item.estado]}${canApprove ? ' gv-clickable' : ''}${popup?.itemId === item.id ? ' gv-active-cell' : ''}`}
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

      {popup && activeItem && (
        <div ref={popupRef} className="gv-popup" style={{ top: popup.top, left: popup.left }}
          role="dialog" aria-label={`Decisión: ${activeItem.elemento}`}>
          <div className="gv-popup-header">
            <span>
              <strong>{activeItem.elemento}</strong>
              <small>{activeItem.solicitante} · Solicita: <b>{activeItem.cantidadSolicitada}</b></small>
            </span>
            <button className="gv-popup-close" onClick={closePopup} aria-label="Cerrar">✕</button>
          </div>
          <div className="gv-popup-btns">
            {(['Aprobado', 'Aprobado parcial', 'Negado'] as ApprovalStatus[]).map(status => (
              <button key={status}
                className={`gv-popup-btn gv-pbtn-${status.replace(' ', '-').toLowerCase()}${activeItem.estado === status ? ' active' : ''}`}
                onClick={() => applyStatus(status)}>
                {status === 'Aprobado' ? 'Aprobada' : status === 'Aprobado parcial' ? 'Parcial' : 'Negada'}
              </button>
            ))}
          </div>
          {activeItem.estado === 'Aprobado parcial' && (
            <label className="gv-popup-qty">
              <span>Cantidad aprobada</span>
              <input type="number" min={0} max={activeItem.cantidadSolicitada}
                value={activeItem.cantidadAprobada} onChange={e => changeQty(e.target.value)} />
            </label>
          )}
          <label className="gv-popup-obs">
            <span>Observación</span>
            <textarea value={localComment} onChange={e => setLocalComment(e.target.value)}
              onBlur={() => onUpdateItem(activeItem.id, { comentarioGerencia: localComment })}
              placeholder="Comentario opcional…" rows={2} />
          </label>
        </div>
      )}

      {addModal && (
        <ItemFormModal mode="add" existingAreas={existingAreas}
          defaultArea={addModal.area} defaultSolicitante={addModal.solicitante} defaultElemento={addModal.elemento}
          onSubmit={data => { onAddItem(data); setAddModal(null); }}
          onClose={() => setAddModal(null)} />
      )}
    </div>
  );
};

export default GridView;
