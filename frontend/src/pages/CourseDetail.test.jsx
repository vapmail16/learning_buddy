import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CourseDetail } from './CourseDetail';

const mockApi = vi.fn();
vi.mock('../api/client', () => ({
  api: (...args) => mockApi(...args),
}));

function renderCourseDetail(courseId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/courses/${courseId}`]}>
      <Routes>
        <Route path="/courses/:courseId" element={<CourseDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CourseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApi.mockImplementation(() => new Promise(() => {}));
    renderCourseDetail();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows course name and empty sessions', async () => {
    mockApi
      .mockResolvedValueOnce({ id: 1, name: 'Astrology 101', user_id: 1 })
      .mockResolvedValueOnce([]);
    renderCourseDetail();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Astrology 101' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /sessions/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/new session title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add session/i })).toBeInTheDocument();
    expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
  });

  it('shows session links when sessions exist', async () => {
    mockApi
      .mockResolvedValueOnce({ id: 1, name: 'Course', user_id: 1 })
      .mockResolvedValueOnce([
        { id: 10, course_id: 1, title: 'Session 1' },
        { id: 11, course_id: 1, title: 'Session 2' },
      ]);
    renderCourseDetail();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Session 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Session 2' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Session 1' })).toHaveAttribute('href', '/sessions/10');
  });

  it('shows error when API fails', async () => {
    mockApi.mockRejectedValue(new Error('Not found'));
    renderCourseDetail();
    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });
});
