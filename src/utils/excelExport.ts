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
  const approved = items.filter(
    (item) => item.estado === 'Aprobado' || item.estado === 'Aprobado parcial'
  );

  XLSX.utils.book_append_sheet(
    workbook,
    createDetailSheet(
      items,
      'REVISIÓN COMPLETA DE VIABILIDAD TECNOLÓGICA',
      'Incluye todas las áreas, solicitantes y decisiones, incluso las pendientes.'
    ),
    'Revisión completa'
  );

  if (approved.length > 0) {
    XLSX.utils.book_append_sheet(
      workbook,
      createDetailSheet(
        approved,
        'CONSOLIDADO APROBADO PARA COMPRAS',
        'Incluye únicamente solicitudes aprobadas total o parcialmente por Gerencia.'
      ),
      'Aprobados Compras'
    );
  }

  const summaryData = [
    ['RESUMEN DE LA REVISIÓN'],
    [],
    ['Áreas incluidas', new Set(items.map((item) => item.area)).size],
    ['Solicitantes incluidos', new Set(items.map((item) => `${item.area}|${item.solicitante}`)).size],
    ['Solicitudes evaluadas', items.length],
    ['Aprobadas', items.filter((item) => item.estado === 'Aprobado').length],
    ['Aprobadas parcialmente', items.filter((item) => item.estado === 'Aprobado parcial').length],
    ['Negadas', items.filter((item) => item.estado === 'Negado').length],
    ['Pendientes', items.filter((item) => item.estado === 'Pendiente').length],
    [],
    ['Cantidad total solicitada', items.reduce((sum, item) => sum + item.cantidadSolicitada, 0)],
    ['Cantidad total aprobada', items.reduce((sum, item) => sum + item.cantidadAprobada, 0)],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 34 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  XLSX.writeFile(workbook, 'revision_viabilidad_tecnologica_completa.xlsx');
}
