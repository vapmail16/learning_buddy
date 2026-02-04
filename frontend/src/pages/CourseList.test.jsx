import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CourseList } from './CourseList';

const mockApi = vi.fn();
vi.mock('../api/client', () => ({
  api: (...args) => mockApi(...args),
}));

describe('CourseList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApi.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading courses/i)).toBeInTheDocument();
  });

  it('shows empty list when no courses', async () => {
    mockApi.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/no courses yet/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /courses/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/new course name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add course/i })).toBeInTheDocument();
  });

  it('shows course links when courses exist', async () => {
    mockApi.mockResolvedValue([
      { id: 1, name: 'Astrology 101' },
      { id: 2, name: 'Math' },
    ]);
    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Astrology 101' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Math' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Astrology 101' })).toHaveAttribute('href', '/courses/1');
  });

  it('shows error when API fails', async () => {
    mockApi.mockRejectedValue(new Error('Network error'));
    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
