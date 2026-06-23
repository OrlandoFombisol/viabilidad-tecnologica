import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { ApprovalStatus, TechItem } from '../types';
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
  readOnly: boolean;
  onUpdateItem: (id: string, changes: Partial<TechItem>) => void;
}

interface PopupPos { itemId: string; top: number; left: number; }

interface AreaGroup {
  area: string;
  userRows: Array<{ solicitante: string; byEl: Map<string, TechItem> }>;
}

const GridView: React.FC<GridViewProps> = ({ items, readOnly, onUpdateItem }) => {
  const [popup, setPopup] = useState<PopupPos | null>(null);
  const [localComment, setLocalComment] = useState('');
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(
    () => new Set(items.map(i => i.area))
  );
  const popupRef = useRef<HTMLDivElement>(null);

  const { elementos, areaGroups, totalsSolicitado, totalsAprobado } = useMemo(() => {
    const elementoSet = new Set<string>();
    items.forEach(i => elementoSet.add(i.elemento));
    const elementos = Array.from(elementoSet);

    // Group by area → user
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
    setCollapsedAreas(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const openPopup = (item: TechItem, e: React.MouseEvent<HTMLTableCellElement>) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const popupW = 265;
    const popupEstH = 230;
    const top = rect.bottom + 4 + popupEstH > window.innerHeight
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
              const areaItems = items.filter(i => i.area === area);
              const reviewed  = areaItems.filter(i => i.estado !== 'Pendiente').length;
              const aprobados = areaItems.filter(i => i.estado === 'Aprobado').length;
              const parciales = areaItems.filter(i => i.estado === 'Aprobado parcial').length;
              const negados   = areaItems.filter(i => i.estado === 'Negado').length;

              return (
                <React.Fragment key={area}>
                  {/* Area group header */}
                  <tr className="gv-area-group-row">
                    <td colSpan={colSpan} className="gv-area-group-cell">
                      <button
                        className="gv-area-toggle"
                        onClick={() => toggleArea(area)}
                        aria-expanded={!isCollapsed}
                      >
                        <span className={`gv-area-chevron${isCollapsed ? ' collapsed' : ''}`}>▼</span>
                        <strong>{area}</strong>
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

                  {/* User rows */}
                  {!isCollapsed && userRows.map(({ solicitante, byEl }) => (
                    <tr key={`${area}|||${solicitante}`}>
                      <td className="gv-td gv-cell-area">{area}</td>
                      <td className="gv-td gv-cell-user">{solicitante}</td>
                      {elementos.map(el => {
                        const item = byEl.get(el);
                        if (!item) {
                          return <td key={el} className="gv-td gv-cell-val gv-empty">—</td>;
                        }
                        const isActive = popup?.itemId === item.id;
                        return (
                          <td
                            key={el}
                            className={`gv-td gv-cell-val gv-has-item ${ESTADO_CLASS[item.estado]}${!readOnly ? ' gv-clickable' : ''}${isActive ? ' gv-active-cell' : ''}`}
                            title={!readOnly ? `${item.elemento} · ${item.estado} — clic para revisar` : item.estado}
                            onClick={!readOnly ? (e) => openPopup(item, e) : undefined}
                          >
                            <span className="gv-qty">{item.cantidadSolicitada}</span>
                            {item.estado !== 'Pendiente' && (
                              <span className="gv-status-icon">
                                {item.estado === 'Aprobado' ? '✓' : item.estado === 'Negado' ? '✗' : '½'}
                              </span>
                            )}
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
                onChange={(e) => changeQty(e.target.value)}
              />
            </label>
          )}

          <label className="gv-popup-obs">
            <span>Observación</span>
            <textarea
              value={localComment}
              onChange={(e) => setLocalComment(e.target.value)}
              onBlur={() => onUpdateItem(activeItem.id, { comentarioGerencia: localComment })}
              placeholder="Comentario opcional…"
              rows={2}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default GridView;
