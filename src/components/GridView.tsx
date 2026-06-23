import React, { useMemo } from 'react';
import type { TechItem } from '../types';
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

interface GridViewProps {
  items: TechItem[];
}

const GridView: React.FC<GridViewProps> = ({ items }) => {
  const { elementos, rows, totals } = useMemo(() => {
    const elementoSet = new Set<string>();
    items.forEach(i => elementoSet.add(i.elemento));
    const elementos = Array.from(elementoSet);

    // Build rows: one per [area, solicitante]
    const map = new Map<string, { area: string; solicitante: string; byEl: Map<string, number> }>();
    items.forEach(item => {
      const key = `${item.area}|||${item.solicitante}`;
      if (!map.has(key)) {
        map.set(key, { area: item.area, solicitante: item.solicitante, byEl: new Map() });
      }
      map.get(key)!.byEl.set(item.elemento, item.cantidadSolicitada);
    });

    const rows = Array.from(map.values());

    const totals = elementos.map(el =>
      items.filter(i => i.elemento === el).reduce((s, i) => s + i.cantidadSolicitada, 0)
    );

    return { elementos, rows, totals };
  }, [items]);

  return (
    <div className="grid-view-wrap">
      <div className="grid-view-scroll">
        <table className="grid-table">
          <thead>
            <tr>
              <th className="gv-th gv-col-area">Área</th>
              <th className="gv-th gv-col-user">Usuarios</th>
              {elementos.map(el => (
                <th key={el} className="gv-th gv-col-item" title={el}>
                  {shorten(el)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ area, solicitante, byEl }) => (
              <tr key={`${area}|||${solicitante}`}>
                <td className="gv-td gv-cell-area">{area}</td>
                <td className="gv-td gv-cell-user">{solicitante}</td>
                {elementos.map(el => {
                  const qty = byEl.get(el) ?? 0;
                  return (
                    <td key={el} className={`gv-td gv-cell-val ${qty > 0 ? 'gv-has' : 'gv-empty'}`}>
                      {qty}
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
    </div>
  );
};

export default GridView;
