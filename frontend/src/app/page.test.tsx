import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';
import { AuthProvider } from '@/lib/auth';

describe('Home', () => {
  it('renders hello world heading', () => {
    render(
      <AuthProvider user={null}>
        <Home />
      </AuthProvider>
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World!');
  });

  it('renders description text', () => {
    render(
      <AuthProvider user={null}>
        <Home />
      </AuthProvider>
    );
    expect(screen.getByText('Next.js is working')).toBeInTheDocument();
  });

  it('renders login link when user is not authenticated', () => {
    render(
      <AuthProvider user={null}>
        <Home />
      </AuthProvider>
    );
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('renders user name when user is authenticated', () => {
    render(
      <AuthProvider user={{ id: '1', login: 'testuser', full_name: 'Test User' }}>
        <Home />
      </AuthProvider>
    );
    expect(screen.getByRole('button', { name: 'Test User' })).toBeInTheDocument();
  });
});