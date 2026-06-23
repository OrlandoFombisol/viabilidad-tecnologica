import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import type { TechItem, Priority } from '../types';
import '../styles/ImportExcelButton.css';

type NewItem = Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>;

const PRIORIDADES: Priority[] = ['Alta', 'Media', 'Baja'];

function normalizeHeader(h: unknown): string {
  return String(h ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function colIdx(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.findIndex(h => h.includes(c));
    if (i >= 0) return i;
  }
  return -1;
}

function parseRows(arrayBuffer: ArrayBuffer): { items: NewItem[]; errors: string[] } {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  if (raw.length < 2) return { items: [], errors: ['El archivo está vacío o no tiene filas de datos.'] };

  const headers = (raw[0] as unknown[]).map(normalizeHeader);
  const iArea   = colIdx(headers, 'area');
  const iSol    = colIdx(headers, 'solicitante');
  const iEl     = colIdx(headers, 'elemento');
  const iCat    = colIdx(headers, 'categ');
  const iPri    = colIdx(headers, 'prioridad');
  const iCant   = colIdx(headers, 'cantidad', 'cant');
  const iJust   = colIdx(headers, 'justif');

  if (iArea < 0 || iSol < 0 || iEl < 0) {
    return { items: [], errors: ['Columnas requeridas no encontradas. Verifica el ejemplo descargable.'] };
  }

  const items: NewItem[] = [];
  const errors: string[] = [];

  raw.slice(1).forEach((row, idx) => {
    const r = row as unknown[];
    const get = (i: number) => i >= 0 ? String(r[i] ?? '').trim() : '';
    const area  = get(iArea);
    const sol   = get(iSol);
    const el    = get(iEl);
    if (!area || !sol || !el) {
      errors.push(`Fila ${idx + 2}: área, solicitante y elemento son obligatorios.`);
      return;
    }
    const priRaw  = get(iPri);
    const prioridad: Priority = PRIORIDADES.includes(priRaw as Priority) ? priRaw as Priority : 'Media';
    const cantRaw = parseInt(get(iCant)) || 1;
    items.push({
      area,
      solicitante: sol,
      elemento: el,
      categoria: get(iCat) || 'General',
      prioridad,
      cantidadSolicitada: Math.max(1, cantRaw),
      justificacion: get(iJust) || 'Importado desde Excel',
      urgente: false,
    });
  });

  return { items, errors };
}

function downloadSample() {
  const data = [
    ['Área', 'Solicitante', 'Elemento', 'Categoría', 'Prioridad', 'Cantidad', 'Justificación'],
    ['Contabilidad', 'María López', 'Mouse', 'Puesto de trabajo', 'Alta', 1, 'Reposición por daño en equipo actual'],
    ['Gestión Humana', 'Carlos Ruiz', 'Teclado', 'Puesto de trabajo', 'Media', 2, 'Dotación para nuevos empleados'],
    ['TI', 'Ana Torres', 'PC / Laptop', 'Equipo de cómputo', 'Alta', 1, 'Equipo con más de 5 años de uso'],
    ['Dirección', 'Pedro Soto', 'Pantalla', 'Equipo de cómputo', 'Media', 1, 'Segunda pantalla para trabajo de análisis'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Ancho de columnas
  ws['!cols'] = [18, 20, 18, 22, 12, 10, 40].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');
  XLSX.writeFile(wb, 'ejemplo-viabilidad.xlsx');
}

interface Props {
  onAddItem: (data: NewItem) => void;
}

const ImportExcelButton: React.FC<Props> = ({ onAddItem }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileRef.current) return;
    fileRef.current.value = '';
    if (!file) return;
    setImporting(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const { items, errors } = parseRows(ev.target!.result as ArrayBuffer);
        items.forEach(item => onAddItem(item));
        if (items.length > 0) {
          setStatus({ type: 'ok', msg: `${items.length} ítem${items.length > 1 ? 's' : ''} importado${items.length > 1 ? 's' : ''} correctamente.${errors.length > 0 ? ` (${errors.length} fila${errors.length > 1 ? 's' : ''} omitida${errors.length > 1 ? 's' : ''})` : ''}` });
        } else {
          setStatus({ type: 'err', msg: errors[0] ?? 'No se encontraron datos válidos.' });
        }
      } catch {
        setStatus({ type: 'err', msg: 'Error al leer el archivo. Asegúrate de que sea un archivo .xlsx o .xls válido.' });
      }
      setImporting(false);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="ieb-section">
      <div className="ieb-header">
        <div className="ieb-title-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span className="ieb-title">Importar desde Excel</span>
        </div>
        <p className="ieb-desc">
          Sube un archivo <strong>.xlsx</strong> con las columnas: <em>Área, Solicitante, Elemento, Categoría, Prioridad, Cantidad, Justificación</em>.
          Los ítems se agregarán a la tabla actual.
        </p>
      </div>

      <div className="ieb-actions">
        <button className="btn ieb-btn-import" onClick={() => fileRef.current?.click()} disabled={importing}>
          {importing ? (
            <><span className="ieb-spinner" /> Importando…</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Subir archivo Excel
            </>
          )}
        </button>
        <button className="btn ieb-btn-sample" onClick={downloadSample}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar ejemplo
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      {status && (
        <div className={`ieb-feedback ${status.type === 'ok' ? 'ieb-ok' : 'ieb-error'}`}>
          {status.type === 'ok'
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
          {status.msg}
        </div>
      )}

      {/* Referencia rápida de columnas */}
      <div className="ieb-example-preview">
        <span className="ieb-ex-label">Formato esperado:</span>
        <div className="ieb-ex-scroll">
          <table className="ieb-ex-table">
            <thead>
              <tr>
                {['Área *', 'Solicitante *', 'Elemento *', 'Categoría', 'Prioridad', 'Cantidad', 'Justificación'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Contabilidad</td>
                <td>María López</td>
                <td>Mouse</td>
                <td>Puesto de trabajo</td>
                <td>Alta</td>
                <td>1</td>
                <td>Reposición por daño</td>
              </tr>
              <tr>
                <td>TI</td>
                <td>Ana Torres</td>
                <td>PC / Laptop</td>
                <td>Equipo de cómputo</td>
                <td>Alta</td>
                <td>1</td>
                <td>Equipo obsoleto</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="ieb-ex-note">* Campos obligatorios. Prioridad: Alta / Media / Baja. Si se omite Categoría o Justificación se asigna un valor por defecto.</p>
      </div>
    </div>
  );
};

export default ImportExcelButton;
