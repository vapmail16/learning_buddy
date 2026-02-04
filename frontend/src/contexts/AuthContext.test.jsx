import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function TestConsumer() {
  const { token, user } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides null token and user initially', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    expect(() => {
      render(<TestConsumer />);
    }).toThrow(/useAuth must be used within AuthProvider/);
  });
});
