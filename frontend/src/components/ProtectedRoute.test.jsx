import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  it('renders children when token is present', () => {
    mockUseAuth.mockReturnValue({ token: 'fake-token' });
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <ProtectedRoute><span>Protected content</span></ProtectedRoute>
          } />
          <Route path="/login" element={<span>Login page</span>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirects to login when token is absent', () => {
    mockUseAuth.mockReturnValue({ token: null });
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <ProtectedRoute><span>Protected content</span></ProtectedRoute>
          } />
          <Route path="/login" element={<span>Login page</span>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
