import { format, parseISO, differenceInDays } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  try { return format(parseISO(date), 'dd MMM yyyy'); }
  catch { return date; }
};

export const formatDateShort = (date) => {
  if (!date) return '—';
  try { return format(parseISO(date), 'dd/MM/yy'); }
  catch { return date; }
};

export const daysSince = (date) => {
  if (!date) return 0;
  try { return differenceInDays(new Date(), parseISO(date)); }
  catch { return 0; }
};

export const getRiskLevel = (count) => {
  if (count >= 5) return { level: 'high',   label: 'High Risk',   color: 'text-red-600',    bg: 'bg-red-50',    badge: 'badge-high' };
  if (count >= 3) return { level: 'medium', label: 'Medium Risk', color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'badge-med' };
  return           { level: 'low',    label: 'Low Risk',    color: 'text-green-600',  bg: 'bg-green-50',  badge: 'badge-low' };
};

export const getStatusBadge = (status) => {
  return status === 'Sick'
    ? { class: 'badge-sick', color: '#CC0000' }
    : { class: 'badge-fit',  color: '#006600' };
};

export const numberWithCommas = (n) =>
  n?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';

export const getTrendIcon = (value) => {
  if (value > 0) return { icon: '↑', color: 'text-red-500' };
  if (value < 0) return { icon: '↓', color: 'text-green-500' };
  return { icon: '→', color: 'text-gray-400' };
};

export const CHART_COLORS = [
  '#003366', '#0066CC', '#3399FF', '#66B2FF',
  '#FF6B6B', '#FF9F43', '#1DD1A1', '#A29BFE',
  '#FD79A8', '#FDCB6E', '#6C5CE7', '#00B894'
];
