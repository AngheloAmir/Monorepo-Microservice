import React from 'react';

export const Header = ({ title, children }: { title: string; children?: React.ReactNode }) => {
  return (
    <header style={{
      background: 'rgba(17, 24, 39, 0.8)', // gray-900 with opacity
      backdropFilter: 'blur(12px)',
      color: '#f3f4f6', // gray-100
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(75, 85, 99, 0.4)', // gray-600/40
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h1>
      <div style={{ display: 'flex', gap: '1rem' }}>{children}</div>
    </header>
  );
};
