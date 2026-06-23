import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { ApprovalStatus, TechItem } from '../types';
import '../styles/GridView.css';

const SHORT: Record<string, string> = {
  'Teclado': 'teclado',
  'Base para portátil': 'base',
  'Mouse': 'mouse',
  'Mousepad': 'mousepad',
  'PC / Laptop': 'pc-laptop',
  'Pantalla': 'pantalla',
  'PC All in One': 'PC-AllinOne',
};

function shorten(el: string) {
  return SHORT[el] ?? el.slice(0, 10);
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

const GridView: React.FC<GridViewProps> = ({ items, readOnly, onUpdateItem }) => {
  const [popup, setPopup] = useState<PopupPos | null>(null);
  const [localComment, setLocalComment] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  const { elementos, rows, totals } = useMemo(() => {
    const elementoSet = new Set<string>();
    items.forEach(i => elementoSet.add(i.elemento));
    const elementos = Array.from(elementoSet);

    const map = new Map<string, { area: string; solicitante: string; byEl: Map<string, TechItem> }>();
    items.forEach(item => {
      const key = `${item.area}|||${item.solicitante}`;
      if (!map.has(key)) map.set(key, { area: item.area, solicitante: item.solicitante, byEl: new Map() });
      map.get(key)!.byEl.set(item.elemento, item);
    });

    const totals = elementos.map(el =>
      items.filter(i => i.elemento === el).reduce((s, i) => s + i.cantidadSolicitada, 0)
    );

    return { elementos, rows: Array.from(map.values()), totals };
  }, [items]);

  const activeItem = popup ? items.find(i => i.id === popup.itemId) ?? null : null;

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
            {rows.map(({ area, solicitante, byEl }) => (
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
          </tbody>
          <tfoot>
            <tr className="gv-total-row">
              <td className="gv-td" colSpan={2}>total</td>
              {totals.map((t, i) => (
                <td key={i} className="gv-td gv-cell-total">{t}</td>
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
              <span>Cant. aprobada</span>
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
