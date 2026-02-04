import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';

const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand link', () => {
    mockUseAuth.mockReturnValue({ token: null, user: null, logout: vi.fn() });
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Home</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /learning buddy/i })).toBeInTheDocument();
  });

  it('shows Login and Register when not authenticated', () => {
    mockUseAuth.mockReturnValue({ token: null, user: null, logout: vi.fn() });
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Home</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('shows Courses and Logout when authenticated', () => {
    mockUseAuth.mockReturnValue({
      token: 'fake-token',
      user: { email: 'test@example.com' },
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Home</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /courses/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders outlet content', () => {
    mockUseAuth.mockReturnValue({ token: null, user: null, logout: vi.fn() });
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Home content</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Home content')).toBeInTheDocument();
  });
});
