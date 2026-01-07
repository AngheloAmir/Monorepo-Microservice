import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UserCard from './UserCard';

describe('UserCard Component', () => {
  it('renders name and email correctly', () => {
    const props = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    render(<UserCard {...props} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    // Admin badge should not be present by default
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('shows Admin badge when isAdmin is true', () => {
    const props = {
      name: 'Jane Admin',
      email: 'jane@example.com',
      isAdmin: true
    };
    
    render(<UserCard {...props} />);
    
    expect(screen.getByText('Jane Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
