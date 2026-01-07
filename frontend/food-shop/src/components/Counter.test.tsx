import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Counter from './Counter';

describe('Counter Component', () => {
  it('renders correctly', () => {
    render(<Counter />);
    expect(screen.getByText('Counter')).toBeInTheDocument();
    expect(screen.getByText('Current Count: 0')).toBeInTheDocument();
  });

  it('increments count when Increment button is clicked', () => {
    render(<Counter />);
    const incrementButton = screen.getByText('Increment');
    
    fireEvent.click(incrementButton);
    
    expect(screen.getByText('Current Count: 1')).toBeInTheDocument();
  });

  it('decrements count when Decrement button is clicked', () => {
    render(<Counter />);
    const decrementButton = screen.getByText('Decrement');
    
    fireEvent.click(decrementButton);
    
    expect(screen.getByText('Current Count: -1')).toBeInTheDocument();
  });
});
