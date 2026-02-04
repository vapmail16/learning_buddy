import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiUpload } from '../api/client';
import { AuthImage } from '../components/AuthImage';
import './SessionDetail.css';

/** @typedef {{ type: 'text', value: string } | { type: 'image', uploadId: number }} Block */

function getBlocksFromNote(note) {
  if (note?.blocks?.length) return note.blocks;
  if (note?.content != null && note.content !== '') {
    return [{ type: 'text', value: note.content }];
  }
  return [];
}

export function SessionDetail() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [notesData, setNotesData] = useState({ note: null, uploads: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'uploading'|'success'|'error', message: string }
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [blocks, setBlocks] = useState(/** @type {Block[]} */ ([]));
  const [saving, setSaving] = useState(false);
  const [uploadsListOpen, setUploadsListOpen] = useState(false); // collapsed by default so list doesn't dominate
  const [lightboxUploadId, setLightboxUploadId] = useState(/** @type {number | null} */ (null));
  const lightboxCloseRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

  useEffect(() => {
    if (lightboxUploadId != null) {
      lightboxCloseRef.current?.focus();
    }
  }, [lightboxUploadId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api(`/sessions/${sessionId}`),
      api(`/notes/sessions/${sessionId}`),
    ])
      .then(([s, nd]) => {
        if (!cancelled) {
          setSession(s);
          setNotesData(nd);
          setContent(nd.note?.content ?? '');
          setBlocks(getBlocksFromNote(nd.note));
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sessionId]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadStatus({ type: 'uploading', message: `Uploading ${file.name}… Extracting text into notes…` });
    setUploading(true);
    try {
      const upload = await apiUpload(`/uploads/sessions/${sessionId}`, file);
      setNotesData((prev) => ({
        ...prev,
        uploads: [...(prev.uploads || []), upload],
      }));
      const nd = await api(`/notes/sessions/${sessionId}`);
      setNotesData((prev) => ({ ...prev, note: nd.note, uploads: nd.uploads ?? prev.uploads }));
      setContent(nd.note?.content ?? '');
      setBlocks(getBlocksFromNote(nd.note));
      const hasNotes = !!(nd.note?.content?.trim() || (nd.note?.table_data?.length) || (nd.note?.highlights?.length));
      const notesUpdated = upload.notesUpdated === true || hasNotes;
      setUploadStatus({
        type: 'success',
        message: notesUpdated
          ? 'Upload complete. Notes updated.'
          : 'Upload complete. No text could be extracted (extraction service may be off, or file may be scanned/image-only).',
      });
      setTimeout(() => setUploadStatus(null), 6000);
      e.target.value = '';
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveNote() {
    setError('');
    setSaving(true);
    try {
      const body = blocks.length ? { blocks } : { content };
      const note = await api(`/notes/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setNotesData((prev) => ({ ...prev, note }));
      setBlocks(getBlocksFromNote(note));
      setContent(note?.content ?? '');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    setBlocks(getBlocksFromNote(notesData.note));
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setContent(notesData.note?.content ?? '');
    setBlocks(getBlocksFromNote(notesData.note));
  }

  function addTextBlock() {
    setBlocks((prev) => [...prev, { type: 'text', value: '' }]);
  }

  function addTextBlockAtIndex(index) {
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index, 0, { type: 'text', value: '' });
      return next;
    });
  }

  function insertImageAtIndex(index, uploadId) {
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index, 0, { type: 'image', uploadId });
      return next;
    });
  }

  function updateBlock(index, value) {
    setBlocks((prev) => {
      const next = [...prev];
      if (next[index]?.type === 'text') next[index] = { type: 'text', value };
      return next;
    });
  }

  function removeBlock(index) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function moveBlock(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
      next.splice(insertAt, 0, removed);
      return next;
    });
  }

  function handleBlockDragStart(e, index) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setData('application/x-block-index', String(index));
    e.currentTarget.closest('.notes-block-card')?.classList.add('notes-block-dragging');
  }

  function handleBlockDragEnd(e) {
    e.currentTarget.closest('.notes-block-card')?.classList.remove('notes-block-dragging');
  }

  function handleBlockDragOver(e, dropIndex) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.closest('.notes-block-card')?.classList.add('notes-block-drag-over');
  }

  function handleBlockDragLeave(e) {
    e.currentTarget.closest('.notes-block-card')?.classList.remove('notes-block-drag-over');
  }

  function handleBlockDrop(e, dropIndex) {
    e.preventDefault();
    e.currentTarget.closest('.notes-block-card')?.classList.remove('notes-block-drag-over');
    const fromIndex = parseInt(e.dataTransfer.getData('application/x-block-index'), 10);
    if (Number.isNaN(fromIndex)) return;
    moveBlock(fromIndex, dropIndex);
  }

  if (loading) return <p className="loading">Loading…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!session) return <p>Session not found.</p>;

  const note = notesData.note;
  const uploads = notesData.uploads || [];

  return (
    <div className="session-detail">
      <nav className="breadcrumb">
        <Link to="/">Courses</Link>
        <span> / </span>
        <Link to={`/courses/${session.course_id}`}>Session</Link>
        <span> / </span>
        <span>{session.title}</span>
      </nav>
      <h1>{session.title}</h1>

      <section className="uploads-section">
        <h2>Uploads</h2>
        {uploadStatus && (
          <div className={`upload-status upload-status--${uploadStatus.type}`} role="status" aria-live="polite">
            {uploadStatus.type === 'uploading' && <span className="upload-status-spinner" aria-hidden />}
            <span className="upload-status-message">{uploadStatus.message}</span>
          </div>
        )}
        <label className="upload-label">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading ? 'Uploading & processing…' : 'Upload image or PDF'}
        </label>
        {uploads.length > 0 && (
          <div className="uploads-list-wrap">
            <button
              type="button"
              className="uploads-list-toggle"
              onClick={() => setUploadsListOpen((open) => !open)}
              aria-expanded={uploadsListOpen}
            >
              {uploadsListOpen ? 'Hide' : 'Show'} documents ({uploads.length})
            </button>
            {uploadsListOpen && (
              <ul className="uploads-list">
                {uploads.map((u) => (
                  <li key={u.id}>{u.original_filename}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="notes-section">
        <h2>Notes</h2>
        {editing ? (
          <div className="notes-edit">
            <div className="notes-blocks-edit">
              {blocks.map((block, i) => (
                <div key={i}>
                  <div className="notes-gap-insert">
                    <button type="button" className="notes-gap-add-text" onClick={() => addTextBlockAtIndex(i)} disabled={saving}>
                      Add text
                    </button>
                    {uploads.length > 0 && (
                      <label className="notes-insert-image-inline">
                        <span className="notes-insert-image-label">Insert image:</span>
                        <select
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            if (id) insertImageAtIndex(i, id);
                            e.target.value = '';
                          }}
                          disabled={saving}
                        >
                          <option value="">— here —</option>
                          {uploads.map((u) => (
                            <option key={u.id} value={u.id}>{u.original_filename}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <div
                    className="notes-block-card"
                    onDragOver={(e) => handleBlockDragOver(e, i)}
                    onDragLeave={handleBlockDragLeave}
                    onDrop={(e) => handleBlockDrop(e, i)}
                  >
                    <span
                      className="notes-block-drag-handle"
                      draggable
                      onDragStart={(e) => handleBlockDragStart(e, i)}
                      onDragEnd={handleBlockDragEnd}
                      title="Drag to reorder"
                      aria-label="Drag to reorder block"
                    >
                      ⋮⋮
                    </span>
                    <div className="notes-block-edit">
                      {block.type === 'text' ? (
                        <>
                          <textarea
                            value={block.value}
                            onChange={(e) => updateBlock(i, e.target.value)}
                            placeholder="Write your note here…"
                            rows={8}
                            disabled={saving}
                          />
                          <button type="button" className="notes-block-remove" onClick={() => removeBlock(i)} disabled={saving}>
                            Remove text block
                          </button>
                        </>
                      ) : (
                        <div className="notes-block-image-edit">
                          <div
                            className="notes-image-click-wrap"
                            role="button"
                            tabIndex={0}
                            onClick={() => setLightboxUploadId(block.uploadId)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxUploadId(block.uploadId); } }}
                            title="Click to view larger"
                          >
                            <AuthImage uploadId={block.uploadId} alt="" className="notes-embed-img" />
                          </div>
                          <button type="button" className="notes-block-remove" onClick={() => removeBlock(i)} disabled={saving}>
                            Remove image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="notes-gap-insert">
                <button type="button" className="notes-gap-add-text" onClick={() => addTextBlockAtIndex(blocks.length)} disabled={saving}>
                  Add text
                </button>
                {uploads.length > 0 && (
                  <label className="notes-insert-image-inline">
                    <span className="notes-insert-image-label">Insert image:</span>
                    <select
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        if (id) insertImageAtIndex(blocks.length, id);
                        e.target.value = '';
                      }}
                      disabled={saving}
                    >
                      <option value="">— here —</option>
                      {uploads.map((u) => (
                        <option key={u.id} value={u.id}>{u.original_filename}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
            <div className="notes-actions">
              <button type="button" onClick={handleSaveNote} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={cancelEditing}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="notes-view">
            <div className="notes-content">
              {note?.blocks?.length > 0 ? (
                <div className="notes-blocks">
                  {note.blocks.map((block, i) => (
                    block.type === 'text' ? (
                      <div key={i} className="notes-block-text">
                        {block.value ? <pre className="notes-text">{block.value}</pre> : <br />}
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="notes-block-image notes-image-click-wrap"
                        role="button"
                        tabIndex={0}
                        onClick={() => setLightboxUploadId(block.uploadId)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxUploadId(block.uploadId); } }}
                        title="Click to view larger"
                      >
                        <AuthImage uploadId={block.uploadId} alt="" className="notes-embed-img" />
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <>
                  {note?.content ? (
                    <pre className="notes-text">{note.content}</pre>
                  ) : (
                    !note?.table_data?.length && !note?.highlights?.length && (
                      <p className="notes-empty">No notes yet. Add content and save.</p>
                    )
                  )}
                  {note?.table_data?.length > 0 && (
                    <div className="notes-tables">
                      {note.table_data.map((t, i) => (
                        <table key={i} className="notes-table">
                          <tbody>
                            {t.rows?.map((row, ri) => (
                              <tr key={ri}>
                                {row.map((cell, ci) => (
                                  <td key={ci}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ))}
                    </div>
                  )}
                  {note?.highlights?.length > 0 && (
                    <ul className="notes-highlights">
                      {note.highlights.map((h, i) => (
                        <li key={i}>{h.text}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
            <button type="button" className="notes-edit-btn" onClick={startEditing}>
              Edit notes
            </button>
          </div>
        )}
      </section>

      {lightboxUploadId != null && (
        <div
          className="notes-lightbox-backdrop"
          onClick={() => setLightboxUploadId(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setLightboxUploadId(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            ref={lightboxCloseRef}
            type="button"
            className="notes-lightbox-close"
            onClick={() => setLightboxUploadId(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setLightboxUploadId(null); }}
            aria-label="Close (Escape)"
          >
            ×
          </button>
          <div className="notes-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <AuthImage uploadId={lightboxUploadId} alt="Preview" className="notes-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}
