import React from 'react';

export const Card = ({ title, children, style }: { title?: string; children: React.ReactNode, style?: React.CSSProperties }) => {
  return (
    <div style={{
      border: '1px solid rgba(75, 85, 99, 0.4)', // gray-600/40
      borderRadius: '12px',
      padding: '24px',
      backgroundColor: 'rgba(31, 41, 55, 0.5)', // gray-800/50
      color: '#e5e7eb', // gray-200
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(8px)',
      ...style
    }}>
      {title && <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem' }}>{title}</h3>}
      <div>{children}</div>
    </div>
  );
};
