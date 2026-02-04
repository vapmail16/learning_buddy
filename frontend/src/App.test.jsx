import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './App';

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('App', () => {
  it('renders layout with brand', () => {
    renderApp('/');
    expect(screen.getByRole('link', { name: /learning buddy/i })).toBeInTheDocument();
  });

  it('shows login and register links when not authenticated', () => {
    renderApp('/login');
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    const registerLinks = screen.getAllByRole('link', { name: /register/i });
    expect(registerLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders login page at /login', () => {
    renderApp('/login');
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });

  it('renders register page at /register', () => {
    renderApp('/register');
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
  });
});
