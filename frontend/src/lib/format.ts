import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDateTime = (value?: string) => (value ? format(new Date(value), "dd/MM/yyyy 'às' HH:mm") : '—');

export const formatTime = (value?: string) => (value ? format(new Date(value), 'HH:mm') : '');

export const formatRelative = (value?: string) =>
    value ? formatDistanceToNow(new Date(value), { addSuffix: true, locale: ptBR }) : '—';

export const shortId = (id: string) => id.substring(0, 8).toUpperCase();
