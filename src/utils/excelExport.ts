import * as XLSX from 'xlsx';
import type { TechItem } from '../types';

const columns = [
  { label: 'N°', width: 6 },
  { label: 'Área', width: 24 },
  { label: 'Solicitante', width: 28 },
  { label: 'Categoría', width: 24 },
  { label: 'Elemento', width: 30 },
  { label: 'Cantidad solicitada', width: 19 },
  { label: 'Decisión de Gerencia', width: 22 },
  { label: 'Cantidad aprobada', width: 19 },
  { label: 'Prioridad', width: 12 },
  { label: 'Justificación / necesidad', width: 52 },
  { label: 'Comentario de Gerencia', width: 42 },
];

function createDetailSheet(items: TechItem[], title: string, subtitle: string): XLSX.WorkSheet {
  const date = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const rows = items.map((item, index) => [
    index + 1,
    item.area,
    item.solicitante,
    item.categoria,
    item.elemento,
    item.cantidadSolicitada,
    item.estado,
    item.cantidadAprobada,
    item.prioridad,
    item.justificacion,
    item.comentarioGerencia || '',
  ]);

  const totalRequested = items.reduce((sum, item) => sum + item.cantidadSolicitada, 0);
  const totalApproved = items.reduce((sum, item) => sum + item.cantidadAprobada, 0);
  const data = [
    [title],
    [subtitle],
    [`Fecha de generación: ${date}`],
    ['Responsable: Departamento de Tecnología'],
    [],
    columns.map((column) => column.label),
    ...rows,
    [],
    ['', '', '', '', 'TOTALES', totalRequested, '', totalApproved, '', '', ''],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = columns.map((column) => ({ wch: column.width }));
  sheet['!autofilter'] = { ref: `A6:K${Math.max(6, rows.length + 6)}` };
  sheet['!freeze'] = { xSplit: 0, ySplit: 6 };
  return sheet;
}

export function exportToExcel(items: TechItem[]): void {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    createDetailSheet(
      items,
      'CONSOLIDADO APROBADO POR GERENCIA — PARA COMPRAS',
      'Incluye únicamente solicitudes aprobadas total o parcialmente por Gerencia.'
    ),
    'Aprobados Gerencia'
  );

  const totalAprobadas   = items.filter(i => i.estado === 'Aprobado').length;
  const totalParciales   = items.filter(i => i.estado === 'Aprobado parcial').length;
  const summaryData = [
    ['RESUMEN DE APROBACIÓN GERENCIAL'],
    [],
    ['Áreas con ítems aprobados', new Set(items.map(i => i.area)).size],
    ['Solicitantes con aprobación', new Set(items.map(i => `${i.area}|${i.solicitante}`)).size],
    ['Total ítems aprobados', items.length],
    ['  Aprobación total', totalAprobadas],
    ['  Aprobación parcial', totalParciales],
    [],
    ['Cantidad total solicitada', items.reduce((s, i) => s + i.cantidadSolicitada, 0)],
    ['Cantidad total aprobada',   items.reduce((s, i) => s + i.cantidadAprobada,   0)],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 34 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  XLSX.writeFile(workbook, 'aprobados_gerencia_viabilidad.xlsx');
}
