import React from 'react';

interface DateFormatterProps {
  timestamp: string | number | Date;
  format?: 'date' | 'time' | 'datetime';
}

export const DateFormatter: React.FC<DateFormatterProps> = ({
  timestamp,
  format = 'date',
}) => {
  if (!timestamp) return <span>—</span>;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return <span>{String(timestamp)}</span>;

  if (format === 'time') {
    return <span>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
  }
  if (format === 'datetime') {
    return <span>{d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>;
  }

  return <span>{d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
};

export default DateFormatter;
