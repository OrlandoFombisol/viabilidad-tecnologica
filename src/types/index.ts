export type Priority = 'Alta' | 'Media' | 'Baja';

export type ApprovalStatus = 'Pendiente' | 'Aprobado' | 'Negado' | 'Aprobado parcial';

export type ReportStatus = 'Pendiente de revisión' | 'Aprobado parcialmente' | 'Aprobado' | 'Negado';

export interface TechItem {
  id: string;
  area: string;
  categoria: string;
  elemento: string;
  cantidadSolicitada: number;
  justificacion: string;
  prioridad: Priority;
  estado: ApprovalStatus;
  cantidadAprobada: number;
  comentarioGerencia: string;
  solicitante: string;
  urgente?: boolean;
  ultimoModificadoPor?: string;
  ultimoModificadoAt?: string;
}

export interface SummaryCard {
  elemento: string;
  cantidad: number;
  categoria: string;
}
