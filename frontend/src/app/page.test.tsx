import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renders hello world heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World!');
  });

  it('renders description text', () => {
    render(<Home />);
    expect(screen.getByText('Next.js is working')).toBeInTheDocument();
  });
});