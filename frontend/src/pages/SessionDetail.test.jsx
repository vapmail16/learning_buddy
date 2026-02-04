import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SessionDetail } from './SessionDetail';

const mockApi = vi.fn();
const mockApiUpload = vi.fn();
vi.mock('../api/client', () => ({
  api: (...args) => mockApi(...args),
  apiUpload: (...args) => mockApiUpload(...args),
}));

function renderSessionDetail(sessionId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/sessions/${sessionId}`]}>
      <Routes>
        <Route path="/sessions/:sessionId" element={<SessionDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SessionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApi.mockImplementation(() => new Promise(() => {}));
    renderSessionDetail();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows session title and upload/notes sections', async () => {
    mockApi
      .mockResolvedValueOnce({ id: 1, course_id: 1, title: 'Session 1' })
      .mockResolvedValueOnce({ note: null, uploads: [] });
    renderSessionDetail();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Session 1' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /uploads/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByText(/upload image or pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit notes/i })).toBeInTheDocument();
  });

  it('shows empty notes message when no note', async () => {
    mockApi
      .mockResolvedValueOnce({ id: 1, course_id: 1, title: 'S1' })
      .mockResolvedValueOnce({ note: null, uploads: [] });
    renderSessionDetail();
    await waitFor(() => {
      expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
    });
  });

  it('shows note content when note exists', async () => {
    mockApi
      .mockResolvedValueOnce({ id: 1, course_id: 1, title: 'S1' })
      .mockResolvedValueOnce({
        note: { id: 1, content: 'My note text', session_id: 1 },
        uploads: [],
      });
    renderSessionDetail();
    await waitFor(() => {
      expect(screen.getByText('My note text')).toBeInTheDocument();
    });
  });

  it('shows upload list when uploads exist', async () => {
    mockApi
      .mockResolvedValueOnce({ id: 1, course_id: 1, title: 'S1' })
      .mockResolvedValueOnce({
        note: null,
        uploads: [{ id: 1, original_filename: 'photo.png' }],
      });
    renderSessionDetail();
    await waitFor(() => {
      expect(screen.getByText('photo.png')).toBeInTheDocument();
    });
  });

  it('shows error when API fails', async () => {
    mockApi.mockRejectedValue(new Error('Session not found'));
    renderSessionDetail();
    await waitFor(() => {
      expect(screen.getByText('Session not found')).toBeInTheDocument();
    });
  });

  it('shows Uploading & processing when uploading', async () => {
    mockApi
      .mockResolvedValueOnce({ id: 1, course_id: 1, title: 'S1' })
      .mockResolvedValueOnce({ note: null, uploads: [] });
    mockApiUpload.mockImplementation(() => new Promise(() => {}));
    renderSessionDetail();
    await waitFor(() => {
      expect(screen.getByText(/upload image or pdf/i)).toBeInTheDocument();
    });
    const input = document.querySelector('input[type="file"]');
    const file = new File(['x'], 'img.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await waitFor(() => {
      expect(screen.getByText(/uploading & processing/i)).toBeInTheDocument();
    });
  });

  it('refetches notes after upload and shows extracted content', async () => {
    mockApi
      .mockResolvedValueOnce({ id: 1, course_id: 1, title: 'S1' })
      .mockResolvedValueOnce({ note: null, uploads: [] })
      .mockResolvedValueOnce({
        note: {
          id: 1,
          content: 'Extracted text',
          table_data: [{ rows: [['A', 'B']] }],
          highlights: [{ text: 'highlight' }],
        },
        uploads: [{ id: 1, original_filename: 'img.png' }],
      });
    mockApiUpload.mockResolvedValue({ id: 1, original_filename: 'img.png' });
    renderSessionDetail();
    await waitFor(() => {
      expect(screen.getByText(/upload image or pdf/i)).toBeInTheDocument();
    });
    const input = document.querySelector('input[type="file"]');
    const file = new File(['x'], 'img.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await waitFor(() => {
      expect(screen.getByText('Extracted text')).toBeInTheDocument();
    });
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('highlight')).toBeInTheDocument();
  });
});
