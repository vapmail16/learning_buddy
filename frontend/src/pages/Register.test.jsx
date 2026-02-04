import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { Register } from './Register';

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Register', () => {
  it('renders register form with email and password', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('shows link to login', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });
});
