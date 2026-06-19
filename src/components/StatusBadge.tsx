import React from 'react';
import type { ApprovalStatus, Priority } from '../types';
import '../styles/StatusBadge.css';

interface StatusBadgeProps {
  status: ApprovalStatus;
}

const statusMap: Record<ApprovalStatus, { label: string; className: string }> = {
  Pendiente:         { label: 'Pendiente de revisión', className: 'badge-pending' },
  Aprobado:          { label: 'Viabilidad aprobada',   className: 'badge-approved' },
  Negado:            { label: 'Viabilidad negada',     className: 'badge-denied' },
  'Aprobado parcial':{ label: 'Aprobación parcial',    className: 'badge-partial' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { label, className } = statusMap[status];
  return <span className={`status-badge ${className}`}>{label}</span>;
};

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityMap: Record<Priority, { className: string }> = {
  Alta:  { className: 'priority-alta' },
  Media: { className: 'priority-media' },
  Baja:  { className: 'priority-baja' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const { className } = priorityMap[priority];
  return <span className={`priority-badge ${className}`}>{priority}</span>;
};
